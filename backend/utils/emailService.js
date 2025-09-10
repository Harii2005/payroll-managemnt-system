const nodemailer = require('nodemailer');
const path = require('path');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send salary slip via email
const sendSalarySlipEmail = async (salarySlip, pdfPath) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: salarySlip.employeeId.email,
      subject: `Salary Slip - ${salarySlip.monthName} ${salarySlip.year}`,
      html: generateSalarySlipEmailTemplate(salarySlip),
      attachments: [
        {
          filename: `SalarySlip_${salarySlip.employeeId.employeeId}_${salarySlip.monthName}_${salarySlip.year}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Salary slip email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending salary slip email:', error);
    throw error;
  }
};

// Send expense notification email
const sendExpenseNotificationEmail = async (expense, status, adminUser) => {
  try {
    const transporter = createTransporter();

    const subject =
      status === 'approved'
        ? `Expense Approved - ${expense.title}`
        : `Expense Rejected - ${expense.title}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: expense.employeeId.email,
      subject: subject,
      html: generateExpenseNotificationEmailTemplate(
        expense,
        status,
        adminUser
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Expense notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending expense notification email:', error);
    throw error;
  }
};

// Send welcome email to new user
const sendWelcomeEmail = async (user, tempPassword = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Payroll Management System',
      html: generateWelcomeEmailTemplate(user, tempPassword),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: generatePasswordResetEmailTemplate(user, resetUrl),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Generate salary slip email template
const generateSalarySlipEmailTemplate = (salarySlip) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Salary Slip</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .amount { font-size: 18px; font-weight: bold; color: #28a745; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Salary Slip</h2>
                <p>${salarySlip.monthName} ${salarySlip.year}</p>
            </div>
            
            <div class="content">
                <p>Dear ${salarySlip.employeeId.name},</p>
                
                <p>Your salary slip for ${salarySlip.monthName} ${salarySlip.year} has been generated and is attached to this email.</p>
                
                <div class="details">
                    <h3>Salary Summary</h3>
                    <p><strong>Employee ID:</strong> ${salarySlip.employeeId.employeeId}</p>
                    <p><strong>Department:</strong> ${salarySlip.employeeId.department || 'N/A'}</p>
                    <p><strong>Working Days:</strong> ${salarySlip.workingDays.worked} / ${salarySlip.workingDays.total}</p>
                    <p><strong>Net Salary:</strong> <span class="amount">₹${salarySlip.netSalary.toLocaleString('en-IN')}</span></p>
                </div>
                
                ${
                  salarySlip.notes
                    ? `
                <div class="details">
                    <h3>Notes</h3>
                    <p>${salarySlip.notes}</p>
                </div>
                `
                    : ''
                }
                
                <p>Please find your detailed salary slip attached as a PDF document.</p>
                
                <p>If you have any questions regarding your salary slip, please contact the HR department.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>© ${new Date().getFullYear()} Payroll Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate expense notification email template
const generateExpenseNotificationEmailTemplate = (
  expense,
  status,
  adminUser
) => {
  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
  const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Expense ${statusText}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
            .status { color: ${statusColor}; font-weight: bold; font-size: 18px; }
            .content { padding: 20px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .amount { font-weight: bold; color: #007bff; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Expense ${statusText}</h2>
                <p class="status">${statusText}</p>
            </div>
            
            <div class="content">
                <p>Dear ${expense.employeeId.name},</p>
                
                <p>Your expense has been <strong>${status}</strong> by ${adminUser?.name || 'Admin'}.</p>
                
                <div class="details">
                    <h3>Expense Details</h3>
                    <p><strong>Title:</strong> ${expense.title}</p>
                    <p><strong>Amount:</strong> <span class="amount">₹${expense.amount.toLocaleString('en-IN')}</span></p>
                    <p><strong>Category:</strong> ${expense.category.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Date:</strong> ${new Date(expense.expenseDate).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> ${expense.description}</p>
                </div>
                
                ${
                  status === 'rejected' && expense.rejectionReason
                    ? `
                <div class="details">
                    <h3>Rejection Reason</h3>
                    <p>${expense.rejectionReason}</p>
                </div>
                `
                    : ''
                }
                
                <p>You can view more details by logging into the payroll system.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>© ${new Date().getFullYear()} Payroll Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate welcome email template
const generateWelcomeEmailTemplate = (user, tempPassword) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to Payroll Management System</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .credential { background-color: #fff3cd; padding: 10px; border-radius: 3px; font-family: monospace; }
            .warning { color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Welcome to Payroll Management System</h2>
            </div>
            
            <div class="content">
                <p>Dear ${user.name},</p>
                
                <p>Welcome to the Payroll Management System! Your account has been successfully created.</p>
                
                <div class="details">
                    <h3>Your Account Details</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    ${user.employeeId ? `<p><strong>Employee ID:</strong> ${user.employeeId}</p>` : ''}
                    ${user.department ? `<p><strong>Department:</strong> ${user.department}</p>` : ''}
                </div>
                
                ${
                  tempPassword
                    ? `
                <div class="details">
                    <h3>Login Credentials</h3>
                    <p><strong>Email:</strong> <span class="credential">${user.email}</span></p>
                    <p><strong>Temporary Password:</strong> <span class="credential">${tempPassword}</span></p>
                    
                    <div class="warning">
                        <strong>Important:</strong> Please change your password after your first login for security purposes.
                    </div>
                </div>
                `
                    : ''
                }
                
                <div class="details">
                    <h3>System Features</h3>
                    <ul>
                        ${
                          user.role === 'employee'
                            ? `
                        <li>Submit and track expense claims</li>
                        <li>View and download salary slips</li>
                        <li>Receive notifications about expense approvals</li>
                        <li>Update your profile and bank details</li>
                        `
                            : `
                        <li>Manage employee records</li>
                        <li>Generate and send salary slips</li>
                        <li>Review and approve expense claims</li>
                        <li>Access comprehensive reports and analytics</li>
                        `
                        }
                    </ul>
                </div>
                
                <p>You can access the system at: <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">${process.env.CLIENT_URL || 'http://localhost:3000'}</a></p>
                
                <p>If you have any questions or need assistance, please contact the system administrator.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>© ${new Date().getFullYear()} Payroll Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate password reset email template
const generatePasswordResetEmailTemplate = (user, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .warning { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 3px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
                <p>Dear ${user.name},</p>
                
                <p>We received a request to reset your password for the Payroll Management System.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link in your browser:</p>
                <p>${resetUrl}</p>
                
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If you continue to have problems, please contact the system administrator.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>© ${new Date().getFullYear()} Payroll Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendSalarySlipEmail,
  sendExpenseNotificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConfiguration,
};
