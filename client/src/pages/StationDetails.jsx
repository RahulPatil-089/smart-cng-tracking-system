import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, Fuel, MapPin, Navigation, Phone, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import AppleMap from '../components/AppleMap';
import { useAuth } from '../context/AuthContext';

export default function StationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [station, setStation] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [joining, setJoining] = useState(false);

  const loadStation = async () => { const { data } = await api.get(`/stations/${id}`); setStation(data.station); };
  const loadQueue = async () => {
    try { const { data } = await api.get(`/stations/${id}/queue`); setQueue(data.queue || []); setQueueError(''); }
    catch (e) { setQueueError(e.response?.data?.message || 'Unable to load live queue.'); }
    finally { setQueueLoading(false); }
  };
  useEffect(() => {
    Promise.all([loadStation(), loadQueue()]).catch(e => setQueueError(e.response?.data?.message || 'Unable to load station.')).finally(() => setLoading(false));
    const timer = setInterval(() => { loadStation().catch(() => {}); loadQueue(); }, 30000);
    return () => clearInterval(timer);
  }, [id]);

  const joinQueue = async () => {
    try { setJoining(true); await api.post(`/stations/${id}/queue`); await Promise.all([loadStation(), loadQueue()]); }
    catch (e) { setQueueError(e.response?.data?.message || 'Unable to join queue.'); }
    finally { setJoining(false); }
  };
  const leaveQueue = async entryId => {
    try { await api.delete(`/queue/${entryId}`); await Promise.all([loadStation(), loadQueue()]); }
    catch (e) { setQueueError(e.response?.data?.message || 'Unable to leave queue.'); }
  };

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Loading station...</div>;
  if (!station) return <div className="mx-auto max-w-7xl px-4 py-16 text-center"><p className="font-semibold text-red-600">Unable to load station.</p><Link to="/stations" className="mt-4 inline-flex font-bold text-cng-600">Back to stations</Link></div>;
  const wait = station.queueLength * (station.averageServiceMinutes || 8);
  const destination = `${station.latitude},${station.longitude}`;
  const myQueue = queue.find(q => q.userId?._id?.toString() === user?._id?.toString());

  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/stations" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cng-600"><ArrowLeft size={17}/> Back to stations</Link>
    <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-cng-50 text-cng-600"><Fuel/></div><div><h1 className="text-2xl font-extrabold">{station.name}</h1><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={15}/>{station.address}</p></div></div><span className="rounded-full bg-cng-50 px-3 py-1.5 text-xs font-bold text-cng-700">{station.status}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info icon={<Clock3/>} label="Hours" value={`${station.openingTime} – ${station.closingTime}`}/><Info icon={<Phone/>} label="Contact" value={station.phone}/><Info icon={<Fuel/>} label="CNG price" value={`₹${station.cngPrice}/kg`}/><Info icon={<Users/>} label="Current queue" value={`${station.queueLength} vehicles • ~${wait} min`}/></div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-500">Available pumps</span><span className="font-extrabold text-slate-800">{station.availableSlots} / {station.totalSlots}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cng-500" style={{ width: `${Math.min(100, station.availableSlots / station.totalSlots * 100)}%` }}/></div></div>
        <div className="mt-5 flex flex-wrap gap-3"><Link to={`/book-slot?station=${station._id}`} className="rounded-xl bg-cng-600 px-5 py-3 text-sm font-bold text-white hover:bg-cng-700">Book a slot</Link><button onClick={joinQueue} disabled={joining || !!myQueue} className="rounded-xl border border-cng-200 px-5 py-3 text-sm font-bold text-cng-700 disabled:cursor-not-allowed disabled:opacity-50">{joining ? 'Joining...' : myQueue ? 'In live queue' : 'Join live queue'}</button><a href={`https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Navigation size={17}/> Apple Maps</a></div>
        {myQueue && <div className="mt-4 rounded-xl bg-cng-50 p-4 text-sm"><p className="font-extrabold text-cng-800">You are #{myQueue.position} in the queue</p><p className="mt-1 text-cng-700">Estimated wait: ~{myQueue.estimatedWaitTime} minutes</p><button onClick={() => leaveQueue(myQueue._id)} className="mt-3 font-bold text-red-600">Leave queue</button></div>}
      </div>
      <div className="space-y-6"><AppleMap stations={[station]} selectedStation={station} className="min-h-[380px]"/><div className="card"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">Live queue</h2><p className="mt-1 text-sm text-slate-500">Updates automatically every 30 seconds.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{queue.length} active</span></div>{queueError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{queueError}</p>}{queueLoading ? <p className="mt-5 text-sm text-slate-500">Loading queue...</p> : queue.length === 0 ? <p className="mt-5 text-sm text-slate-500">No vehicles are currently waiting.</p> : <div className="mt-4 space-y-2">{queue.map(item => <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="font-bold">#{item.position} • {item.vehicleNumber}</p><p className="text-xs text-slate-500">{item.status}</p></div><span className="text-sm font-bold text-cng-700">~{item.estimatedWaitTime} min</span></div>)}</div>}</div></div>
    </div>
  </section>;
}
function Info({icon,label,value}) { return <div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">{icon} {label}</div><p className="mt-2 font-bold text-slate-800">{value}</p></div>; }
