# 🏥 MediCore - Hospital Management System

A comprehensive, production-ready Hospital Management System built with the MERN stack, featuring role-based access control, Razorpay payment integration, and Groq AI chatbot.


## 🎯 Features

### 🔐 Authentication & Role System
- **Super Admin** (Hardcoded: `superadmin@medicore.com` / `adminmedicore`)
- **Staff Accounts** (Doctor, Receptionist, Staff) - Created by Super Admin only
- **Patient Registration** (Public signup)
- JWT-based authentication with refresh tokens
- Role-based access control middleware

### 🧠 AI Chatbot Integration
- Groq AI-powered medical assistant
- Primary and backup API keys with auto-fallback
- Healthcare topic restrictions
- Rate limiting and safety measures
- Available on all dashboards

### 💳 Payment System
- Razorpay integration for appointment payments
- Secure payment verification
- Automatic refund processing
- Payment status tracking

### 📁 Document Management
- Secure file uploads (PDF, Images)
- Lab reports (by receptionist)
- Prescriptions (by doctors)
- Receipts and bills
- Patient-specific access control

### 🏥 Role-Based Features

#### 🟣 Super Admin
- Create staff accounts
- View all doctors, patients, staff
- System analytics dashboard
- Revenue tracking
- User management

#### 🟡 Doctor
- View assigned appointments
- Upload prescriptions
- Update availability schedule
- View patient medical history
- Mark appointments as completed

#### 🟢 Receptionist
- Manage appointments
- Create bills
- Upload lab reports
- Handle payments
- View doctor availability

#### 🔵 Patient
- Book appointments
- Make payments via Razorpay
- View bills, prescriptions, lab reports
- Download documents
- Manage profile

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Razorpay** - Payment gateway
- **Groq SDK** - AI integration
- **Nodemailer** - Email notifications

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MediCore
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/medicore

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Groq AI
GROQ_API_KEY_PRIMARY=your_primary_groq_api_key
GROQ_API_KEY_BACKUP=your_backup_groq_api_key

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 5. Database Setup
- Ensure MongoDB is running
- The application will automatically create the database and collections

### 6. Start the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Default Credentials

### Super Admin
- **Email**: superadmin@medicore.com
- **Password**: adminmedicore

### First Steps
1. Login as Super Admin
2. Create staff accounts (doctors, receptionists)
3. Patients can register publicly
4. Start using the system!

## 🏗 Project Structure

```
MediCore/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication & validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   ├── uploads/         # File uploads
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── hooks/       # Custom hooks
│   └── public/          # Static files
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Patient registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/seed-superadmin` - Create super admin
- `POST /api/admin/create-staff` - Create staff account
- `GET /api/admin/analytics` - System analytics
- `GET /api/admin/doctors` - Get all doctors
- `GET /api/admin/patients` - Get all patients

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments` - Get appointments
- `PATCH /api/appointments/:id/status` - Update status
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/status/:id` - Get payment status

### Chatbot
- `POST /api/chatbot/chat` - Send message to chatbot
- `GET /api/chatbot/status` - Get chatbot status
- `GET /api/chatbot/topics` - Get health topics

## 🛡 Security Features

- JWT authentication with refresh tokens
- bcrypt password hashing
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS configuration
- File upload validation
- Razorpay signature verification
- Environment variable management

## 📊 Database Schema

### Collections
- **users** - User accounts and authentication
- **patients** - Patient medical information
- **doctors** - Doctor profiles and availability
- **appointments** - Appointment scheduling
- **bills** - Billing information
- **prescriptions** - Medical prescriptions
- **labReports** - Laboratory test results

## 🎨 UI Features

- Responsive design for all devices
- Modern hospital-themed interface
- Role-specific navigation
- Real-time notifications
- Interactive dashboards
- Document preview and download
- Chatbot floating interface

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend (use PM2 or similar)
cd backend
npm start
```

### Environment Variables for Production
- Set all required environment variables
- Use production database
- Configure proper CORS
- Set up SSL certificates
- Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Future Enhancements

- Video consultation integration
- Mobile app development
- Advanced analytics dashboard
- Multi-language support
- SMS notifications
- Pharmacy management
- Inventory management
- Advanced reporting

---

**MediCore** - Transforming Healthcare Management with Technology 🏥✨

