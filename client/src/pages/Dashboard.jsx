import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'system_admin') return <Navigate to="/system-admin" replace />;
  if (user?.role === 'station_admin') return <Navigate to="/station-admin" replace />;
  return <Navigate to="/stations" replace />;
}
