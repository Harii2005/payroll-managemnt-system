import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    position: "",
    employeeId: "",
    role: "employee",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      department: formData.department,
      position: formData.position,
      employeeId: formData.employeeId,
      role: formData.role,
    };

    const result = await register(registrationData);

    if (result.success) {
      setSuccess("Registration successful! You can now login.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="employeeId"
                className="block text-sm font-medium text-gray-700"
              >
                Employee ID
              </label>
              <div className="mt-1">
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your employee ID"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <div className="mt-1">
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700"
              >
                Position
              </label>
              <div className="mt-1">
                <input
                  id="position"
                  name="position"
                  type="text"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your position"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                </span>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
