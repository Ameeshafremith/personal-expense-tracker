# Personal Expense Tracker

A full-stack web application developed to help users manage their personal finances, track expenses, monitor income, and generate financial reports. The system provides an organized way to manage financial activities through a user-friendly interface.

## 🚀 Features

### 1. User Authentication
- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Protected routes and API endpoints.

### 2. Dashboard
- Overview of personal financial activities.
- Summary of income and expenses.
- Wallet and transaction information.
- Financial statistics for better expense monitoring.

### 3. Expense Management
- Add, view, update, and delete expenses.
- Organize expenses using categories.
- Track financial transactions.
- Monitor spending activities.

### 4. Income Management
- Record and manage income.
- View income transaction history.
- Monitor total income.

### 5. Category Management
- Create and manage expense categories.
- Organize transactions based on categories.
- Maintain personalized categories.

### 6. Wallet Management
- Manage personal wallet information.
- Monitor wallet balances.
- Track financial activities associated with wallets.

### 7. Purchase Simulation
- Simulate purchases using the available wallet balance.
- Validate purchase amounts.
- Record simulated purchase transactions.
- Update wallet balances based on successful purchases.

### 8. Profile Management
- View and update user profile information.
- Manage account details.
- Upload and manage profile images using Cloudinary.

### 9. Financial Reports
- Generate expense reports for selected date ranges.
- Generate PDF reports.
- View financial summaries.
- Analyze expenses across financial periods.

## 🛠️ Technologies Used

### Frontend
- React.js
- TypeScript
- Vite
- Redux Toolkit
- Axios
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose ODM
- JSON Web Token (JWT)
- Bcrypt.js
- Cloudinary

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Postman
- MongoDB Atlas
- Vercel

## 📂 Project Structure

```text
personal-expense-tracker/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ameeshafremith/personal-expense-tracker.git
```

Navigate into the project directory:

```bash
cd personal-expense-tracker
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory and configure the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add the Cloudinary configuration variables required by the application.

Start the backend development server:

```bash
npm run dev
```

The backend server will run at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend application will be available at the URL displayed by Vite, usually:

`http://localhost:5173`

## 🗄️ Database

The application uses MongoDB as its database and Mongoose ODM for managing database operations.

MongoDB Atlas is used for cloud database hosting.

## 🔐 Security

- Passwords are hashed before being stored.
- JWT is used for authentication.
- Protected API routes restrict unauthorized access.
- Environment variables are used to manage sensitive configuration values.

## 🌐 Deployment

The application uses Vercel for deployment.

- Backend: https://expenseflow-backend-gamma.vercel.app/
- Frontend: Configure the deployed frontend URL when available.

## 👩‍💻 Author

**Ameesha Fremith**

GitHub: https://github.com/Ameeshafremith

---

⭐ If you find this project interesting, feel free to explore the repository!
