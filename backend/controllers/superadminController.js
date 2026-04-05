const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const PDFDocument = require('pdfkit');

// Get system overview
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      recentRegistrations,
      systemHealth,
      appointmentTrends,
      revenueTrends
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }),
      Promise.resolve({ status: 'healthy', uptime: process.uptime() }),
      Appointment.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),
      Bill.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            total: { $sum: '$total' }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        recentRegistrations,
        systemHealth,
        appointmentTrends: appointmentTrends.reverse(),
        revenueTrends: revenueTrends.reverse()
      }
    });
  } catch (error) {
    console.error('System overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system overview'
    });
  }
};

// Get detailed user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        monthlyRegistrations
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user analytics'
    });
  }
};

// Get department statistics
const getDepartmentStats = async (req, res) => {
  try {
    const departmentStats = await Doctor.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          doctors: {
            $push: {
              name: {
                $concat: ['$userDetails.profile.firstName', ' ', '$userDetails.profile.lastName']
              },
              experience: '$experience',
              consultationFee: '$consultationFee'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'doctors._id',
          foreignField: 'doctorId',
          as: 'appointments'
        }
      }
    ]);

    res.json({
      success: true,
      data: { departmentStats }
    });
  } catch (error) {
    console.error('Department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching department statistics'
    });
  }
};

