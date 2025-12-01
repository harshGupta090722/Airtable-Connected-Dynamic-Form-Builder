import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },

    airtableRecordId: {
      type: String,
      required: true,
    },

    answers: {
      type: Object,    
      required: true,
    },

    deletedInAirtable: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }   
);

const Response = mongoose.model("Response", responseSchema);

export default Response;