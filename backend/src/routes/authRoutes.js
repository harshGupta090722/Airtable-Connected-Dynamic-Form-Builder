
import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import fetch from "node-fetch"; 
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

dotenv.config();
const router = express.Router();


function base64url(buffer) {
  return buffer
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");
}

function generateCodeVerifier() {
  return base64url(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64url(hash);
}

const AIRTABLE_AUTH_URL = process.env.AIRTABLE_AUTH_URL;
const AIRTABLE_TOKEN_URL = process.env.AIRTABLE_TOKEN_URL;

router.get("/login", (req, res) => {
  
  const state = crypto.randomUUID();
  const code_verifier = generateCodeVerifier();
  const code_challenge = generateCodeChallenge(code_verifier);

  res.cookie("oauth_state", state, { httpOnly: true });
  res.cookie("code_verifier", code_verifier, { httpOnly: true });
  
  const params = new URLSearchParams({
    client_id: process.env.AIRTABLE_CLIENT_ID,
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    response_type: "code",
    scope: "data.records:read data.records:write schema.bases:read",
    state,
    code_challenge,
    code_challenge_method: "S256",
  });
  
  const url = `${AIRTABLE_AUTH_URL}?${params.toString()}`;
  return res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const code_verifier = req.cookies.code_verifier;  

  if (error) {
    return res
      .status(400)
      .json({ message: `Airtable error: ${error} - ${error_description}` });
  }

  if (!code) {
    return res.status(400).send("Missing ?code from Airtable");
  }

  if (!code_verifier) {
    return res.status(400).send("Missing code_verifier cookie for PKCE");
  }

  try {
    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(process.env.AIRTABLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        code_verifier,
        client_id: clientId,
      }),
    });

    const tokens = await response.json();
    console.log("Airtable token response:", response.status, tokens);

    if (!response.ok) {
      return res.status(500).json(tokens);
    }
  
    const { access_token, refresh_token, expires_in } = tokens;

    const profileRes = await fetch("https://api.airtable.com/v0/meta/whoami", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profile = await profileRes.json();
    console.log("Airtable profile:", profile);

    if (!profile.id) {
      return res.status(500).json({ message: "Failed to fetch Airtable user profile" });
    }

    const airtableUserId = profile.id;
    const email = profile.email;
    const name = profile.name;

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    const user = await User.findOneAndUpdate(
      { airtableUserId },
      {
        email,
        name,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.clearCookie("code_verifier");


    const redirectUrl = `${process.env.FRONTEND_URL}/?token=${jwtToken}`;

    console.log("Redirect Url",redirectUrl);
    return res.redirect(302, redirectUrl);

  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.status(500).send("Server error in OAuth callback");
  }
});

export default router;