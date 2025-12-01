import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const BACKEND_URL = "http://localhost:4002";

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      login(token);
      navigate("/dashboard", { replace: true });
    }
  }, [params, login, navigate]);

  const hasToken = !!params.get("token");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Airtable Form Builder
        </h1>

        <p className="text-gray-500 mt-3">
          Build dynamic forms directly from your Airtable bases.
        </p>

        {hasToken ? (
          <p className="mt-6 text-sm text-gray-500">
            Finishing sign-in...
          </p>
        ) : (
          <button
            onClick={() => {
              window.location.href = `${BACKEND_URL}/auth/airtable/login`;
            }}
            className="
              mt-8 w-full py-3 
              bg-blue-600 text-white font-semibold rounded-xl 
              transition-all duration-200
              hover:bg-blue-700 hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            Login With Airtable
          </button>
        )}
      </div>
    </div>
  );
}