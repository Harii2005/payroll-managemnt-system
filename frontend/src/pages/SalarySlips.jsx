import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../stores/authStore';
import { salarySlipsAPI } from '../utils/api';
import { 
  Plus, 
  Download, 
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const SalarySlips = () => {
  const { user } = useAuthStore();
  const [salarySlips, setSalarySlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: '',
    allowances: '',
    deductions: '',
    overtime: '',
  });

  useEffect(() => {
    fetchSalarySlips();
  }, []);

  const fetchSalarySlips = async () => {
    try {
      setIsLoading(true);
      const response = user?.role === 'admin' 
        ? await salarySlipsAPI.getAllSalarySlips()
        : await salarySlipsAPI.getMySalarySlips();
      
      setSalarySlips(response.data.salarySlips);
    } catch (error) {
      console.error('Error fetching salary slips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const salaryData = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary),
        allowances: parseFloat(formData.allowances || 0),
        deductions: parseFloat(formData.deductions || 0),
        overtime: parseFloat(formData.overtime || 0),
      };

      if (selectedSlip) {
        await salarySlipsAPI.updateSalarySlip(selectedSlip._id, salaryData);
      } else {
        await salarySlipsAPI.createSalarySlip(salaryData);
      }
      
      setShowModal(false);
      setSelectedSlip(null);
      resetForm();
      fetchSalarySlips();
    } catch (error) {
      console.error('Error saving salary slip:', error);
    }
  };

  const handleDownload = async (slipId) => {
    try {
      const response = await salarySlipsAPI.downloadSalarySlip(slipId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-slip-${slipId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading salary slip:', error);
    }
  };

  const handleEdit = (slip) => {
    setSelectedSlip(slip);
    setFormData({
      employeeId: slip.employeeId._id,
      month: slip.month,
      year: slip.year,
      basicSalary: slip.basicSalary.toString(),
      allowances: slip.allowances.toString(),
      deductions: slip.deductions.toString(),
      overtime: slip.overtime.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (slipId) => {
    if (window.confirm('Are you sure you want to delete this salary slip?')) {
      try {
        await salarySlipsAPI.deleteSalarySlip(slipId);
        fetchSalarySlips();
      } catch (error) {
        console.error('Error deleting salary slip:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: '',
      allowances: '',
      deductions: '',
      overtime: '',
    });
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
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
              {user?.role === 'admin' ? 'All Salary Slips' : 'My Salary Slips'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Generate and manage employee salary slips' 
                : 'View and download your salary slips'
              }
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Salary Slip
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Salary</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${salarySlips.reduce((sum, slip) => sum + slip.netSalary, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Slips</p>
                <p className="text-2xl font-bold text-gray-900">{salarySlips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Latest Period</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salarySlips.length > 0 
                    ? `${getMonthName(salarySlips[0].month)} ${salarySlips[0].year}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Slips Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salarySlips.map((slip) => (
                  <tr key={slip._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getMonthName(slip.month)} {slip.year}
                      </div>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {slip.employeeId?.name || 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${slip.basicSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +${slip.allowances.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -${slip.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${slip.netSalary.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(slip.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(slip._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEdit(slip)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(slip._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {salarySlips.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No salary slips found.</p>
            </div>
          )}
        </div>

        {/* Generate/Edit Salary Slip Modal */}
        {showModal && user?.role === 'admin' && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedSlip ? 'Edit Salary Slip' : 'Generate Salary Slip'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Employee
                    </label>
                    <select
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="input-field"
                      disabled={selectedSlip}
                    >
                      <option value="">Select employee</option>
                      {/* Note: In a real app, you'd fetch this from an API */}
                      <option value="employee1">John Doe</option>
                      <option value="employee2">Jane Smith</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Month
                      </label>
                      <select
                        required
                        value={formData.month}
                        onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                        className="input-field"
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {getMonthName(i + 1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Year
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="input-field"
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                      className="input-field"
                      placeholder="Enter basic salary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Allowances
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.allowances}
                      onChange={(e) => setFormData({...formData, allowances: e.target.value})}
                      className="input-field"
                      placeholder="Enter allowances"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Deductions
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                      className="input-field"
                      placeholder="Enter deductions"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Overtime
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.overtime}
                      onChange={(e) => setFormData({...formData, overtime: e.target.value})}
                      className="input-field"
                      placeholder="Enter overtime pay"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedSlip(null);
                        resetForm();
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {selectedSlip ? 'Update' : 'Generate'} Salary Slip
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

export default SalarySlips;
