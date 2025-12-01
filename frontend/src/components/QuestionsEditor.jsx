
import QuestionRenderer from "./QuestionRenderer";

export default function QuestionsEditor({ questions, setQuestions }) {
  function toggleInclude(fieldId) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.fieldId === fieldId ? { ...q, include: !q.include } : q
      )
    );
  }

  function updateLabel(fieldId, newLabel) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.fieldId === fieldId ? { ...q, label: newLabel } : q
      )
    );
  }

  function toggleRequired(fieldId) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.fieldId === fieldId ? { ...q, required: !q.required } : q
      )
    );
  }

  function updateConditional(fieldId, patch) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.fieldId !== fieldId) return q;

        const existing = q.conditional || {
          enabled: false,
          dependsOnFieldId: "",
          operator: "equals",
          value: "",
        };

        return {
          ...q,
          conditional: { ...existing, ...patch },
        };
      })
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold mb-2">Select Questions</h2>
      <p className="text-xs text-gray-500 mb-4">
        Choose which Airtable fields to include in your form and adjust labels /
        required flags.
      </p>

      {questions.map((q) => {
        const otherIncludedQuestions = questions.filter(
          (other) => other.fieldId !== q.fieldId && other.include
        );
        const cond = q.conditional || {
          enabled: false,
          dependsOnFieldId: "",
          operator: "equals",
          value: "",
        };

        return (
          <div
            key={q.fieldId}
            className="border rounded-md p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={q.include}
                  onChange={() => toggleInclude(q.fieldId)}
                />
                <span className="text-sm font-medium">
                  {q.airtableFieldName}{" "}
                  <span className="text-xs text-gray-400">({q.type})</span>
                </span>
              </div>

              {q.include && (
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={() => toggleRequired(q.fieldId)}
                  />
                  Required
                </label>
              )}
            </div>

            {q.include && (
              <>
                <div className="mt-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Question Label
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={q.label}
                    onChange={(e) => updateLabel(q.fieldId, e.target.value)}
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Preview
                  </label>
                  <QuestionRenderer question={q} />
                </div>

                <div className="mt-3 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      Conditional visibility
                    </span>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={cond.enabled}
                        onChange={(e) =>
                          updateConditional(q.fieldId, {
                            enabled: e.target.checked,
                          })
                        }
                      />
                      Enable
                    </label>
                  </div>

                  {cond.enabled && (
                    <div className="mt-2 space-y-2 text-xs">
                      {otherIncludedQuestions.length === 0 ? (
                        <p className="text-gray-500">
                          Add another question first to depend on it.
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Show this question if</span>

                            <select
                              className="border rounded px-1 py-1"
                              value={cond.dependsOnFieldId}
                              onChange={(e) =>
                                updateConditional(q.fieldId, {
                                  dependsOnFieldId: e.target.value,
                                })
                              }
                            >
                              <option value="">Select question…</option>
                              {otherIncludedQuestions.map((other) => (
                                <option
                                  key={other.fieldId}
                                  value={other.fieldId}
                                >
                                  {other.label}
                                </option>
                              ))}
                            </select>

                            <select
                              className="border rounded px-1 py-1"
                              value={cond.operator}
                              onChange={(e) =>
                                updateConditional(q.fieldId, {
                                  operator: e.target.value,
                                })
                              }
                            >
                              <option value="equals">equals</option>
                              <option value="notEquals">does not equal</option>
                            </select>

                            <span>value</span>

                            <input
                              className="border rounded px-2 py-1"
                              value={cond.value}
                              onChange={(e) =>
                                updateConditional(q.fieldId, {
                                  value: e.target.value,
                                })
                              }
                              placeholder="e.g. Engineer"
                            />
                          </div>

                          <p className="text-gray-500 mt-1">
                            Example: show GitHub URL if Role equals Engineer.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}