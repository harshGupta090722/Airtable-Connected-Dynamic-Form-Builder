import express from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/user.model.js";
import {
  getBases,
  getTables,
  getFields,
} from "../config/airtableClient.js";
import { createAirtableWebhook } from "../config/airtableClient.js";

const router = express.Router();

function mapFieldType(airtableType) {
  switch (airtableType) {
    case "singleLineText":
      return "shortText";
    case "multilineText":
      return "longText";
    case "singleSelect":
      return "singleSelect";
    case "multipleSelects":
      return "multiSelect";

    case "url":
      return "shortText";

    case "multipleAttachments":
      return "attachment";

    default:
      return null;
  }
}

async function getCurrentUser(req) {
  const user = await User.findById(req.userId);
  if (!user || !user.accessToken) {
    const err = new Error("User not authenticated with Airtable");
    err.statusCode = 401;
    throw err;
  }
  return user;
}

router.get("/bases", auth, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const bases = await getBases(user.accessToken);

    return res.json({
      bases: bases.map((b) => ({
        id: b.id,
        name: b.name,
        permissionLevel: b.permissionLevel,
      })),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.get("/tables", auth, async (req, res) => {
  try {
    const { baseId } = req.query;
    if (!baseId) return res.status(400).json({ error: "baseId is required" });

    const user = await getCurrentUser(req);
    const tables = await getTables(baseId, user.accessToken);

    return res.json({
      tables: tables.map((t) => ({ id: t.id, name: t.name })),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.get("/fields", auth, async (req, res) => {
  try {
    const { baseId, tableId } = req.query;
    if (!baseId || !tableId)
      return res.status(400).json({ error: "baseId & tableId required" });

    const user = await getCurrentUser(req);
    const fields = await getFields(baseId, tableId, user.accessToken);

    const cleaned = fields
      .map((f) => {
        const mapped = mapFieldType(f.type);
        if (!mapped) return null;

        return {
          id: f.id,
          name: f.name,
          type: mapped,
          airtableType: f.type,
          options: f.options || null,
        };
      })
      .filter(Boolean);

    return res.json({ fields: cleaned });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});


router.post("/webhooks/create", async (req, res) => {
   console.log("hitting the route correctly !")
  try {
    const data = await createAirtableWebhook();

    console.log("Webhook created:", data);

    return res.status(201).json({
      webhookId: data.id,
      macSecretBase64: data.macSecretBase64,
      expirationTime: data.expirationTime,
    });
  } catch (err) {
    console.error("Error creating webhook:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create webhook" });
  }
});


export default router;