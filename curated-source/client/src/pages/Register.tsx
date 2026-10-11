import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '../components/Layout';
import { ErrorNote, Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { COUNTRIES } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', country: 'US' });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate(params.get('next') ?? '/gallery', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="flex min-h-[75vh] items-center justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md space-y-5">
        <div className="eyebrow mb-4 text-center">Join the collectors</div>
        <h1 className="mb-10 text-center text-5xl">Create account</h1>
        <Field label="Full name"><input value={form.name} onChange={set('name')} className="field" autoComplete="name" required minLength={2} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={set('email')} className="field" autoComplete="email" required /></Field>
        <Field label="Password" hint="At least 8 characters"><input type="password" value={form.password} onChange={set('password')} className="field" autoComplete="new-password" required minLength={8} /></Field>
        <Field label="Country">
          <select value={form.country} onChange={set('country')} className="field">
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </Field>
        <ErrorNote error={error} />
        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-xs leading-relaxed text-faint">
          By creating an account you agree to our <Link to="/legal/terms" className="text-mute underline-offset-4 hover:underline">Terms of Service</Link> and confirm
          you have read our <Link to="/legal/privacy" className="text-mute underline-offset-4 hover:underline">Privacy Policy</Link>.
        </p>
        <p className="text-center text-sm text-mute">Already registered? <Link to="/login" className="text-gold hover:underline">Sign in</Link></p>
      </form>
    </Page>
  );
}
