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
    resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
      timeout: 20000,
    });
  } catch (err) {
    console.error("Error fetching payloads from Airtable:", err.message || err);
    return;
  }
  
  const { cursor, payloads = [], mightHaveMore = false } = resp.data;
  
  webhook.cursorForNextPayload = cursor ?? webhook.cursorForNextPayload;
  webhook.lastPayloadFetchTime = new Date();
  try {
    await webhook.save();
  } catch (e) {
    console.error("Error saving webhook cursor:", e);
  }
  
  if (!payloads.length) {
    console.log("No payloads to process.");
    return;
  }
  
  for (const payload of payloads) {
    if (payload.changedTablesById) {
      for (const [tableId, tableObj] of Object.entries(payload.changedTablesById)) {
        const changedRecordsById = tableObj.changedRecordsById || {};
        for (const [recId, recObj] of Object.entries(changedRecordsById)) {
          console.log("Harsh RAW RECORD EVENT", {
            tableId,
            recordId: recId,
            recObj,
          });
          
          const current = recObj.current ?? recObj;
          const normalized = {
            id: recId,
            cellValuesByFieldId: current?.cellValuesByFieldId || {},
            deleted:
            current === null ||
            recObj.deleted === true ||
            recObj.changeType === "deleted",
          };
          console.log("🔎 NORMALIZED RECORD", {
            recordId: normalized.id,
            deleted: normalized.deleted,
            cellKeys: Object.keys(normalized.cellValuesByFieldId || {}),
          });
          
          await processSingleRecord(normalized, tableId);
        }
      }
    }
  }
  
  if (mightHaveMore) {
    await processPayloads(webhook);
  }
  
  console.log("Payload sync finished.");
}

async function processSingleRecord(rec, tableId) {
  const id = rec.id;
  
  try {
    if (rec.deleted) {
      const upd = await Response.findOneAndUpdate(
        { airtableRecordId: id },
        { $set: { deletedInAirtable: true } },
        { new: true }
      );
      console.log(upd ? `Marked deleted: ${id}` : `Delete ping, no Response found: ${id}`);
      return;
    }
    
    const form = await Form.findOne({ airtableTableId: tableId }).lean();
    if (!form) {
      console.warn("No form found for tableId:", tableId);
      return;
    }
    
    const fieldIdToQuestionKey = {};
    form.questions.forEach(q => {
      fieldIdToQuestionKey[q.airtableFieldId] = q.questionKey;
    });
    
    const translated = {};
    for (const [fieldId, value] of Object.entries(rec.cellValuesByFieldId || {})) {
      const questionKey = fieldIdToQuestionKey[fieldId];
      if (!questionKey) continue;
      
      if (value === null || (typeof value === "string" && value.trim() === "")) {
        continue;
      }
      
      translated[questionKey] = value;
    }
    
    if (!Object.keys(translated).length) {
      console.log("No mapped fields for", id);
      return;
    }
    
    let doc = await Response.findOne({ airtableRecordId: id });
    
    if (!doc) {
      doc = await Response.create({
        form: form._id,
        airtableRecordId: id,
        answers: translated,
        deletedInAirtable: false,
      });
      console.log("Created new Response:", id);
    } else {
      doc.answers = { ...(doc.answers || {}), ...translated };
      
      Object.keys(doc.answers).forEach(k => {
        if (k.startsWith("fld")) delete doc.answers[k];
      });
      
      doc.deletedInAirtable = false;
      await doc.save();
      console.log("Updated Response:", id);
    }
  } catch (err) {
    console.error("Error processing record", id, err.message || err);
  }
}

export default router;