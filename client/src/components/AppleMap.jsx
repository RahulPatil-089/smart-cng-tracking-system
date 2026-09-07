import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const NASHIK = { latitude: 20.0059, longitude: 73.7897 };

function loadMapKit() {
  return new Promise((resolve, reject) => {
    if (window.mapkit) return resolve(window.mapkit);
    const token = import.meta.env.VITE_APPLE_MAPKIT_TOKEN;
    if (!token) return reject(new Error('Apple Maps token is not configured. Add VITE_APPLE_MAPKIT_TOKEN to client/.env.'));
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.async = true;
    script.onload = () => { try { window.mapkit.init({ authorizationCallback: done => done(token) }); resolve(window.mapkit); } catch (error) { reject(error); } };
    script.onerror = () => reject(new Error('Unable to load Apple Maps. Check your internet connection.'));
    document.head.appendChild(script);
  });
}

export default function AppleMap({ stations = [], selectedStation = null, className = 'h-[420px]' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(selectedStation);

  useEffect(() => { setSelected(selectedStation); }, [selectedStation]);

  useEffect(() => {
    let cancelled = false;
    loadMapKit().then(mapkit => {
      if (cancelled || !containerRef.current) return;
      const center = selectedStation ? { latitude: selectedStation.latitude, longitude: selectedStation.longitude } : NASHIK;
      const map = new mapkit.Map(containerRef.current);
      map.region = new mapkit.CoordinateRegion(new mapkit.Coordinate(center.latitude, center.longitude), new mapkit.CoordinateSpan(0.12, 0.12));
      map.showsUserLocationControl = true;
      const annotations = stations.filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude)).map(station => {
        const annotation = new mapkit.MarkerAnnotation(new mapkit.Coordinate(station.latitude, station.longitude), {
          title: station.name,
          subtitle: `${station.status} • ${station.availableSlots}/${station.totalSlots} pumps available`,
          color: station.status === 'Closed' ? '#ef4444' : station.status === 'Busy' ? '#f59e0b' : '#16a34a'
        });
        annotation.data = station;
        return annotation;
      });
      map.addAnnotations(annotations);
      map.addEventListener('select', event => { const station = event.annotation?.data; if (station) setSelected(station); });
      if (selectedStation) map.setCenterAnimated(new mapkit.Coordinate(selectedStation.latitude, selectedStation.longitude));
      mapRef.current = map;
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.destroy(); mapRef.current = null; } };
  }, [stations, selectedStation]);

  if (error) return <div className={`${className} grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center`}><div><p className="font-bold text-slate-700">Apple Maps needs one setup step</p><p className="mt-2 max-w-md text-sm text-slate-500">{error}</p></div></div>;
  return <div className="relative overflow-hidden rounded-2xl"><div ref={containerRef} className={`${className} w-full`} aria-label="Apple Maps showing CNG stations" />{selected && <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-slate-900">{selected.name}</p><p className="mt-1 text-xs text-slate-500">{selected.address}</p></div><span className="rounded-full bg-cng-50 px-2.5 py-1 text-[11px] font-bold text-cng-700">{selected.status}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span className="rounded-lg bg-slate-50 p-2 font-semibold">{selected.availableSlots}/{selected.totalSlots} pumps</span><span className="rounded-lg bg-slate-50 p-2 font-semibold">{selected.queueLength || 0} waiting</span><span className="rounded-lg bg-slate-50 p-2 font-semibold">₹{selected.cngPrice}/kg</span></div><div className="mt-3 flex gap-2"><Link to={`/stations/${selected._id}`} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-bold">View details</Link><Link to={`/book-slot?station=${selected._id}`} className="flex-1 rounded-lg bg-cng-600 px-3 py-2 text-center text-xs font-bold text-white">Book slot</Link></div></div>}</div>;
}
