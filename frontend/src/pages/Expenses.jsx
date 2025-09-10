import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import useAuthStore from "../stores/authStore";
import { expensesAPI } from "../utils/api";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

const Expenses = () => {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, statusFilter]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response =
        user?.role === "admin"
          ? await expensesAPI.getAllExpenses()
          : await expensesAPI.getMyExpenses();

      setExpenses(response.data.expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedExpense) {
        // Update existing expense (admin only)
        await expensesAPI.updateExpenseStatus(
          selectedExpense._id,
          formData.status
        );
      } else {
        // Create new expense
        await expensesAPI.createExpense(formData);
      }

      setShowModal(false);
      setSelectedExpense(null);
      setFormData({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleStatusUpdate = async (expenseId, status) => {
    try {
      await expensesAPI.updateExpenseStatus(expenseId, status);
      fetchExpenses();
    } catch (error) {
      console.error("Error updating expense status:", error);
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await expensesAPI.deleteExpense(expenseId);
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === "admin" ? "All Expenses" : "My Expenses"}
            </h1>
            <p className="text-gray-600">
              {user?.role === "admin"
                ? "Manage and approve employee expenses"
                : "Track and submit your expenses"}
            </p>
          </div>

          {user?.role === "employee" && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                  {user?.role === "admin" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
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
                        {expense.description}
                      </div>
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
                    {user?.role === "admin" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.employeeId?.name || "N/A"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {user?.role === "admin" &&
                          expense.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(expense._id, "approved")
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(expense._id, "rejected")
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                        {user?.role === "employee" &&
                          expense.status === "pending" && (
                            <button
                              onClick={() => handleDelete(expense._id)}
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

          {filteredExpenses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No expenses found.</p>
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Expense
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="Enter expense description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="">Select category</option>
                      <option value="Travel">Travel</option>
                      <option value="Food">Food</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Training">Training</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Expense
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

export default Expenses;
