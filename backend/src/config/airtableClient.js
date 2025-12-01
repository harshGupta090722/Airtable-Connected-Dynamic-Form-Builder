import fetch from "node-fetch";
import axios from "axios";

const API_BASE = process.env.AIRTABLE_API_BASE_URL || "https://api.airtable.com/v0";

export async function getBases(accessToken) {
  const res = await fetch(`${API_BASE}/meta/bases`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch bases");
  const data = await res.json();
  return data.bases || [];
}


export async function getTables(baseId, accessToken) {
  const res = await fetch(`${API_BASE}/meta/bases/${baseId}/tables`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch tables");
  const data = await res.json();
  return data.tables || [];
}


export async function getFields(baseId, tableId, accessToken) {
  const tables = await getTables(baseId, accessToken);
  const table = tables.find((t) => t.id === tableId);

  if (!table) throw new Error("Table not found");

  return table.fields || [];
}


export async function createRecord({ baseId, tableId, fields, accessToken }) {
  const url = `${API_BASE}/${baseId}/${tableId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields,
      typecast: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Airtable create record error:", err);
    throw new Error("Failed to create Airtable record");
  }

  return await res.json(); 
}


const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/bases/${process.env.AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
    "Content-Type": "application/json",
  },
});


export async function createAirtableWebhook() {
  const res = await airtableApi.post("/webhooks", {
    notificationUrl: process.env.WEBHOOK_PUBLIC_URL,
    specification: {
      options: {
        filters: {
          dataTypes: ["tableData"],
          recordChangeScope: "tbl8OtUDLZItyAYdU" 
        }
      }
    }
  });

  return res.data;
}



export async function listWebhookPayloads(webhookId, cursor) {
  const res = await airtableApi.get(`/webhooks/${webhookId}/payloads`, {
    params: cursor ? { cursor } : {},
  });

  return res.data; 
}