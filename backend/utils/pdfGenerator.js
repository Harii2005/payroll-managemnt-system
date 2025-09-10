const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create salary slip PDF
const generateSalarySlipPDF = async (salarySlip) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure upload directory exists
      const uploadDir = path.join(__dirname, '../uploads/salary-slips');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create filename
      const filename = `salary-slip-${salarySlip.employeeId.employeeId}-${salarySlip.month}-${salarySlip.year}.pdf`;
      const filePath = path.join(uploadDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Pipe to file
      doc.pipe(fs.createWriteStream(filePath));

      // Company Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PAYROLL MANAGEMENT SYSTEM', 50, 50, { align: 'center' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Salary Slip', 50, 80, { align: 'center' });

      // Draw line
      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      // Employee Information
      let yPosition = 130;

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Employee Information', 50, yPosition);

      yPosition += 25;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${salarySlip.employeeId.name}`, 50, yPosition)
        .text(
          `Employee ID: ${salarySlip.employeeId.employeeId}`,
          300,
          yPosition
        );

      yPosition += 15;

      doc
        .text(
          `Department: ${salarySlip.employeeId.department || 'N/A'}`,
          50,
          yPosition
        )
        .text(
          `Position: ${salarySlip.employeeId.position || 'N/A'}`,
          300,
          yPosition
        );

      yPosition += 15;

      doc.text(`Email: ${salarySlip.employeeId.email}`, 50, yPosition);

      // Salary Period
      yPosition += 30;

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Salary Period', 50, yPosition);

      yPosition += 25;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Month: ${salarySlip.monthName}`, 50, yPosition)
        .text(`Year: ${salarySlip.year}`, 300, yPosition);

      yPosition += 15;

      doc.text(
        `Working Days: ${salarySlip.workingDays.worked} / ${salarySlip.workingDays.total}`,
        50,
        yPosition
      );

      // Salary Details Table
      yPosition += 40;

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Salary Details', 50, yPosition);

      yPosition += 25;

      // Table headers
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, yPosition)
        .text('Amount (₹)', 450, yPosition, { align: 'right' });

      yPosition += 20;

      // Draw table border
      doc.rect(45, yPosition - 5, 460, 2).fill('#000');

      // Basic Salary
      yPosition += 10;
      const proRatedSalary =
        (salarySlip.basicSalary / salarySlip.workingDays.total) *
        salarySlip.workingDays.worked;

      doc
        .font('Helvetica')
        .text('Basic Salary (Pro-rated)', 50, yPosition)
        .text(formatCurrency(proRatedSalary), 450, yPosition, {
          align: 'right',
        });

      // Allowances
      yPosition += 20;
      doc.font('Helvetica-Bold').text('Allowances:', 50, yPosition);

      const allowances = salarySlip.allowances;
      let totalAllowances = 0;

      Object.entries(allowances).forEach(([key, value]) => {
        if (value > 0) {
          yPosition += 15;
          const label = key.toUpperCase().replace('_', ' ');
          doc
            .font('Helvetica')
            .text(`  ${label}`, 50, yPosition)
            .text(formatCurrency(value), 450, yPosition, { align: 'right' });
          totalAllowances += value;
        }
      });

      if (totalAllowances > 0) {
        yPosition += 15;
        doc
          .font('Helvetica-Bold')
          .text('Total Allowances', 300, yPosition)
          .text(formatCurrency(totalAllowances), 450, yPosition, {
            align: 'right',
          });
      }

      // Gross Salary
      yPosition += 20;
      const grossSalary = proRatedSalary + totalAllowances;
      doc.rect(45, yPosition - 5, 460, 1).fill('#000');

      yPosition += 10;
      doc
        .font('Helvetica-Bold')
        .text('Gross Salary', 300, yPosition)
        .text(formatCurrency(grossSalary), 450, yPosition, { align: 'right' });

      // Deductions
      yPosition += 25;
      doc.font('Helvetica-Bold').text('Deductions:', 50, yPosition);

      const deductions = salarySlip.deductions;
      let totalDeductions = 0;

      Object.entries(deductions).forEach(([key, value]) => {
        if (value > 0) {
          yPosition += 15;
          const label = key.toUpperCase();
          doc
            .font('Helvetica')
            .text(`  ${label}`, 50, yPosition)
            .text(formatCurrency(value), 450, yPosition, { align: 'right' });
          totalDeductions += value;
        }
      });

      if (totalDeductions > 0) {
        yPosition += 15;
        doc
          .font('Helvetica-Bold')
          .text('Total Deductions', 300, yPosition)
          .text(formatCurrency(totalDeductions), 450, yPosition, {
            align: 'right',
          });
      }

      // Net Salary
      yPosition += 20;
      doc.rect(45, yPosition - 5, 460, 2).fill('#000');

      yPosition += 15;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Net Salary', 300, yPosition)
        .text(formatCurrency(salarySlip.netSalary), 450, yPosition, {
          align: 'right',
        });

      // Net Salary in Words
      yPosition += 30;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Amount in Words:', 50, yPosition);

      yPosition += 15;
      doc
        .font('Helvetica')
        .text(numberToWords(salarySlip.netSalary), 50, yPosition, {
          width: 450,
        });

      // Bank Details (if available)
      if (salarySlip.employeeId.bankDetails?.accountNumber) {
        yPosition += 40;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Bank Details', 50, yPosition);

        yPosition += 20;
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `Account Number: ${salarySlip.employeeId.bankDetails.accountNumber}`,
            50,
            yPosition
          );

        yPosition += 15;
        doc.text(
          `Bank Name: ${salarySlip.employeeId.bankDetails.bankName || 'N/A'}`,
          50,
          yPosition
        );

        yPosition += 15;
        doc.text(
          `IFSC Code: ${salarySlip.employeeId.bankDetails.ifscCode || 'N/A'}`,
          50,
          yPosition
        );
      }

      // Notes (if available)
      if (salarySlip.notes) {
        yPosition += 30;
        doc.fontSize(12).font('Helvetica-Bold').text('Notes:', 50, yPosition);

        yPosition += 20;
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(salarySlip.notes, 50, yPosition, { width: 450 });
      }

      // Footer
      yPosition += 60;
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleString()}`, 50, yPosition)
        .text(`Generated by: ${salarySlip.generatedBy.name}`, 300, yPosition);

      yPosition += 20;
      doc.text(
        'This is a computer generated salary slip and does not require signature.',
        50,
        yPosition,
        { align: 'center' }
      );

      // Finalize PDF
      doc.end();

      // Wait for PDF to be written
      doc.on('end', () => {
        resolve(filePath);
      });

      doc.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to convert number to words (simplified)
const numberToWords = (amount) => {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertHundreds = (num) => {
    let result = '';

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      num = 0;
    }

    if (num > 0) {
      result += ones[num] + ' ';
    }

    return result;
  };

  if (amount === 0) return 'Zero Rupees Only';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = '';

  if (integerPart >= 10000000) {
    words += convertHundreds(Math.floor(integerPart / 10000000)) + 'Crore ';
    integerPart %= 10000000;
  }

  if (integerPart >= 100000) {
    words += convertHundreds(Math.floor(integerPart / 100000)) + 'Lakh ';
    integerPart %= 100000;
  }

  if (integerPart >= 1000) {
    words += convertHundreds(Math.floor(integerPart / 1000)) + 'Thousand ';
    integerPart %= 1000;
  }

  if (integerPart > 0) {
    words += convertHundreds(integerPart);
  }

  words += 'Rupees';

  if (decimalPart > 0) {
    words += ' and ' + convertHundreds(decimalPart) + 'Paisa';
  }

  words += ' Only';

  return words.trim();
};

module.exports = {
  generateSalarySlipPDF,
};
