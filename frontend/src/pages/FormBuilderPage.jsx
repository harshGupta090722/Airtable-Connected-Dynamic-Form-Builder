import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import QuestionsEditor from "../components/QuestionsEditor";

export default function FormBuilderPage() {
  const navigate = useNavigate();

  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);

  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [title, setTitle] = useState("");

  const [questions, setQuestions] = useState([]);

  const [loadingBases, setLoadingBases] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

useEffect(() => {
  async function loadBases() {
    try {
      setLoadingBases(true);
      setError("");
      const res = await api.get("/api/airtable/bases");
      setBases(res.data.bases || []);
    } catch (err) {
      console.error("Failed to load bases", err);
      setError("Failed to load Airtable bases.");
    } finally {
      setLoadingBases(false);
    }
  }
  loadBases();
}, []);

useEffect(() => {
  if (!selectedBaseId) {
    setTables([]);
    setSelectedTableId("");
    setFields([]);
    setQuestions([]);
    return;
  }

  async function loadTables() {
    try {
      setLoadingTables(true);
      setError("");
      const res = await api.get("/api/airtable/tables", {
        params: { baseId: selectedBaseId },
      });

      setTables(res.data.tables || []);
    } catch (err) {
      console.error("Failed to load tables", err);
      setError("Failed to load tables for this base.");
    } finally {
      setLoadingTables(false);
    }
  }

  loadTables();
}, [selectedBaseId]);

useEffect(() => {
  if (!selectedBaseId || !selectedTableId) {
    setFields([]);
    setQuestions([]);
    return;
  }

  async function loadFields() {
    try {
      setLoadingFields(true);
      setError("");
      const res = await api.get("/api/airtable/fields", {
        params: {
          baseId: selectedBaseId,
          tableId: selectedTableId,
        },
      });

      const fetchedFields = res.data.fields || [];

      setFields(fetchedFields);

      setQuestions(
        fetchedFields.map((f) => ({
          fieldId: f.id,
          airtableFieldName: f.name,
          type: f.type,
          label: f.name,
          required: false,
          include: false, 
          conditional: null,
        }))
      );
    } catch (err) {
      console.error("Failed to load fields", err);
      setError("Failed to load fields for this table.");
    } finally {
      setLoadingFields(false);
    }
  }

  loadFields();
}, [selectedBaseId, selectedTableId]);



async function handleSaveForm(e) {
  e.preventDefault();
  setError("");

  const selectedQuestions = questions.filter((q) => q.include);

  if (!selectedBaseId || !selectedTableId) {
    setError("Please select a base and table.");
    return;
  }
  if (!title.trim()) {
    setError("Please enter a form title.");
    return;
  }
  if (selectedQuestions.length === 0) {
    setError("Please select at least one field for the form.");
    return;
  }

  try {
    setSaving(true);

    const questionKeyByFieldId = {};
    selectedQuestions.forEach((q) => {
      const key =
        (q.airtableFieldName || q.label).toLowerCase().replace(/\s+/g, "_") +
        "_q";
      questionKeyByFieldId[q.fieldId] = key;
    });

    const payload = {
      airtableBaseId: selectedBaseId,
      airtableTableId: selectedTableId,
      title: title.trim(),
      questions: selectedQuestions.map((q) => {
        const questionKey = questionKeyByFieldId[q.fieldId];

        let conditionalRules = null;

        if (
          q.conditional &&
          q.conditional.enabled &&
          q.conditional.dependsOnFieldId &&
          q.conditional.value !== ""
        ) {
          const dependsOnQuestionKey =
            questionKeyByFieldId[q.conditional.dependsOnFieldId];

          if (dependsOnQuestionKey) {
            conditionalRules = {
              logic: "AND",
              conditions: [
                {
                  questionKey: dependsOnQuestionKey,
                  operator: q.conditional.operator || "equals",
                  value: q.conditional.value,
                },
              ],
            };
          }
        }

        return {
          questionKey,
          airtableFieldId: q.fieldId, 
          label: q.label,
          type: q.type,
          required: q.required,
          conditionalRules,
        };
      }),
    };

    const res = await api.post("/api/forms", payload);

    const createdForm = res.data.form || res.data;
    console.log(createdForm);
    navigate("/dashboard");
  } catch (err) {
    console.error("Failed to save form", err.response?.data || err);
    setError(err.response?.data?.message || "Failed to save form.");
  } finally {
    setSaving(false);
  }
}


return (
  <div className="min-h-screen bg-gray-50">
    <header className="px-6 py-4 bg-white shadow">
      <h1 className="text-xl font-semibold">Create New Form</h1>
    </header>

    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <section className="bg-white p-4 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Airtable Base
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedBaseId}
              onChange={(e) => setSelectedBaseId(e.target.value)}
            >
              <option value="">Select a base...</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {loadingBases && (
              <p className="text-xs text-gray-500 mt-1">Loading bases...</p>
            )}
          </div>

          {selectedBaseId && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Airtable Table
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
              >
                <option value="">Select a table...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {loadingTables && (
                <p className="text-xs text-gray-500 mt-1">Loading tables...</p>
              )}
            </div>
          )}

          {selectedTableId && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Form Title
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Customer Feedback Form"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}
        </section>

        {selectedTableId && (
          <section className="bg-white p-4 rounded-lg shadow">
            {loadingFields ? (
              <p>Loading fields...</p>
            ) : fields.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No fields returned for this table.
              </p>
            ) : (
              <QuestionsEditor
                questions={questions}
                setQuestions={setQuestions}
              />
            )}
          </section>
        )}

        {selectedTableId && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Form"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}