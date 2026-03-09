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
          .populate('patientId', 'profile.firstName profile.lastName')
          .populate('doctorId', 'userId.profile.firstName userId.profile.lastName')
          .lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format || 'json'}`;

    if (format === 'csv') {
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

module.exports = {
  getSystemOverview,
  getUserAnalytics,
  getDepartmentStats,
  exportData
};