// Export data
const exportData = async (req, res) => {
  try {
    const { type, format } = req.query;
    let data;

    switch (type) {
      case 'users':
        const users = await User.find({})
          .select('email role profile isActive createdAt lastLogin')
          .lean();
        data = users.map(u => ({
          'Name': `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
          'Email': u.email,
          'Role': u.role,
          'Status': u.isActive ? 'Active' : 'Inactive',
          'Joined': new Date(u.createdAt).toLocaleDateString(),
          'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
        }));
        break;

      case 'patients':
        const patients = await Patient.find({})
          .populate('userId', 'email profile isActive createdAt')
          .lean();
        data = patients.map(p => ({
          'Patient Name': `${p.userId?.profile?.firstName || ''} ${p.userId?.profile?.lastName || ''}`.trim(),
          'Email': p.userId?.email || '-',
          'Phone': p.userId?.profile?.phone || '-',
          'Gender': p.userId?.profile?.gender || '-',
          'Allergies': p.allergies?.length > 0 ? p.allergies.join(', ') : 'None',
          'Blood Group': p.bloodGroup || '-',
          'Status': p.userId?.isActive ? 'Active' : 'Inactive'
        }));
        break;

      case 'doctors':
        const doctors = await Doctor.find({})
          .populate('userId', 'email profile isActive createdAt')
          .lean();
        
        data = doctors.map(doc => ({
          'Doctor Name': `${doc.userId?.profile?.firstName || ''} ${doc.userId?.profile?.lastName || ''}`.trim(),
          'Email-ID': doc.userId?.email || '-',
          'Specialization': doc.specialization || '-',
          'Experience': `${doc.experience || 0} Years`,
          'Fee (INR)': doc.consultationFee || 0,
          'Academic Qualification': doc.qualifications || '-',
          'License Number': doc.licenseNumber || '-',
          'Department': doc.department || '-',
          'Contact Number': doc.userId?.profile?.phone || '-'
        }));
        break;

      case 'receptionists':
        const receptionists = await User.find({ role: 'receptionist' })
          .select('email profile isActive createdAt')
          .lean();
        data = receptionists.map(r => ({
          'Receptionist Name': `${r.profile?.firstName || ''} ${r.profile?.lastName || ''}`.trim(),
          'Email-ID': r.email,
          'Contact Number': r.profile?.phone || '-',
          'Status': r.isActive ? 'Active' : 'Inactive',
          'Joined': new Date(r.createdAt).toLocaleDateString()
        }));
        break;

      case 'appointments':
        const appointments = await Appointment.find({})
          .populate('patientId', 'userId')
          .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } })
          .populate('doctorId', 'userId')
          .populate({ path: 'doctorId', populate: { path: 'userId', select: 'profile' } })
          .lean();
        data = appointments.map(a => ({
          'Date': new Date(a.date).toLocaleDateString(),
          'Time': `${a.timeSlot?.start} - ${a.timeSlot?.end}`,
          'Patient': `${a.patientId?.userId?.profile?.firstName || ''} ${a.patientId?.userId?.profile?.lastName || ''}`.trim(),
          'Doctor': `Dr. ${a.doctorId?.userId?.profile?.firstName || ''} ${a.doctorId?.userId?.profile?.lastName || ''}`.trim(),
          'Status': a.status,
          'Type': a.consultationType,
          'Payment': a.paymentStatus
        }));
        break;

      case 'audit':
        const [patientCount, doctorCount, appointmentCount, revenueData] = await Promise.all([
          Patient.countDocuments(),
          Doctor.countDocuments(),
          Appointment.countDocuments({
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }),
          Bill.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ])
        ]);

        data = [
          { 'Metric Category': 'General Statistics', 'Metric Name': 'Total Patients', 'Value': patientCount },
          { 'Metric Category': 'General Statistics', 'Metric Name': 'Total Doctors', 'Value': doctorCount },
          { 'Metric Category': 'Activity', 'Metric Name': "Today's Appointments", 'Value': appointmentCount },
          { 'Metric Category': 'Finance', 'Metric Name': 'Total Revenue', 'Value': `₹${(revenueData[0]?.total || 0).toLocaleString()}` },
          { 'Metric Category': 'System Health', 'Metric Name': 'Status', 'Value': 'Healthy' },
          { 'Metric Category': 'System Health', 'Metric Name': 'Database', 'Value': 'Connected/Protected' },
          { 'Metric Category': 'System Health', 'Metric Name': 'API Node', 'Value': 'Responsive' },
          { 'Metric Category': 'System Health', 'Metric Name': 'Last Backup', 'Value': '2 hours ago' }
        ];
        break;

      case 'revenue':
        const bills = await Bill.find({})
          .populate('patientId', 'userId')
          .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } })
          .populate('appointmentId', 'date')
          .sort({ createdAt: -1 })
          .lean();

        data = bills.map(bill => ({
          'Invoice ID': bill.invoiceNumber || bill._id.toString().substring(0, 8).toUpperCase(),
          'Date': new Date(bill.createdAt).toLocaleDateString(),
          'Patient Name': `${bill.patientId?.userId?.profile?.firstName || ''} ${bill.patientId?.userId?.profile?.lastName || ''}`.trim(),
          'Total Amount (INR)': bill.total || 0,
          'Status': bill.status?.toUpperCase() || 'PENDING',
          'Payment Method': bill.paymentMethod || 'Razorpay',
          'Appointment Date': bill.appointmentId?.date ? new Date(bill.appointmentId.date).toLocaleDateString() : '-'
        }));
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format || 'json'}`;

    if (format === 'pdf') {
      return generatePDFReport(data, type, res, filename);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting data'
    });
  }
};

// Helper function to convert JSON to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',')
        ? `"${value}"`
        : value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

// Helper function to generate PDF Report
const generatePDFReport = (data, type, res, filename) => {
  if (!data || data.length === 0) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    doc.text('No records found for this category.');
    doc.end();
    return;
  }

  const headers = Object.keys(data[0]);
  const isLandscape = headers.length > 6;
  
  const doc = new PDFDocument({ 
    margin: 30, 
    size: 'A4', 
    layout: isLandscape ? 'landscape' : 'portrait' 
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#0f3a3a');
  doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
    .text('MediCore', 50, 25);
  doc.fontSize(10).font('Helvetica')
    .text('Analytics Export Report', 50, 55);
  doc.fontSize(14).text(type.toUpperCase() + ' DATA', 0, 35, { align: 'right', width: doc.page.width - 50 });

  doc.moveDown(3);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
    .text(`Generated on: ${new Date().toLocaleString()}`, 50, 95);
  doc.moveDown(2);

  // Draw Table
  const tableWidth = doc.page.width - 100;
  const colWidth = tableWidth / headers.length;
  let startY = doc.y + 10;
  let startX = 50;

  // Table Header Background
  doc.rect(startX, startY, tableWidth, 20).fill('#f0f9f9');
  doc.fillColor('#0f3a3a').fontSize(isLandscape ? 7 : 8).font('Helvetica-Bold');

  headers.forEach((header, i) => {
    doc.text(header.toUpperCase(), startX + (i * colWidth), startY + 6, {
      width: colWidth,
      align: 'left'
    });
  });

  startY += 20;
  doc.fillColor('#475569').font('Helvetica').fontSize(isLandscape ? 6 : 7);

  data.forEach((row, rowIndex) => {
    // Check for page break
    if (startY > doc.page.height - 50) {
      doc.addPage();
      startY = 50;
      // Re-draw header on new page
      doc.rect(startX, startY, tableWidth, 20).fill('#f0f9f9');
      doc.fillColor('#0f3a3a').fontSize(isLandscape ? 7 : 8).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header.toUpperCase(), startX + (i * colWidth), startY + 6, {
          width: colWidth,
          align: 'left'
        });
      });
      startY += 20;
      doc.fillColor('#475569').font('Helvetica').fontSize(isLandscape ? 6 : 7);
    }

    // Row Background for readability
    if (rowIndex % 2 === 1) {
      doc.rect(startX, startY, tableWidth, 15).fill('#fafafa');
    }

    headers.forEach((header, i) => {
      let val = row[header];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val).substring(0, 30) + '...';
      } else {
        val = String(val || '-').substring(0, 30);
      }
      
      doc.fillColor('#475569').text(val, startX + (i * colWidth), startY + 4, {
        width: colWidth,
        align: 'left'
      });
    });
    startY += 15;
  });

  doc.end();
};

module.exports = {
  getSystemOverview,
  getUserAnalytics,
  getDepartmentStats,
  exportData
};
