import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return <div className="min-h-screen bg-slate-50 text-ink"><Navbar /><main><Outlet /></main></div>;
}
