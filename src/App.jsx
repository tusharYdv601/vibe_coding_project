import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import FindBook from './pages/FindBook';
import StudentPortal from './pages/StudentPortal';
import Login from './pages/Login';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import BooksManager from './pages/admin/BooksManager';
import StudentsManager from './pages/admin/StudentsManager';
import CheckoutsManager from './pages/admin/CheckoutsManager';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/find" element={<FindBook />} />
          <Route path="/portal" element={<StudentPortal />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="books" element={<BooksManager />} />
            <Route path="students" element={<StudentsManager />} />
            <Route path="checkouts" element={<CheckoutsManager />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
