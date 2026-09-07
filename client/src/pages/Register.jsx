import { useState } from 'react';
import { CarFront, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initial = { name: '', email: '', phone: '', password: '', confirmPassword: '', vehicleNumber: '', vehicleType: 'Car' };

export default function Register() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState(initial); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (Object.entries(form).some(([key, value]) => key !== 'confirmPassword' && !value.trim())) return setError('Please complete all required fields.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    try { setLoading(true); await register({...form, confirmPassword: undefined}); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'Unable to create your account.'); }
    finally { setLoading(false); }
  };
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-cng-50 via-white to-slate-100 px-4 py-8"><div className="w-full max-w-2xl"><div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-cng-600 text-white"><CarFront size={24}/></div><h1 className="text-3xl font-extrabold text-ink">Create your account</h1><p className="mt-1 text-slate-500">Set up your vehicle profile and start refueling smarter.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"><form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">{error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}<Field label="Full name" icon={<UserRound size={17}/>} value={form.name} onChange={v=>update('name',v)} placeholder="Your name"/><Field label="Email address" icon={<Mail size={17}/>} type="email" value={form.email} onChange={v=>update('email',v)} placeholder="you@example.com"/><Field label="Mobile number" icon={<Phone size={17}/>} value={form.phone} onChange={v=>update('phone',v)} placeholder="9876543210"/><Field label="Vehicle number" value={form.vehicleNumber} onChange={v=>update('vehicleNumber',v)} placeholder="MH 15 AB 1234"/><label><span className="mb-2 block text-sm font-semibold text-slate-700">Vehicle type</span><select value={form.vehicleType} onChange={e=>update('vehicleType',e.target.value)} className="input"><option>Car</option><option>Auto Rickshaw</option><option>Taxi</option><option>Bus</option><option>Truck</option><option>Other</option></select></label><PasswordField label="Password" value={form.password} onChange={v=>update('password',v)} show={show} toggle={()=>setShow(!show)}/><PasswordField label="Confirm password" value={form.confirmPassword} onChange={v=>update('confirmPassword',v)} show={show} toggle={()=>setShow(!show)}/><button disabled={loading} className="primary-btn sm:col-span-2">{loading ? 'Creating account...' : 'Create account'}</button><p className="text-center text-sm text-slate-500 sm:col-span-2">Already have an account? <Link to="/login" className="font-bold text-cng-600 hover:underline">Sign in</Link></p></form></div></div></div>;
}

function Field({label, icon, type='text', value, onChange, placeholder}) { return <label><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={`input ${icon ? 'pl-10' : ''}`} /></div></label>; }
function PasswordField({label,value,onChange,show,toggle}) { return <label><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} className="input pl-10 pr-10" placeholder="At least 6 characters"/><button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>; }
