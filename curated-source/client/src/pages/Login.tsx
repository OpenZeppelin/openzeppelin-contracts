import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '../components/Layout';
import { ErrorNote, Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useDocumentTitle } from '../lib/hooks';

const DEMO = [
  ['Buyer', 'buyer@curated-source.com', 'Buyer#2026'],
  ['Seller', 'lumiere@curated-source.com', 'Seller#2026'],
  ['Sub-Admin', 'moderator@curated-source.com', 'Moderator#2026'],
  ['Super-Admin', 'admin@curated-source.com', 'Admin#2026'],
];

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent, creds?: [string, string]) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(creds?.[0] ?? email, creds?.[1] ?? password);
      const fallback = u.permissions.includes('admin:access') ? '/admin' : u.role === 'seller' ? '/vendor' : '/gallery';
      navigate(params.get('next') ?? fallback, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="flex min-h-[75vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="eyebrow mb-4 text-center">Welcome back</div>
        <h1 className="mb-10 text-center text-5xl">Sign in</h1>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" required /></Field>
          <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" autoComplete="current-password" required /></Field>
          <ErrorNote error={error} />
          <button className="btn-gold w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-mute">
          New to Curated Art? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="text-gold hover:underline">Create an account</Link>
        </p>
        <div className="mt-12 border border-line p-5">
          <div className="eyebrow mb-4">Demo accounts</div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map(([role, e, p]) => (
              <button key={role} onClick={(ev) => submit(ev, [e, p])} className="btn-ghost btn-sm" disabled={busy}>{role}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">One-click sign-in with the seeded demo credentials (see README).</p>
        </div>
      </div>
    </Page>
  );
}
