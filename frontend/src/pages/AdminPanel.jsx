import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { usersAPI, expensesAPI, salarySlipsAPI } from "../utils/api";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Search,
} from "lucide-react";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    position: "",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === "users") {
        const response = await usersAPI.getAllUsers();
        setUsers(response.data.users);
      } else if (activeTab === "expenses") {
        const response = await expensesAPI.getAllExpenses();
        setExpenses(response.data.expenses);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await usersAPI.updateUser(selectedUser._id, formData);
      } else {
        // Note: In a real app, you'd have a separate admin endpoint for creating users
        await usersAPI.createUser(formData);
      }

      setShowModal(false);
      setSelectedUser(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      position: user.position || "",
    });
    setShowModal(true);
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersAPI.deleteUser(userId);
        fetchData();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleExpenseStatusUpdate = async (expenseId, status) => {
    try {
      await expensesAPI.updateExpenseStatus(expenseId, status);
      fetchData();
    } catch (error) {
      console.error("Error updating expense status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "employee",
      department: "",
      position: "",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const icons = {
      pending: <CheckCircle className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {icons[status]}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      employee: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[role]}`}
      >
        <Shield className="h-3 w-3 mr-1" />
        <span className="capitalize">{role}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">
            Manage users, expenses, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="inline-block h-4 w-4 mr-2" />
              Users Management
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "expenses"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CheckCircle className="inline-block h-4 w-4 mr-2" />
              Expense Approvals
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="card">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {activeTab === "users" && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.position || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUserEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.role !== "admin" && (
                            <button
                              onClick={() => handleUserDelete(user._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No users found.</p>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.employeeId?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {expense.employeeId?.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${expense.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(expense.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {expense.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleExpenseStatusUpdate(
                                    expense._id,
                                    "approved"
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleExpenseStatusUpdate(
                                    expense._id,
                                    "rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No expenses found.</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedUser ? "Edit User" : "Add New User"}
                </h3>

                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter email address"
                      disabled={selectedUser}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter position"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedUser(null);
                        resetForm();
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {selectedUser ? "Update" : "Add"} User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
