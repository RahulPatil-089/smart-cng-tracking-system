import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app">
      <section className="hero">
        <div className="badge">SMART CNG TRACKING SYSTEM</div>
        <h1>Find CNG Stations.<br />Avoid Long Queues.<br /><span>Refuel Smarter.</span></h1>
        <p>Locate nearby CNG stations, check availability and reserve your refueling slot in advance.</p>
        <div className="actions">
          <button>Find CNG Station</button>
          <button className="secondary">Book a Slot</button>
        </div>
      </section>
      <section className="status">
        <div><strong>Stage 1</strong><span>Project foundation & authentication</span></div>
        <div><strong>API</strong><span>Express + MongoDB ready</span></div>
        <div><strong>Auth</strong><span>JWT + role-based access</span></div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
