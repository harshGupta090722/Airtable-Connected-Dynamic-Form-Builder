// routes/webhookRoutes.js
import express from "express";
import axios from "axios";
import crypto from "crypto";
import Webhook from "../models/webhooks.model.js";
import Response from "../models/response.model.js";
import Form from "../models/form.model.js";

const router = express.Router();

const {
  AIRTABLE_PAT,
  AIRTABLE_BASE_ID,
  AIRTABLE_API_BASE_URL = "https://api.airtable.com/v0",
  WEBHOOK_PUBLIC_URL,
} = process.env;

function safeCompare(a, b) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

router.post("/airtable", async (req, res) => {
  try {
    console.log("➡️ Airtable ping received");

    let webhook = await Webhook.findOne({
      notificationUrl: WEBHOOK_PUBLIC_URL,
      deleted: false,
      isHookEnabled: true,
    })
      .select("+macSecretBase64")
      .exec();

    if (!webhook) {
      webhook = await Webhook.findOne({ deleted: false }).select("+macSecretBase64");
    }

    if (!webhook) {
      console.warn("⚠️ No webhook record found in DB.");
      return res.sendStatus(200);
    }

    const headerMac = req.headers["x-airtable-content-mac"];
    if (headerMac && webhook.macSecretBase64) {
      const macSecret = webhook.getMacSecretBuffer();
      const h = crypto.createHmac("sha256", macSecret);
      h.update(req.body);
      const expected = "hmac-sha256=" + h.digest("hex");

      if (!safeCompare(expected, headerMac)) {
        console.warn("⚠️ MAC mismatch");
        return res.sendStatus(200);
      }
    }

    res.sendStatus(200);

    processPayloads(webhook);

  } catch (err) {
    console.error("Webhook route error:", err);
    res.sendStatus(200);
  }
});

async function processPayloads(webhook) {
  const url = `${AIRTABLE_API_BASE_URL}/bases/${AIRTABLE_BASE_ID}/webhooks/${webhook.webhookId}/payloads?cursor=${webhook.cursorForNextPayload}`;

  let resp;
  try {
    resp = await axios.get(url, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }, timeout: 20000 });
  } catch (err) {
    console.error("Error fetching payloads from Airtable:", err.message || err);
    return;
  }

  console.log("payloads response:", JSON.stringify(resp.data, null, 2));

  const { cursor, payloads = [], mightHaveMore = false } = resp.data;

  webhook.cursorForNextPayload = cursor ?? webhook.cursorForNextPayload;
  webhook.lastPayloadFetchTime = new Date();
  try { await webhook.save(); } catch (e) { console.error("Error saving webhook cursor:", e); }

  if (!payloads.length) {
    console.log("No payloads to process.");
    return;
  }

  let defaultFormId = null;
  try {
    const anyForm = await Form?.findOne().select("_id").lean().exec();
    if (anyForm) defaultFormId = anyForm._id;
  } catch (e) {
    console.warn("Could not lookup Form for defaultFormId:", e.message || e);
  }

  for (const payload of payloads) {
    if (Array.isArray(payload.changedTables) && payload.changedTables.length > 0) {
      for (const table of payload.changedTables) {
        const tableId = table.id || null;
        const records = Array.isArray(table.records) ? table.records : [];
        for (const rec of records) {
          await processSingleRecord(rec, tableId, defaultFormId);
        }
      }
    }

    if (payload.changedTablesById && typeof payload.changedTablesById === "object") {
      for (const [tableId, tableObj] of Object.entries(payload.changedTablesById)) {
        const changedRecordsById = tableObj.changedRecordsById;
        if (changedRecordsById && typeof changedRecordsById === "object") {
          for (const [recId, recObj] of Object.entries(changedRecordsById)) {
            const current = recObj.current ?? recObj;
            const normalized = {
              id: recId,
              cellValuesByFieldId: (current.cellValuesByFieldId || null),
              cellValues: (current.cellValues || null),
              fields: (current.fields || null),
              deleted: current === null || recObj.deleted === true || recObj.changeType === "deleted" || false,
            };
            await processSingleRecord(normalized, tableId, defaultFormId);
          }
        }
      }
    }
  } 

  if (mightHaveMore) {
    console.log("mightHaveMore true — fetching next batch");
    await processPayloads(webhook);
  }

  console.log("Payload sync finished.");
}


async function processSingleRecord(rec, tableId, defaultFormId) {
  const id = rec.id;
  try {
    const isDeleted = rec.deleted === true || rec.changeType === "deleted";
    if (isDeleted) {
      const upd = await Response.findOneAndUpdate({ airtableRecordId: id }, { $set: { deletedInAirtable: true } }, { new: true }).exec();
      console.log(upd ? `Marked deleted: ${id}` : `Delete ping, no Response found: ${id}`);
      return;
    }

    const incoming = rec.cellValuesByFieldId ?? rec.cellValues ?? rec.fields ?? {};
    if (!incoming || Object.keys(incoming).length === 0) {
      console.log("No incoming fields for", id);
      return;
    }

    console.log("Record", id, "incoming keys:", Object.keys(incoming));

    let doc = await Response.findOne({ airtableRecordId: id }).exec();

    if (!doc) {
      if (!defaultFormId) {
        console.warn("Skipping create for", id, "- no form available and Response.form is required.");
        return;
      }
      try {
        doc = await Response.create({
          form: defaultFormId,
          airtableRecordId: id,
          answers: incoming,
          deletedInAirtable: false,
        });
        console.log("Created new Response:", id);
      } catch (createErr) {
        console.error("Error creating Response for", id, createErr && createErr.message ? createErr.message : createErr);
        return;
      }
    } else {
      const merged = Object.assign({}, doc.answers || {});
      for (const [key, val] of Object.entries(incoming)) {
        if (val === null || (typeof val === "string" && val.trim() === "")) {
          delete merged[key];
        } else {
          merged[key] = val;
        }
      }
      doc.answers = merged;
      doc.deletedInAirtable = false;
      try {
        await doc.save();
        console.log("Updated Response:", id);
      } catch (saveErr) {
        console.error("Error saving Response", id, saveErr && saveErr.message ? saveErr.message : saveErr);
      }
    }
  } catch (recordErr) {
    console.error("Error processing record", id, recordErr && recordErr.message ? recordErr.message : recordErr);
  }
}

export default router;