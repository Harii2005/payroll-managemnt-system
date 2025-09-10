import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./stores/authStore";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import SalarySlips from "./pages/SalarySlips";
import AdminPanel from "./pages/AdminPanel";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/salary-slips"
            element={
              <ProtectedRoute>
                <SalarySlips />
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900">404</h1>
                      <p className="mt-2 text-sm text-gray-600">
                        Page not found
                      </p>
                      <a href="/" className="mt-4 btn-primary inline-block">
                        Go Home
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
