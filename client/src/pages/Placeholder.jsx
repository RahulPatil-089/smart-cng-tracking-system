import { ArrowLeft, Construction } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const labels = { '/stations': 'Find CNG Stations', '/book-slot': 'Book a Slot', '/bookings': 'My Bookings', '/history': 'Booking History' };
export default function Placeholder() {
  const location = useLocation(); const title = labels[location.pathname] || 'Module';
  return <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-2xl place-items-center px-4 py-12 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cng-50 text-cng-600"><Construction size={30}/></div><h1 className="mt-5 text-3xl font-extrabold">{title}</h1><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">This module is intentionally not mocked with fake actions. It will be connected to real station, slot and booking APIs in the next development stages.</p><Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 font-bold text-cng-600 hover:underline"><ArrowLeft size={17}/> Back to dashboard</Link></div></section>;
}
