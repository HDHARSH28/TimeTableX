import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout and Pages imports
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Faculty from './pages/Faculty';
import Classrooms from './pages/Classrooms';
import Subjects from './pages/Subjects';
import Timetables from './pages/Timetables';
import TimetableDetail from './pages/TimetableDetail';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app routes inside navigation Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="departments" element={<Departments />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="timetables" element={<Timetables />} />
          <Route path="timetables/:id" element={<TimetableDetail />} />
        </Route>

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
