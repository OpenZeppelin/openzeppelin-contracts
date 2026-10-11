import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { ArtFrame } from '../components/ArtFrame';
import { EscrowTimeline } from '../components/EscrowTimeline';
import { Page } from '../components/Layout';
import { ErrorNote, Field, Notice, Spinner } from '../components/ui';
import { AgreeCheckbox } from '../components/AgreeCheckbox';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { COUNTRIES, money } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { ListingDetail, Order, ShippingAddress } from '../lib/types';

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { listingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error: loadError } = useApi<{ listing: ListingDetail }>(`/listings/${listingId}`);
  const listing = data?.listing;
  const [address, setAddress] = useState<ShippingAddress>({ fullName: user?.name ?? '', line1: '', line2: '', city: '', region: '', postalCode: '', country: user?.country ?? 'US' });
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (loadError) return <Page className="py-20"><ErrorNote error={loadError} /></Page>;
  if (!listing) return <Spinner />;

  const domestic = address.country === listing.originCountry;
  const shipping = domestic ? listing.shippingDomesticCents : listing.shippingInternationalCents;
  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddress({ ...address, [k]: e.target.value });

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ order: Order }>('/orders', { body: {
          listingId: listing.id,
          shippingAddress: { ...address, line2: address.line2 || undefined, region: address.region || undefined },
          acceptTerms: agreed,
        }, });
      setOrder(r.order);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/orders/${order.id}/actions/pay`, { body: {} });
      navigate(`/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <Page className="py-12">
      <div className="eyebrow mb-3">Secure acquisition</div>
      <h1 className="mb-10 text-5xl">Checkout</h1>
      <div className="mb-12 max-w-3xl">
        <EscrowTimeline status="pending" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          {!order ? (
            <form onSubmit={placeOrder} className="space-y-5">
              <h2 className="text-3xl">1. Delivery address</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Full name"><input value={address.fullName} onChange={set('fullName')} className="field" required autoComplete="name" /></Field></div>
                <div className="sm:col-span-2"><Field label="Address"><input value={address.line1} onChange={set('line1')} className="field" required autoComplete="address-line1" /></Field></div>
                <div className="sm:col-span-2"><Field label="Apartment, suite (optional)"><input value={address.line2} onChange={set('line2')} className="field" autoComplete="address-line2" /></Field></div>
                <Field label="City"><input value={address.city} onChange={set('city')} className="field" required autoComplete="address-level2" /></Field>
                <Field label="State / Region"><input value={address.region} onChange={set('region')} className="field" autoComplete="address-level1" /></Field>
                <Field label="Postal code"><input value={address.postalCode} onChange={set('postalCode')} className="field" required autoComplete="postal-code" /></Field>
                <Field label="Country">
                  <select value={address.country} onChange={set('country')} className="field">
                    {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                </Field>
              </div>
              <AgreeCheckbox checked={agreed} onChange={setAgreed}>
                I agree to the <Link to="/legal/terms" target="_blank">Terms of Service</Link>, and I have read the{' '}
                <Link to="/legal/refunds" target="_blank">Refunds &amp; Returns</Link> and <Link to="/legal/shipping" target="_blank">Shipping</Link> policies.
                International orders may be subject to import duties payable on delivery.
              </AgreeCheckbox>
              <ErrorNote error={error} />
              <button className="btn-gold" disabled={busy || !agreed}>{busy ? 'Reserving…' : 'Reserve & continue to payment'}</button>
              <p className="text-xs text-faint">The piece is reserved for you for 30 minutes while you complete payment.</p>
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl">2. Payment into escrow</h2>
              <Notice>Order {order.reference} reserved. Complete payment to secure the piece.</Notice>
              <div className="card space-y-4 p-6">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-mute"><Lock size={12} /> Card payment</div>
                <input className="field" defaultValue="4242 4242 4242 4242" aria-label="Card number" readOnly />
                <div className="grid grid-cols-2 gap-4">
                  <input className="field" defaultValue="12 / 30" aria-label="Expiry" readOnly />
                  <input className="field" defaultValue="•••" aria-label="CVC" readOnly />
                </div>
                <p className="text-xs text-faint">Demo mode — no card is charged. In production, wire this step to your payment provider (see README).</p>
              </div>
              <ErrorNote error={error} />
              <button onClick={pay} className="btn-gold w-full py-4" disabled={busy}>
                <ShieldCheck size={14} /> {busy ? 'Securing…' : `Pay ${money(order.totalCents, order.currency)} into escrow`}
              </button>
              <button onClick={() => api(`/orders/${order.id}/actions/cancel`, { body: {} }).then(() => navigate(`/listing/${listing.slug}`))} className="text-xs uppercase tracking-[0.2em] text-faint hover:text-bone">
                Cancel reservation
              </button>
            </div>
          )}
        </div>
        <aside className="card h-fit p-6">
          <ArtFrame media={listing.cover} alt={listing.title} ratio="4/3" />
          <div className="mt-5">
            <Link to={`/listing/${listing.slug}`} className="font-serif text-2xl italic hover:text-gold">{listing.title}</Link>
            <p className="text-sm text-mute">{listing.artist} · {listing.gallery?.name}</p>
          </div>
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Price</dt><dd className="tabular-nums">{money(listing.priceCents, listing.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">{domestic ? 'Domestic' : 'International'} shipping</dt><dd className="tabular-nums">{money(order?.shippingCents ?? shipping, listing.currency)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt>Total held in escrow</dt><dd className="font-serif text-2xl tabular-nums text-gold">{money(order?.totalCents ?? listing.priceCents + shipping, listing.currency)}</dd></div>
          </dl>
          <div className="mt-6 flex gap-3 border border-gold/30 bg-gold/[0.04] p-4 text-xs leading-relaxed text-mute">
            <ShieldCheck size={20} strokeWidth={1.2} className="shrink-0 text-gold" />
            Funds stay in escrow until you confirm delivery and release them. If anything is wrong, open a dispute and a specialist will step in.
          </div>
        </aside>
      </div>
    </Page>
  );
}
