import { useEffect, useState } from 'react';
import api from '../services/api';

const tabs = ['Overview', 'Users', 'Stations', 'Bookings'];

export default function SystemAdmin() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [s, u, st, b] = await Promise.all([
        api.get('/system-admin/statistics'), api.get('/system-admin/users'), api.get('/system-admin/stations'), api.get('/system-admin/bookings')
      ]);
      setStats(s.data.stats); setUsers(u.data.users); setStations(st.data.stations); setBookings(b.data.bookings);
    } catch (e) { setError(e.response?.data?.message || 'Unable to load system admin data.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleUser = async (user) => {
    try { await api.put(`/system-admin/users/${user._id}/status`, { isActive: !user.isActive }); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to update user.'); }
  };
  const approve = async (station, approved) => {
    try { await api.put(`/system-admin/stations/${station._id}/approval`, { approved }); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to update station approval.'); }
  };

  if (loading) return <section className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500">Loading system administration...</section>;

  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="mb-7"><p className="text-sm font-bold uppercase tracking-wider text-cng-600">System Administration</p><h1 className="mt-1 text-3xl font-extrabold">Control center</h1><p className="mt-2 text-slate-500">Manage users, stations and platform-wide bookings.</p></div>
    {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${tab === t ? 'bg-white text-cng-700 shadow-sm' : 'text-slate-500'}`}>{t}</button>)}</div>
    {tab === 'Overview' && <Overview stats={stats} users={users} stations={stations} bookings={bookings} />}
    {tab === 'Users' && <Users users={users} toggleUser={toggleUser} />}
    {tab === 'Stations' && <Stations stations={stations} approve={approve} />}
    {tab === 'Bookings' && <Bookings bookings={bookings} />}
  </section>;
}

function Overview({ stats, users, stations, bookings }) {
  const cards = [['Total users', stats?.totalUsers ?? 0], ['Total stations', stats?.totalStations ?? 0], ["Today's bookings", stats?.todayBookings ?? 0], ['Active bookings', stats?.activeBookings ?? 0], ['Completed', stats?.completedBookings ?? 0], ['Cancelled', stats?.cancelledBookings ?? 0]];
  return <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <div className="card" key={label}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="card"><h2 className="font-bold">Recent users</h2>{users.slice(0,5).map(u => <div key={u._id} className="mt-4 flex justify-between border-b border-slate-100 pb-3 text-sm"><span><b>{u.name}</b><br/><span className="text-slate-500">{u.email}</span></span><span className={u.isActive ? 'text-cng-600' : 'text-red-500'}>{u.isActive ? 'Active' : 'Disabled'}</span></div>)}</div><div className="card"><h2 className="font-bold">Station approvals</h2>{stations.slice(0,5).map(s => <div key={s._id} className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3 text-sm"><span><b>{s.name}</b><br/><span className="text-slate-500">{s.address}</span></span><span className={s.approved ? 'text-cng-600' : 'text-amber-600'}>{s.approved ? 'Approved' : 'Pending'}</span></div>)}</div></div></>;
}

function Users({ users, toggleUser }) { return <div className="card overflow-x-auto"><h2 className="mb-4 text-xl font-bold">User management</h2><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-slate-400"><th className="pb-3">User</th><th>Role</th><th>Station</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map(u => <tr key={u._id} className="border-b border-slate-100"><td className="py-4"><b>{u.name}</b><br/><span className="text-slate-500">{u.email}</span></td><td>{u.role}</td><td>{u.stationId?.name || '—'}</td><td>{u.isActive ? 'Active' : 'Disabled'}</td><td><button disabled={u.role === 'system_admin'} onClick={() => toggleUser(u)} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">{u.isActive ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div>; }

function Stations({ stations, approve }) { return <div className="card overflow-x-auto"><h2 className="mb-4 text-xl font-bold">Station management</h2><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-slate-400"><th className="pb-3">Station</th><th>Contact</th><th>Status</th><th>Approval</th><th>Action</th></tr></thead><tbody>{stations.map(s => <tr key={s._id} className="border-b border-slate-100"><td className="py-4"><b>{s.name}</b><br/><span className="text-slate-500">{s.address}</span></td><td>{s.phone}</td><td>{s.status}</td><td>{s.approved ? 'Approved' : 'Pending'}</td><td><button onClick={() => approve(s, !s.approved)} className="rounded-lg border px-3 py-2 text-xs font-bold">{s.approved ? 'Reject' : 'Approve'}</button></td></tr>)}</tbody></table></div>; }

function Bookings({ bookings }) { return <div className="card overflow-x-auto"><h2 className="mb-4 text-xl font-bold">All bookings</h2><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b text-slate-400"><th className="pb-3">Booking</th><th>User</th><th>Station</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>{bookings.map(b => <tr key={b._id} className="border-b border-slate-100"><td className="py-4 font-bold text-cng-700">{b.bookingId}</td><td>{b.userId?.name || '—'}</td><td>{b.stationId?.name || '—'}</td><td>{b.bookingDate}</td><td>{b.startTime}</td><td>{b.status}</td></tr>)}</tbody></table></div>; }
