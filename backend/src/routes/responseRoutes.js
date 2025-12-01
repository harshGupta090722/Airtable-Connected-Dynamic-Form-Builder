
import express from "express";
import { auth } from "../middleware/auth.js";
import Form from "../models/form.model.js";
import Response from "../models/response.model.js";
import { createRecord } from "../config/airtableClient.js";

const router = express.Router();


function validateAnswers(form, answers) {
  const errors = [];

  if (!answers || typeof answers !== "object") {
    errors.push("answers must be an object");
    return errors;
  }

  for (const q of form.questions) {

    if (q.required) {
      const value = answers[q.questionKey];

      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        errors.push(`Missing required answer for questionKey: ${q.questionKey}`);
      }
    }
  }

  return errors;
}

router.post("/:formId/responses", auth, async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findOne({
      _id: formId,
      owner: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const errors = validateAnswers(form, answers);
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const airtableFields = {};

    for (const q of form.questions) {
      if (
        !answers ||
        !Object.prototype.hasOwnProperty.call(answers, q.questionKey)
      ) {
        continue;
      }

      const value = answers[q.questionKey];


      if (value === undefined || value === null || value === "") continue;


      if (q.type === "attachment") {
        continue;
      }

      airtableFields[q.airtableFieldId] = value;
    }


    let airtableRecord;
    try {
      airtableRecord = await createRecord({
        baseId: form.airtableBaseId,
        tableId: form.airtableTableId,
        fields: airtableFields,
        accessToken: req.user.accessToken, 
      });
    } catch (airErr) {
      console.error(
        "Airtable error when creating record:",
        airErr?.response?.data || airErr.message || airErr
      );
      return res.status(400).json({
        message: "Airtable rejected the data",
        details: airErr?.response?.data || airErr.message,
      });
    }

    const responseDoc = await Response.create({
      form: form._id,
      airtableRecordId: airtableRecord.id,
      answers,
    });

    return res.status(201).json({ response: responseDoc });
  } catch (err) {
    console.error("Error submitting response:", err);
    return res
      .status(500)
      .json({ message: "Failed to submit response" });
  }
});


router.get("/:formId/responses", auth, async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({
      _id: formId,
      owner: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const responses = await Response.find({ form: formId }).sort({
      createdAt: -1,
    });

    const data = responses.map((r) => ({
      id: r._id,
      airtableRecordId: r.airtableRecordId,
      deletedInAirtable: r.deletedInAirtable,
      createdAt: r.createdAt,
      answers: r.answers,
    }));

    return res.json({ responses: data });
  } catch (err) {
    console.error("Error fetching responses:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch responses" });
  }
});

export default router;