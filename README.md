# Payroll Management System

A comprehensive payroll management system built with Node.js, Express, MongoDB, and React.

## Features

- **Admin Dashboard**: Manage salary slips, approve/reject expenses
- **Employee Portal**: Submit expenses, view salary slips
- **PDF Generation**: Automated salary slip generation
- **Role-based Access**: Admin and Employee roles
- **Real-time Notifications**: In-app notifications system
- **Data Visualization**: Charts for salary and expense tracking

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- PDF Generation with PDFKit
- Email notifications with Nodemailer

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Zustand for state management
- Recharts for data visualization
- Axios for API calls

## Project Structure

```
payroll-system/
├── backend/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   ├── controllers/        # Business logic
│   └── utils/              # Helper functions
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── services/       # API services
│   │   └── utils/          # Helper functions
│   └── public/
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd payroll-system
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Setup environment variables
```bash
# Backend .env
cp backend/.env.example backend/.env
# Frontend .env
cp frontend/.env.example frontend/.env
```

5. Start development servers
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

## Development Phases

- [x] Phase 1: Project Setup
- [ ] Phase 2: Backend Setup (Express + MongoDB)
- [ ] Phase 3: Frontend Setup (React + Tailwind)
- [ ] Phase 4: Core Features
- [ ] Phase 5: Dashboard + Charts
- [ ] Phase 6: Notifications
- [ ] Phase 7: Export Functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
