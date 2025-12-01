import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { shouldShowQuestion } from "../utils/conditionalLogic";

export default function FormViewerPage() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/forms/${formId}`);
        const fetchedForm = res.data.form || res.data;
        setForm(fetchedForm);
      } catch (err) {
        console.error("Failed to load form", err);
        setError("Failed to load form.");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  function handleChange(question, value) {
    setAnswers((prev) => ({
      ...prev,
      [question.questionKey]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form) return;

    const visibleQuestions = (form.questions || []).filter((q) =>
      shouldShowQuestion(q.conditionalRules, answers)
    );

    for (const q of visibleQuestions) {
      const key = q.questionKey;
      if (q.required && (answers[key] === undefined || answers[key] === "")) {
        setError(`Please fill required question: "${q.label}"`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = { answers };

      await api.post(`/api/forms/${formId}/responses`, payload);

      setSuccess("Response submitted successfully.");
      setAnswers({});
      navigate(`/thank-you`);
    } catch (err) {
      console.error("Failed to submit response", err);
      setError("Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading form...</div>;
  }

  if (!form) {
    return <div className="p-4 text-red-600">Form not found.</div>;
  }

  const visibleQuestions = (form.questions || []).filter((q) =>
    shouldShowQuestion(q.conditionalRules, answers)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 bg-white shadow flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {form.title || "Untitled Form"}
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-100 text-green-700 px-4 py-2 text-sm">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-4 rounded-lg shadow"
        >
          {visibleQuestions.length === 0 ? (
            <p className="text-gray-500 text-sm">No questions to display.</p>
          ) : (
            visibleQuestions.map((q) => (
              <div key={q.questionKey} className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {q.label}{" "}
                  {q.required && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </label>

                {q.type === "shortText" ||
                q.type === "singleLineText" ||
                q.type === "text" ? (
                  <input
                    className="border rounded-md px-2 py-1 text-sm"
                    value={answers[q.questionKey] || ""}
                    onChange={(e) => handleChange(q, e.target.value)}
                  />
                ) : q.type === "number" ? (
                  <input
                    type="number"
                    className="border rounded-md px-2 py-1 text-sm"
                    value={answers[q.questionKey] || ""}
                    onChange={(e) => handleChange(q, e.target.value)}
                  />
                ) : q.type === "longText" ? (
                  <textarea
                    className="border rounded-md px-2 py-1 text-sm"
                    rows={3}
                    value={answers[q.questionKey] || ""}
                    onChange={(e) => handleChange(q, e.target.value)}
                  />
                ) : (
                  <input
                    className="border rounded-md px-2 py-1 text-sm"
                    value={answers[q.questionKey] || ""}
                    onChange={(e) => handleChange(q, e.target.value)}
                    placeholder={`Field type: ${q.type}`}
                  />
                )}
              </div>
            ))
          )}

          {visibleQuestions.length > 0 && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}