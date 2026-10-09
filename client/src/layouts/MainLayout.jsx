import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Fuel, LayoutDashboard, LogOut, MapPin, Settings, ShieldCheck, Users, CalendarClock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'system_admin' || user?.role === 'station_admin';
  const systemAdmin = user?.role === 'system_admin';
  const links = systemAdmin
    ? [{ to: '/system-admin', label: 'Dashboard', icon: LayoutDashboard }, { to: '/stations', label: 'Fuel stations', icon: Fuel }, { to: '/profile', label: 'Settings', icon: Settings }]
    : user?.role === 'station_admin'
      ? [{ to: '/station-admin', label: 'Dashboard', icon: LayoutDashboard }, { to: '/bookings', label: 'Bookings', icon: CalendarClock }, { to: '/profile', label: 'Settings', icon: Settings }]
      : [];

  if (!isAdmin) return <div className="min-h-screen bg-slate-50 text-ink"><Navbar /><main><Outlet /></main></div>;

  return <div className="min-h-screen bg-slate-50 text-ink lg:flex">
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-950 text-slate-300 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cng-600 text-white"><Fuel size={21}/></span>
        <div><div className="font-extrabold text-white">Smart CNG</div><div className="text-xs text-slate-400">Operations center</div></div>
      </div>
      <div className="px-5 pb-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
        {links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end className={({isActive}) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={18}/>{label}</NavLink>)}
      </nav>
      <div className="mt-auto hidden border-t border-slate-800 p-4 lg:block">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-300"><Users size={17}/></span><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{user?.name || 'Administrator'}</p><p className="text-xs text-slate-400">{systemAdmin ? 'System Admin' : 'Station Admin'}</p></div></div>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-300"><LogOut size={17}/> Sign out</button>
      </div>
      <div className="px-5 pb-4 text-xs text-slate-600 lg:hidden">{systemAdmin ? 'System administration' : 'Station administration'} · {user?.name}</div>
    </aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-slate-950/90 px-5 py-4 backdrop-blur sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-400">{systemAdmin ? 'Platform monitoring' : 'Station operations'}</p><p className="mt-1 text-sm font-semibold text-slate-200">{systemAdmin ? 'System Admin Dashboard' : 'Station Control Dashboard'}</p></div><div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300"><Activity size={14} className="text-emerald-400"/> Services online</div></header><main><Outlet /></main></div>
  </div>;
}
