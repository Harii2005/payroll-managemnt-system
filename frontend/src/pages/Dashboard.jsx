import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../stores/authStore';
import { usersAPI, expensesAPI, salarySlipsAPI } from '../utils/api';
import { 
  DollarSign, 
  Receipt, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalSalary: 0,
    totalExpenses: 0,
    pendingExpenses: 0,
    totalEmployees: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentSalarySlips, setRecentSalarySlips] = useState([]);
  const [expenseChart, setExpenseChart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (user?.role === 'admin') {
        // Admin dashboard data
        const [expensesRes, salarySlipsRes, usersRes] = await Promise.all([
          expensesAPI.getAllExpenses(),
          salarySlipsAPI.getAllSalarySlips(),
          usersAPI.getAllUsers(),
        ]);

        const expenses = expensesRes.data.expenses;
        const salarySlips = salarySlipsRes.data.salarySlips;
        const users = usersRes.data.users;

        setStats({
          totalSalary: salarySlips.reduce((sum, slip) => sum + slip.netSalary, 0),
          totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          pendingExpenses: expenses.filter(exp => exp.status === 'pending').length,
          totalEmployees: users.filter(u => u.role === 'employee').length,
        });

        setRecentExpenses(expenses.slice(0, 5));
        setRecentSalarySlips(salarySlips.slice(0, 5));

        // Chart data - expenses by month
        const chartData = expenses.reduce((acc, expense) => {
          const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' });
          const existing = acc.find(item => item.month === month);
          if (existing) {
            existing.amount += expense.amount;
          } else {
            acc.push({ month, amount: expense.amount });
          }
          return acc;
        }, []);
        setExpenseChart(chartData);

      } else {
        // Employee dashboard data
        const [expensesRes, salarySlipsRes] = await Promise.all([
          expensesAPI.getMyExpenses(),
          salarySlipsAPI.getMySalarySlips(),
        ]);

        const expenses = expensesRes.data.expenses;
        const salarySlips = salarySlipsRes.data.salarySlips;

        setStats({
          totalSalary: salarySlips.reduce((sum, slip) => sum + slip.netSalary, 0),
          totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          pendingExpenses: expenses.filter(exp => exp.status === 'pending').length,
          totalEmployees: 0,
        });

        setRecentExpenses(expenses.slice(0, 5));
        setRecentSalarySlips(salarySlips.slice(0, 3));

        // Chart data - my expenses by month
        const chartData = expenses.reduce((acc, expense) => {
          const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' });
          const existing = acc.find(item => item.month === month);
          if (existing) {
            existing.amount += expense.amount;
          } else {
            acc.push({ month, amount: expense.amount });
          }
          return acc;
        }, []);
        setExpenseChart(chartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary', format = 'number' }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Admin Overview' : 'Your Overview'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Salary"
            value={stats.totalSalary}
            icon={DollarSign}
            color="green"
            format="currency"
          />
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            icon={Receipt}
            color="blue"
            format="currency"
          />
          <StatCard
            title="Pending Expenses"
            value={stats.pendingExpenses}
            icon={AlertCircle}
            color="yellow"
          />
          {user?.role === 'admin' && (
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="purple"
            />
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Expense Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentExpenses.slice(0, 3).map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${expense.amount}</p>
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Expenses */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Expenses
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentExpenses.slice(0, 5).map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${expense.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(expense.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Salary Slips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Salary Slips
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSalarySlips.map((slip) => (
                    <tr key={slip._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slip.month}/{slip.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${slip.netSalary}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(slip.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
