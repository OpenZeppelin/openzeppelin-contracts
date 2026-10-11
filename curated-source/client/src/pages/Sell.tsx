import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ImageUp, Wallet } from 'lucide-react';
import { Page } from '../components/Layout';
import { ErrorNote, Field } from '../components/ui';
import { AgreeCheckbox } from '../components/AgreeCheckbox';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { COUNTRIES } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

/** 30-second onboarding: account + gallery in one step, then straight into the first listing. */
export default function Sell() {
  useDocumentTitle('Sell with us');
  const { user, register, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', gallery: '', location: '', country: 'US' });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (user?.role === 'seller') navigate('/vendor/listings/new', { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!user) await register({ name: form.name, email: form.email, password: form.password, country: form.country });
      await api('/vendor/apply', { body: { name: form.gallery, location: form.location, country: form.country, acceptTerms: agreed } });
      await refresh();
      navigate('/vendor/listings/new?welcome=1');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const staff = user && user.role !== 'buyer' && user.role !== 'seller';

  return (
    <Page className="py-16">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <div className="eyebrow mb-4">For galleries, studios & artists</div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Your gallery, open in <span className="italic text-gold">thirty seconds.</span></h1>
          <p className="mt-6 max-w-lg text-mute">Join a marketplace built for serious collectors. List works in moments, reach buyers worldwide, and get paid securely through escrow.</p>
          <div className="mt-12 space-y-8">
            {[
              [Clock, 'One form, then you’re listing', 'Create your account and gallery together. Your first listing is the very next screen.'],
              [ImageUp, 'Drag, drop, done', 'Drop in high-resolution images or video — we generate optimised thumbnails automatically.'],
              [Wallet, 'Escrow-backed payouts', 'Buyers pay into escrow; once released, request a payout to your bank in a click.'],
            ].map(([Icon, t, b]: any) => (
              <div key={t} className="flex gap-5">
                <Icon size={22} strokeWidth={1.2} className="mt-1 shrink-0 text-gold" />
                <div>
                  <h3 className="text-2xl">{t}</h3>
                  <p className="mt-1 text-sm text-mute">{b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6 sm:p-10">
          {staff ? (
            <p className="text-mute">Staff accounts cannot open galleries. Sign in with a collector account to start selling.</p>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="mb-2 text-3xl">{user ? 'Name your gallery' : 'Open your gallery'}</h2>
              {!user && (
                <>
                  <Field label="Your name"><input value={form.name} onChange={set('name')} className="field" required minLength={2} autoComplete="name" /></Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email"><input type="email" value={form.email} onChange={set('email')} className="field" required autoComplete="email" /></Field>
                    <Field label="Password"><input type="password" value={form.password} onChange={set('password')} className="field" required minLength={8} autoComplete="new-password" /></Field>
                  </div>
                </>
              )}
              <Field label="Gallery or studio name"><input value={form.gallery} onChange={set('gallery')} className="field" required minLength={2} placeholder="e.g. Atelier Nord" /></Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City"><input value={form.location} onChange={set('location')} className="field" placeholder="e.g. Oslo, Norway" /></Field>
                <Field label="Ships from">
                  <select value={form.country} onChange={set('country')} className="field">
                    {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                </Field>
              </div>
              <AgreeCheckbox checked={agreed} onChange={setAgreed}>
                I agree to the <Link to="/legal/seller-agreement" target="_blank">Seller Agreement</Link> and the{' '}
                <Link to="/legal/terms" target="_blank">Terms of Service</Link>, including the 14-day return right offered to buyers.
              </AgreeCheckbox>
              <ErrorNote error={error} />
              <button className="btn-gold w-full" disabled={busy || !agreed}>{busy ? 'Opening…' : 'Open gallery & list first work'}</button>
              <p className="text-xs text-faint">
                New galleries are reviewed by our team before works go public — usually within one business day.
                {!user && <> Already have an account? <Link to="/login?next=/sell" className="text-gold">Sign in</Link>.</>}
              </p>
            </form>
          )}
        </div>
      </div>
    </Page>
  );
}
