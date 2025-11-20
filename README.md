# EduTrek - Full-Stack E-Learning Platform

A comprehensive e-learning platform built with React, Node.js, and MongoDB, featuring role-based access control, interactive courses, gamification, and AI-powered assistance.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based authentication with role-based access (Student, Instructor, Admin)
- **Course Management**: Create, manage, and enroll in courses with multiple videos, quizzes, and assignments
- **Real-time Dashboard**: Live progress tracking and analytics for all user roles
- **Interactive Learning**: Mind trick games and AI-powered chatbot for enhanced learning
- **Payment Integration**: Support for multiple payment gateways (Stripe, Razorpay, PayPal)
- **Certificate Generation**: QR code-enabled certificates upon course completion

### User Roles

#### Student
- Browse and enroll in courses
- Track learning progress
- Play educational games
- Chat with AI assistant
- Earn certificates and badges

#### Instructor
- Create and manage courses
- Upload course content (videos, PDFs, quizzes)
- View student analytics and performance
- Manage course enrollments

#### Admin
- Manage all users and courses
- Monitor platform analytics
- Handle payments and revenue
- System-wide oversight

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling framework
- **React Router DOM** - Client-side routing
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Socket.IO** - Real-time features
- **bcrypt** - Password hashing

### Database
- **MongoDB Atlas** - Cloud database

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EduTrek
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://midunar23cse_db_user:<password>@edutrek.jgnsaro.mongodb.net/
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
```

**Important**: Replace `<password>` in the MONGO_URI with your actual MongoDB Atlas password.

### 3. Frontend Setup
```bash
cd client
npm install
```

### 4. Start the Application

#### Development Mode
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course (Instructor/Admin)
- `DELETE /api/courses/:id` - Delete course (Instructor/Admin)
- `POST /api/courses/:courseId/enroll` - Enroll in course (Student)
- `GET /api/courses/me/progress` - Get student progress
- `GET /api/courses/instructor/courses` - Get instructor courses

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/courses` - Get all courses
- `PUT /api/admin/courses/:courseId` - Update course
- `DELETE /api/admin/courses/:courseId` - Delete course

### Chatbot
- `POST /api/chatbot/message` - Send message to AI assistant

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/validate/:id` - Validate certificate

## 🎮 Games & Interactive Features

### Memory Game
- Card matching game to improve cognitive skills
- Score tracking and difficulty levels
- Responsive design for all devices

### AI Chatbot
- Course navigation assistance
- FAQ responses
- Learning recommendations
- Real-time chat interface

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Animated Background**: Dynamic gradient background with floating particles
- **Glassmorphism Effects**: Modern glass-like UI components
- **Dark/Light Mode**: Theme switching capability
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/instructor/admin),
  avatarUrl: String,
  badges: [String],
  points: Number,
  createdAt: Date
}
```

### Course Model
```javascript
{
  title: String,
  description: String,
  instructor: ObjectId (ref: User),
  price: Number,
  category: String,
  status: String (draft/published),
  curriculum: [Object],
  requirements: [String],
  enrollmentCount: Number,
  createdAt: Date
}
```

### Enrollment Model
```javascript
{
  student: ObjectId (ref: User),
  course: ObjectId (ref: Course),
  enrolledAt: Date,
  progress: Number,
  completedLessons: [String],
  certificate: ObjectId (ref: Certificate)
}
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Set environment variables for API endpoints

### Backend Deployment (Heroku/Railway)
1. Set up environment variables
2. Deploy the server directory
3. Configure MongoDB Atlas connection
4. Set up domain and SSL

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
- Contact the development team
- Check the documentation

## 🎯 Roadmap

- [ ] Video streaming integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Social learning features
- [ ] Advanced gamification
- [ ] Multi-language support
- [ ] Advanced AI features

---

**EduTrek** - Empowering education through technology! 🎓✨
