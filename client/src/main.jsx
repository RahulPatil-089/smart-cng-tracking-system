import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Stations from './pages/Stations';
import StationDetails from './pages/StationDetails';
import Booking from './pages/Booking';
import Bookings from './pages/Bookings';
import Placeholder from './pages/Placeholder';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Loading Smart CNG...</div>;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}
function App() {
  return <Routes>
    <Route path="/" element={<HomeRedirect />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}><Route element={<MainLayout />}>
      <Route path="/dashboard" element={<Dashboard />} /><Route path="/profile" element={<Profile />} />
      <Route path="/stations" element={<Stations />} /><Route path="/stations/:id" element={<StationDetails />} />
      <Route path="/book-slot" element={<Booking />} /><Route path="/bookings" element={<Bookings />} />
      <Route path="/history" element={<Bookings history />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>);
