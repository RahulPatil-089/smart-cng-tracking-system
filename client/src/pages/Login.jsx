import { useState } from 'react';
import { CarFront, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    try { setLoading(true); await login(form); navigate(location.state?.from || '/dashboard', { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'Unable to sign in. Check your details.'); }
    finally { setLoading(false); }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to manage your CNG refueling journey.">
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <Field label="Email address" icon={<Mail size={18}/>}><input type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" className="input" /></Field>
      <Field label="Password" icon={<LockKeyhole size={18}/>}><div className="relative"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Enter your password" className="input pr-11" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></Field>
      <button disabled={loading} className="primary-btn">{loading ? 'Signing in...' : 'Sign in'}</button>
      <p className="text-center text-sm text-slate-500">New to Smart CNG? <Link to="/register" className="font-bold text-cng-600 hover:underline">Create an account</Link></p>
    </form>
  </AuthShell>;
}

function Field({ label, icon, children }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}{children}</div></label>; }
function AuthShell({ title, subtitle, children }) { return <div className="grid min-h-[calc(100vh-64px)] place-items-center bg-gradient-to-br from-cng-50 via-white to-slate-100 px-4 py-10"><div className="w-full max-w-md"><div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cng-600 text-white shadow-lg shadow-cng-600/20"><CarFront size={27}/></div><h1 className="text-3xl font-extrabold text-ink">{title}</h1><p className="mt-2 text-slate-500">{subtitle}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">{children}</div></div></div>; }
