import { useEffect, useRef, useState } from 'react';

const NASHIK = { latitude: 20.0059, longitude: 73.7897 };

function loadMapKit() {
  return new Promise((resolve, reject) => {
    if (window.mapkit) return resolve(window.mapkit);
    const token = import.meta.env.VITE_APPLE_MAPKIT_TOKEN;
    if (!token) return reject(new Error('Apple Maps token is not configured. Add VITE_APPLE_MAPKIT_TOKEN to client/.env.'));
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.async = true;
    script.onload = () => {
      try { window.mapkit.init({ authorizationCallback: done => done(token) }); resolve(window.mapkit); }
      catch (error) { reject(error); }
    };
    script.onerror = () => reject(new Error('Unable to load Apple Maps. Check your internet connection.'));
    document.head.appendChild(script);
  });
}

export default function AppleMap({ stations = [], selectedStation = null, className = 'h-[420px]' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadMapKit().then(mapkit => {
      if (cancelled || !containerRef.current) return;
      const center = selectedStation ? { latitude: selectedStation.latitude, longitude: selectedStation.longitude } : NASHIK;
      const map = new mapkit.Map(containerRef.current);
      map.region = new mapkit.CoordinateRegion(new mapkit.Coordinate(center.latitude, center.longitude), new mapkit.CoordinateSpan(0.12, 0.12));
      map.showsUserLocationControl = true;
      mapRef.current = map;

      const annotations = stations.filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude)).map(station => {
        const annotation = new mapkit.MarkerAnnotation(new mapkit.Coordinate(station.latitude, station.longitude), {
          title: station.name,
          subtitle: `${station.status} • ${station.availableSlots}/${station.totalSlots} slots available`,
          color: station.status === 'Closed' ? '#ef4444' : station.status === 'Busy' ? '#f59e0b' : '#16a34a'
        });
        annotation.data = station;
        return annotation;
      });
      map.addAnnotations(annotations);
      if (selectedStation) map.setCenterAnimated(new mapkit.Coordinate(selectedStation.latitude, selectedStation.longitude));
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; if (mapRef.current) mapRef.current.destroy(); };
  }, [stations, selectedStation]);

  if (error) return <div className={`${className} grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center`}><div><p className="font-bold text-slate-700">Apple Maps needs one setup step</p><p className="mt-2 max-w-md text-sm text-slate-500">{error}</p></div></div>;
  return <div ref={containerRef} className={`${className} overflow-hidden rounded-2xl`} aria-label="Apple Maps showing CNG stations" />;
}
