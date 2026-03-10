const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');

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
        data = await User.find({})
          .select('email role profile isActive createdAt lastLogin')
          .lean();
        break;
      case 'patients':
        data = await Patient.find({})
          .populate('userId', 'email profile isActive createdAt')
          .lean();
        break;
      case 'doctors':
        data = await Doctor.find({})
          .populate('userId', 'email profile isActive createdAt')
          .lean();
        break;
      case 'appointments':
        data = await Appointment.find({})
          .populate({
            path: 'patientId',
            populate: {
              path: 'userId',
              select: 'profile email'
            }
          })
          .populate({
            path: 'doctorId',
            populate: {
              path: 'userId',
              select: 'profile email'
            }
          })
          .lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'csv'}`;

    // BEAUTIFY EXPORT DATA: Map to clean, user-friendly objects for professional reports
    let processedData = [];

    if (type === 'users') {
      processedData = data.map(u => ({
        'Email Address': u.email || 'N/A',
        'User Role': (u.role || 'user').toUpperCase(),
        'Full Name': getFullName(u.profile) || 'N/A',
        'Contact Number': u.profile?.phone || 'N/A',
        'Account Status': u.isActive ? 'Active' : 'Deactivated',
        'Registered On': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'
      }));
    } else if (type === 'patients') {
      processedData = data.map(p => {
        const name = getFullName(p.userId?.profile);
        return {
          'Patient Name': name || 'N/A',
          'Email Address': p.userId?.email || 'N/A',
          'Phone Number': p.userId?.profile?.phone || 'N/A',
          'Blood Group': p.bloodGroup || 'N/A',
          'Gender': p.gender || 'N/A',
          'Date of Birth': p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A',
          'Emergency Contact': p.emergencyContact?.name ? `${p.emergencyContact.name} (${p.emergencyContact.relationship})` : 'N/A',
          'Allergies': (p.allergies || []).join(', ') || 'None',
          'Joined On': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
        };
      });
    } else if (type === 'doctors') {
      processedData = data.map(d => {
        const name = getFullName(d.userId?.profile);
        return {
          'Doctor Name': name ? `Dr. ${name}` : 'N/A',
          'Specialization': d.specialization,
          'Department': d.department,
          'Email Address': d.userId?.email || 'N/A',
          'License Number': d.licenseNumber,
          'Experience (Years)': d.experience,
          'Consultation Fee': `₹${d.consultationFee}`,
          'Consultations Done': d.consultationCount || 0,
          'Average Rating': d.averageRating || 'N/A',
          'Joining Date': d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'
        };
      });
    } else if (type === 'appointments') {
      processedData = data.map(a => {
        const patientName = getFullName(a.patientId?.userId?.profile);
        const doctorName = getFullName(a.doctorId?.userId?.profile);

        return {
          'Appointment Date': a.date ? new Date(a.date).toLocaleDateString() : 'N/A',
          'Scheduled Time': a.timeSlot ? `${a.timeSlot.start} - ${a.timeSlot.end}` : 'N/A',
          'Patient Name': patientName || 'N/A',
          'Doctor Name': doctorName ? `Dr. ${doctorName}` : 'N/A',
          'Consultation Type': (a.consultationType || 'in-person').toUpperCase(),
          'Reported Symptoms': a.symptoms || 'General Checkup',
          'Current Status': (a.status || 'pending').toUpperCase(),
          'Payment Status': (a.paymentStatus || 'pending').toUpperCase()
        };
      });
    } else {
      processedData = data;
    }

    if (format === 'csv') {
      const csv = convertToCSV(processedData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // Add UTF-8 BOM for Excel to recognize it correctly
      return res.send('\ufeff' + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.json(processedData);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting data'
    });
  }
};

// Helper function to extract full name from profile object
const getFullName = (profile) => {
  if (!profile || !profile.firstName) return '';
  return `${profile.firstName} ${profile.lastName || ''}`.trim();
};

// Flattening logic removed in favor of explicit mapping for better readability

// Helper function to convert JSON to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  // Get all unique keys across all objects (some might be missing in others)
  const allKeys = new Set();
  data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
  const headers = Array.from(allKeys);

  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      if (value === undefined || value === null) return '';

      // Escape for CSV (Excel preference)
      value = String(value).replace(/"/g, '""');
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  getSystemOverview,
  getUserAnalytics,
  getDepartmentStats,
  exportData
};
