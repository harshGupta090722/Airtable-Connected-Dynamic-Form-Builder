import mongoose from "mongoose";

const { Schema } = mongoose;

const WebhookSchema = new Schema(
  {
    webhookId: { type: String, required: true, unique: true, index: true },
    macSecretBase64: { type: String, required: true, select: false },
    notificationUrl: { type: String, required: true },
    baseId: { type: String, default: null },
    cursorForNextPayload: { type: Number, default: 1 },
    lastBaseTransactionNumber: { type: Number, default: 0 },
    areNotificationsEnabled: { type: Boolean, default: true },
    isHookEnabled: { type: Boolean, default: true },
    expirationTime: { type: Date, default: null },
    lastPayloadFetchTime: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WebhookSchema.methods.getMacSecretBuffer = function () {
  if (!this.macSecretBase64) return null;
  return Buffer.from(this.macSecretBase64, "base64");
};

WebhookSchema.statics.upsertFromCreateResponse = async function (
  responseData,
  opts = {}
) {
  if (!responseData || !responseData.id)
    throw new Error("Invalid create response: missing id");

  const existing = await this.findOne({ webhookId: responseData.id }).exec();

  const payload = {
    webhookId: responseData.id,
    macSecretBase64: responseData.macSecretBase64,
    notificationUrl: opts.notificationUrl,
    expirationTime: responseData.expirationTime
      ? new Date(responseData.expirationTime)
      : null,
    baseId: opts.baseId ?? null,
  };

  if (existing) {
    Object.assign(existing, payload);
    return existing.save();
  }

  return this.create(payload);
};

const Webhook =
  mongoose.models.Webhook || mongoose.model("Webhook", WebhookSchema);

export default Webhook;