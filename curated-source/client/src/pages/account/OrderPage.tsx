import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ArtFrame } from '../../components/ArtFrame';
import { EscrowTimeline } from '../../components/EscrowTimeline';
import { Page } from '../../components/Layout';
import { ErrorNote, Field, Modal, Notice, OrderPill, Spinner, Stars } from '../../components/ui';
import { api } from '../../lib/api';
import { countryName, date, money, ORDER_STATUS } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { OrderAction, OrderDetail } from '../../lib/types';

const ACTIONS: Record<OrderAction, { label: string; style: string; modal?: 'dispatch' | 'reason' | 'note'; confirm?: string }> = {
  pay: { label: 'Pay into escrow', style: 'btn-gold' },
  cancel: { label: 'Cancel reservation', style: 'btn-ghost', confirm: 'Cancel this reservation? The piece will return to the gallery.' },
  decline: { label: 'Decline & refund buyer', style: 'btn-ghost', modal: 'note' },
  dispatch: { label: 'Mark as dispatched', style: 'btn-gold', modal: 'dispatch' },
  confirm_delivery: { label: 'Confirm delivery', style: 'btn-gold', confirm: 'Confirm the work has arrived? You can still open a dispute during inspection.' },
  release: { label: 'Release funds to gallery', style: 'btn-gold', confirm: 'Release escrow to the gallery? This completes the acquisition and cannot be undone.' },
  dispute: { label: 'Open a dispute', style: 'btn-ghost', modal: 'reason' },
  resolve_release: { label: 'Resolve · release to gallery', style: 'btn-gold', modal: 'note' },
  resolve_refund: { label: 'Resolve · refund buyer', style: 'btn-outline', modal: 'note' },
};

const LEDGER_LABEL = { hold: 'Funds secured in escrow', release: 'Released to gallery', commission: 'Platform commission', refund: 'Refunded to buyer' };

