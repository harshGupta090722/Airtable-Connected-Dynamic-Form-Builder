import express from "express";
import Response from "../models/response.model.js";
import { listWebhookPayloads } from "../config/airtableClient.js";

const router = express.Router();

async function processAirtableChangesFromPayloads(payloads) {
  for (const payload of payloads) {

    const bases = payload.bases || [];

    for (const base of bases) {
      const changes = base.changes || [];

      for (const change of changes) {
        const recordId = change.recordId;
        const isDeleted = change.recordDeleted;
        const fields = change.record?.cellValuesByFieldId || null;

        if (isDeleted) {
          console.log("Airtable DELETE:", recordId);

          await Response.findOneAndUpdate(
            { airtableRecordId: recordId },
            {
              deletedInAirtable: true,
              updatedAt: new Date()
            }
          );

          continue;
        }

        if (fields) {
          console.log("Airtable UPDATE:", recordId);

          await Response.findOneAndUpdate(
            { airtableRecordId: recordId },
            {
              answers: fields,
              deletedInAirtable: false,
              updatedAt: new Date()
            },
            { new: true }
          );

          continue;
        }


        if (!isDeleted && !fields && change.record) {
          console.log("Airtable CREATE:", recordId);

          await Response.findOneAndUpdate(
            { airtableRecordId: recordId },
            {
              answers: fields,
              deletedInAirtable: false,
              updatedAt: new Date()
            },
            { new: true }
          );
        }
      }
    }
  }
}


router.post("/airtable", async (req, res) => {
  try {
    console.log("Received Airtable ping:", req.body);

    res.status(200).json({ ok: true });

    const webhookId = process.env.AIRTABLE_WEBHOOK_ID;
    if (!webhookId) {
      console.error("No AIRTABLE_WEBHOOK_ID set in env");
      return;
    }

    const data = await listWebhookPayloads(webhookId);
    const { payloads } = data;

    console.log("Fetched webhook payloads:", payloads?.length || 0);

    if (payloads && payloads.length > 0) {
      await processAirtableChangesFromPayloads(payloads);
    }
  } catch (err) {
    console.error(
      "Error handling Airtable webhook ping:",
      err.response?.data || err.message
    );

  }
});

export default router;