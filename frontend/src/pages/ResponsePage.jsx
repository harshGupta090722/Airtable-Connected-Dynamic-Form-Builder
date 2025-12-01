import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function ResponsePage() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [formTitle, setFormTitle] = useState("");
  const [_questions, setQuestions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResponses() {
      try {
        setLoading(true);
        setError("");

        const [formRes, respRes] = await Promise.all([
          api.get(`/api/forms/${formId}`),
          api.get(`/api/forms/${formId}/responses`),
        ]);

        const form = formRes.data.form || formRes.data || {};
        setFormTitle(form.title || "Untitled Form");
        setQuestions(form.questions || []);

        const data = respRes.data.responses || respRes.data || [];
        setResponses(data);
      } catch (err) {
        console.error("Failed to load responses", err);
        setError("Failed to load responses.");
      } finally {
        setLoading(false);
      }
    }

    loadResponses();
  }, [formId]);

  function handleExportJson() {
    try {
      const blob = new Blob(
        [JSON.stringify(responses, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = formTitle || "form";
      link.download = `${safeTitle.replace(/\s+/g, "-").toLowerCase()}-responses.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export JSON", err);
      alert("Failed to export responses as JSON.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 bg-white shadow flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Responses</h1>
          <p className="text-sm text-gray-500">Form: {formTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 transition"
          >
            Export JSON
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div>Loading responses...</div>
        ) : responses.length === 0 ? (
          <div className="text-gray-500">No responses yet.</div>
        ) : (
          <div className="space-y-3">
            {responses.map((resp) => (
              <div
                key={resp._id || resp.id}
                className="bg-white rounded-md shadow p-4 text-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Response ID: {resp._id || resp.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {resp.deletedInAirtable ? "Deleted in Airtable" : "Active"}
                    {" • "}
                    {resp.createdAt
                      ? new Date(resp.createdAt).toLocaleString()
                      : ""}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}