import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, Fuel, MapPin, Navigation, Phone, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import AppleMap from '../components/AppleMap';

export default function StationDetails() {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/stations/${id}`).then(({ data }) => setStation(data.station)).catch(err => setError(err.response?.data?.message || 'Unable to load station.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Loading station...</div>;
  if (error || !station) return <div className="mx-auto max-w-7xl px-4 py-16 text-center"><p className="font-semibold text-red-600">{error || 'Station not found.'}</p><Link to="/stations" className="mt-4 inline-flex font-bold text-cng-600">Back to stations</Link></div>;
  const wait = station.queueLength * station.averageServiceMinutes;
  const destination = `${station.latitude},${station.longitude}`;

  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/stations" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cng-600"><ArrowLeft size={17}/> Back to stations</Link>
    <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-cng-50 text-cng-600"><Fuel/></div><div><h1 className="text-2xl font-extrabold">{station.name}</h1><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={15}/>{station.address}</p></div></div></div><span className="rounded-full bg-cng-50 px-3 py-1.5 text-xs font-bold text-cng-700">{station.status}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info icon={<Clock3/>} label="Hours" value={`${station.openingTime} – ${station.closingTime}`}/><Info icon={<Phone/>} label="Contact" value={station.phone}/><Info icon={<Fuel/>} label="CNG price" value={`₹${station.cngPrice}/kg`}/><Info icon={<Users/>} label="Current queue" value={`${station.queueLength} vehicles • ~${wait} min`}/></div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-500">Available slots</span><span className="font-extrabold text-slate-800">{station.availableSlots} / {station.totalSlots}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cng-500" style={{ width: `${Math.min(100, station.availableSlots / station.totalSlots * 100)}%` }}/></div></div>
        <div className="mt-5 flex flex-wrap gap-3"><Link to={`/book-slot?station=${station._id}`} className="rounded-xl bg-cng-600 px-5 py-3 text-sm font-bold text-white hover:bg-cng-700">Book a slot</Link><a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Navigation size={17}/> Get directions</a></div>
      </div>
      <AppleMap stations={[station]} selectedStation={station} className="min-h-[420px] lg:h-full"/>
    </div>
  </section>;
}
function Info({icon,label,value}) { return <div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">{icon} {label}</div><p className="mt-2 font-bold text-slate-800">{value}</p></div>; }