function ReviewForm({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [error, setError] = useState<unknown>(null);
  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api(`/orders/${orderId}/review`, { body: { rating, body } });
          onDone();
        } catch (err) {
          setError(err);
        }
      }}
    >
      <div className="eyebrow">Review the gallery</div>
      <Stars value={rating} onChange={setRating} size={20} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="field" placeholder="How was the packaging, communication and the work itself?" />
      <ErrorNote error={error} />
      <button className="btn-outline btn-sm">Publish review</button>
    </form>
  );
}

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useApi<{ order: OrderDetail }>(`/orders/${id}`);
  const [modal, setModal] = useState<OrderAction | null>(null);
  const [input, setInput] = useState({ carrier: '', trackingNumber: '', reason: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  useDocumentTitle(data ? `Order ${data.order.reference}` : 'Order');

  if (loading && !data) return <Spinner />;
  if (!data) return <Page className="py-20"><ErrorNote error={error} /></Page>;
  const o = data.order;

  const run = async (action: OrderAction) => {
    const meta = ACTIONS[action];
    if (meta.modal && modal !== action) {
      setActionError(null);
      return setModal(action);
    }
    if (meta.confirm && !window.confirm(meta.confirm)) return;
    setBusy(true);
    setActionError(null);
    try {
      const body =
        meta.modal === 'dispatch'
          ? { carrier: input.carrier, trackingNumber: input.trackingNumber }
          : meta.modal === 'reason'
            ? { reason: input.reason }
            : meta.modal === 'note' && input.note
              ? { note: input.note }
              : {};
      await api(`/orders/${o.id}/actions/${action}`, { body });
      setModal(null);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const perspective = o.roles.includes('buyer') ? 'buyer' : o.roles.includes('seller') ? 'seller' : 'admin';
  const guidance: Partial<Record<string, string>> = {
    'buyer:pending': 'Complete payment to secure this piece. Reservations expire after 30 minutes.',
    'buyer:in_escrow': 'Your payment is secured in escrow. The gallery is preparing your piece for dispatch.',
    'buyer:dispatched': 'Your piece is on its way. Confirm delivery once it arrives and you have inspected it.',
    'buyer:delivered': 'Inspect the work. If it matches its description, release the funds to the gallery; otherwise open a dispute.',
    'seller:in_escrow': 'Payment is secured in escrow. Pack and ship the work, then add the tracking details.',
    'seller:dispatched': 'Awaiting the collector’s delivery confirmation.',
    'seller:delivered': 'Delivered — funds will be released once the collector approves.',
    'admin:disputed': 'Review the dispute, contact both parties, then release to the gallery or refund the buyer.',
  };
  const hint = guidance[`${perspective}:${o.status}`];

  return (
    <Page className="py-12">
      {params.get('placed') && <div className="mb-8"><Notice tone="ok">Payment secured. Your acquisition is now protected in escrow.</Notice></div>}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-3">Order {o.reference}</div>
          <h1 className="text-4xl sm:text-5xl"><span className="italic">{o.listing?.title}</span></h1>
          <p className="mt-2 text-sm text-mute">Placed {date(o.createdAt, true)} · {o.gallery.name}</p>
        </div>
        <OrderPill status={o.status} />
      </div>

      <div className="card mb-10 p-6 sm:p-10">
        <EscrowTimeline status={o.status} history={o.events.map((e) => e.status)} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {(o.actions.length > 0 || hint) && (
            <section className="border border-gold/30 bg-gold/[0.03] p-6">
              {hint && <p className="mb-5 text-sm text-bone">{hint}</p>}
              <div className="flex flex-wrap gap-3">
                {o.actions.map((a) => (
                  <button key={a} onClick={() => run(a)} disabled={busy} className={ACTIONS[a].style}>{ACTIONS[a].label}</button>
                ))}
              </div>
              {!modal && <div className="mt-4"><ErrorNote error={actionError} /></div>}
            </section>
          )}

          {o.dispute && (
            <section className="border border-bad/30 p-6">
              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-bad">Dispute · {o.dispute.status.replace(/_/g, ' ')}</div>
              <p className="text-sm text-bone">{o.dispute.reason}</p>
              {o.dispute.resolution && <p className="mt-3 border-l border-line pl-3 text-sm text-mute">Resolution: {o.dispute.resolution}</p>}
            </section>
          )}

          {o.canReview && <ReviewForm orderId={o.id} onDone={reload} />}
          {o.review && (
            <section className="card p-6">
              <div className="eyebrow mb-3">Your review</div>
              <Stars value={o.review.rating} />
              <p className="mt-2 font-serif text-lg italic">“{o.review.body}”</p>
            </section>
          )}

          <section>
            <h2 className="mb-5 text-3xl">Activity</h2>
            <ol className="relative space-y-6 border-l border-line pl-6">
              {o.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-bone">{ORDER_STATUS[e.status].label}</span>
                    <span className="text-xs text-faint">{date(e.createdAt, true)}{e.actor ? ` · ${e.actor}` : ''}</span>
                  </div>
                  {e.note && <p className="mt-1 text-sm text-mute">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>

          {o.ledger.length > 0 && (
            <section>
              <h2 className="mb-5 text-3xl">Escrow ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-line border-y border-line">
                    {o.ledger.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 text-mute">{LEDGER_LABEL[t.type]}</td>
                        <td className="py-3 font-mono text-xs text-faint">{t.reference}</td>
                        <td className="py-3 text-xs text-faint">{date(t.createdAt, true)}</td>
                        <td className="py-3 text-right tabular-nums text-bone">{money(t.amountCents, o.currency, { decimals: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <Link to={`/listing/${o.listing?.slug}`}><ArtFrame media={o.listing?.cover} alt={o.listing?.title ?? ''} ratio="4/3" /></Link>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Price</dt><dd className="tabular-nums">{money(o.priceCents, o.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-mute capitalize">{o.shippingRegion} shipping</dt><dd className="tabular-nums">{money(o.shippingCents, o.currency)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2"><dt>Total</dt><dd className="font-serif text-xl tabular-nums text-gold">{money(o.totalCents, o.currency)}</dd></div>
              {perspective !== 'buyer' && (
                <>
                  <div className="flex justify-between text-xs"><dt className="text-faint">Commission</dt><dd className="tabular-nums text-faint">−{money(o.commissionCents, o.currency)}</dd></div>
                  <div className="flex justify-between text-xs"><dt className="text-faint">Gallery receives</dt><dd className="tabular-nums text-mute">{money(o.totalCents - o.commissionCents, o.currency)}</dd></div>
                </>
              )}
            </dl>
          </div>
          <div className="card p-5 text-sm">
            <div className="eyebrow mb-3">Ship to</div>
            <address className="not-italic leading-relaxed text-mute">
              {o.shippingAddress.fullName}<br />
              {o.shippingAddress.line1}<br />
              {o.shippingAddress.line2 && <>{o.shippingAddress.line2}<br /></>}
              {o.shippingAddress.city}{o.shippingAddress.region ? `, ${o.shippingAddress.region}` : ''} {o.shippingAddress.postalCode}<br />
              {countryName(o.shippingAddress.country)}
            </address>
            {o.trackingNumber && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-faint">Tracking</div>
                <div className="mt-1 text-bone">{o.carrier}</div>
                <div className="font-mono text-xs text-gold">{o.trackingNumber}</div>
              </div>
            )}
          </div>
          {perspective !== 'buyer' && (
            <div className="card p-5 text-sm">
              <div className="eyebrow mb-3">Collector</div>
              <div className="text-bone">{o.buyer.name}</div>
              <div className="text-mute">{o.buyer.email}</div>
            </div>
          )}
          <div className="flex gap-3 p-1 text-xs leading-relaxed text-faint">
            <ShieldCheck size={16} className="shrink-0 text-gold" /> Protected by the Curated Art Buyer Protection guarantee.
          </div>
        </aside>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal ? ACTIONS[modal].label : ''}>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (modal) run(modal);
          }}
        >
          {modal && ACTIONS[modal].modal === 'dispatch' && (
            <>
              <Field label="Carrier"><input value={input.carrier} onChange={(e) => setInput({ ...input, carrier: e.target.value })} className="field" placeholder="e.g. DHL Express, FedEx, Momart" required /></Field>
              <Field label="Tracking number"><input value={input.trackingNumber} onChange={(e) => setInput({ ...input, trackingNumber: e.target.value })} className="field" required /></Field>
            </>
          )}
          {modal && ACTIONS[modal].modal === 'reason' && (
            <Field label="What went wrong?" hint="Funds stay frozen in escrow while a specialist reviews the case.">
              <textarea value={input.reason} onChange={(e) => setInput({ ...input, reason: e.target.value })} rows={4} className="field" minLength={10} required />
            </Field>
          )}
          {modal && ACTIONS[modal].modal === 'note' && (
            <Field label="Note (recorded in the audit trail)">
              <textarea value={input.note} onChange={(e) => setInput({ ...input, note: e.target.value })} rows={3} className="field" />
            </Field>
          )}
          <ErrorNote error={actionError} />
          <button className="btn-gold w-full" disabled={busy}>{busy ? 'Working…' : 'Confirm'}</button>
        </form>
      </Modal>
    </Page>
  );
}
