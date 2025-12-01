import React from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import FormViewerPage from "./pages/FormViewerPage";
import ResponsePage from "./pages/ResponsePage";
import ThankYouPage from "./pages/ThankYouPage"

import { useAuth } from "./hooks/useAuth"; 

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <LoginPage />;
  return children;
}

export default function App() {

  return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms/new"
          element={
            <ProtectedRoute>
              <FormBuilderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form/:formId"
          element={
            <ProtectedRoute>
              <FormViewerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms/:formId/responses"
          element={
            <ProtectedRoute>
              <ResponsePage />
            </ProtectedRoute>
          }
        />
      </Routes>  
    );
}