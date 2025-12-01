import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";

function DashboardPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedFormId, setCopiedFormId] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await api.get("/api/forms");
        setForms(res.data.forms || res.data || []); 
      } catch (err) {
        console.error("Failed to load forms", err);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  function handleCopyLink(formId) {
    const url = `${window.location.origin}/form/${formId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedFormId(formId);
          setTimeout(() => setCopiedFormId(null), 1500);
        })
        .catch(() => {
          window.prompt("Copy this form link:", url);
        });
    } else {
      window.prompt("Copy this form link:", url);
    }
  }

  const formatDateTime = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Airtable Form Builder
          </h1>
          <p className="text-xs text-slate-500">
            Dashboard • Manage all your connected forms
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 transition"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-slate-700 text-sm">
              Hii Harsh , welcome to your form dashboard. All forms you’ve
              created from Airtable appear here.
            </p>
          </div>
          <Link
            to="/forms/new"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition"
          >
            + Create New Form
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Forms</h2>
          {!loading && forms.length > 0 && (
            <span className="text-xs text-slate-500">
              {forms.length} form{forms.length > 1 ? "s" : ""} total
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-200 rounded mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="flex gap-2">
                    <div className="h-7 w-12 bg-slate-100 rounded" />
                    <div className="h-7 w-12 bg-slate-100 rounded" />
                    <div className="h-7 w-16 bg-slate-100 rounded" />
                  </div>
                </div>  // Protect route
              </div>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">
              You don’t have any forms yet.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Connect an Airtable base and start building your first form.
            </p>
            <Link
              to="/forms/new"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition"
            >
              + Create New Form
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {forms.map((form) => {
              const lastUpdated =
                formatDateTime(form.updatedAt || form.createdAt) || null;

              const isInactive = form.isActive === false;

              return (
                <div
                  key={form._id}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-transform transition-shadow"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                        {form.title || "Untitled form"}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isInactive
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        <span className="mr-1 text-[9px]">
                          {isInactive ? "●" : "●"}
                        </span>
                        {isInactive ? "Inactive" : "Active"}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Airtable Connection
                    </p>
                    <div className="mt-1 space-y-0.5 text-xs">
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-500">
                          Base ID:
                        </span>{" "}
                        <span className="font-mono text-[11px] break-all">
                          {form.airtableBaseId || "-"}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-500">
                          Table ID:
                        </span>{" "}
                        <span className="font-mono text-[11px] break-all">
                          {form.airtableTableId || "-"}
                        </span>
                      </p>
                    </div>

                    {lastUpdated && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Last updated: {lastUpdated}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-slate-100 gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(form._id)}
                      className="hidden sm:inline-flex items-center px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    >
                      <span className="mr-1 text-[11px]">🔗</span>
                      {copiedFormId === form._id ? "Copied!" : "Share"}
                    </button>
                    <Link
                      to={`/form/${form._id}`}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition"
                    >
                      <span className="mr-1 text-[11px]">📄</span>
                      Open
                    </Link>
                    <Link
                      to={`/forms/${form._id}/responses`}
                      className="inline-flex items-center px-2 py-1 rounded-md border border-blue-100 text-blue-600 hover:bg-blue-50 transition"
                    >
                      <span className="mr-1 text-[11px]">📊</span>
                      Responses
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
