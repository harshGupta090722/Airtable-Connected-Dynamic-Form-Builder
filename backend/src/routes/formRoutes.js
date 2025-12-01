import express from "express";
import { auth } from "../middleware/auth.js";
import Form from "../models/form.model.js";

const router = express.Router();



router.post("/", auth, async (req, res) => {
  try {
    const { airtableBaseId, airtableTableId, title, questions } = req.body;

    if (!airtableBaseId || !airtableTableId) {
      return res
        .status(400)
        .json({ message: "airtableBaseId and airtableTableId are required" });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "questions must be a non-empty array" });
    }

    for (const q of questions) {
      if (!q.questionKey || !q.airtableFieldId || !q.label || !q.type) {
        return res.status(400).json({
          message:
            "Each question must have questionKey, airtableFieldId, label and type",
        });
      }
    }

    const form = await Form.create({
      owner: req.user._id,
      airtableBaseId,
      airtableTableId,
      title: title || "",
      questions,
    });

    return res.status(201).json({ form });
  } catch (err) {
    console.error("Error creating form:", err);
    return res.status(500).json({ message: "Failed to create form" });
  }
});


router.get("/:formId", auth, async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({
      _id: formId,
      owner: req.user._id, 
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    return res.json({ form });
  } catch (err) {
    console.error("Error fetching form:", err);
    return res.status(500).json({ message: "Failed to fetch form" });
  }
});



router.get("/", auth, async (req, res) => {
  try {
    const ownerId = req.user._id;

    const forms = await Form.find({ owner: ownerId }).sort({
      createdAt: -1,
    });

    return res.json({ forms });
  } catch (err) {
    console.error("Error fetching forms:", err);
    return res.status(500).json({ message: "Failed to fetch forms" });
  }
});


export default router;