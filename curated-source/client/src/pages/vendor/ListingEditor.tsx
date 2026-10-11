import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Page } from '../../components/Layout';
import { MediaUploader } from '../../components/MediaUploader';
import { ErrorNote, Field, Notice, Spinner } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { COUNTRIES, money } from '../../lib/format';
import { useApi, useDocumentTitle, usePlatformConfig } from '../../lib/hooks';
import type { Media } from '../../lib/types';

type Cat = { id: number; name: string; status: 'approved' | 'pending'; parentId: number | null; children: Cat[] };
const SUGGEST = '__suggest__';
const MEDIUMS = ['Oil on canvas', 'Oil on linen', 'Acrylic on canvas', 'Mixed media', 'Watercolour on paper', 'Ink on paper', 'Gelatin silver print', 'Archival pigment print', 'Bronze', 'Marble', 'Stoneware', 'Porcelain', 'Blown glass', 'Oak', 'Walnut', 'Brass'];

const dollars = (cents?: number | null) => (cents == null ? '' : String(cents / 100));
const toCents = (v: string) => Math.round(Number(v || 0) * 100);
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export default function ListingEditor() {
  const { id } = useParams();
  const editing = !!id;
  useDocumentTitle(editing ? 'Edit listing' : 'New listing');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cats = useApi<{ categories: Cat[] }>('/vendor/categories');
  const existing = useApi<{ listing: any }>(editing ? `/vendor/listings/${id}` : null);
  const gallery = useApi<{ gallery: { country: string; status: string } }>('/vendor/gallery');
  const { commissionRate: commission, maxPriceCents } = usePlatformConfig();

  const [media, setMedia] = useState<Media[]>([]);
  const [f, setF] = useState({
    title: '', artist: '', year: '', medium: '', description: '',
    widthCm: '', heightCm: '', depthCm: '',
    price: '', shipDomestic: '', shipInternational: '', originCountry: '',
    provenance: '', edition: 'Unique work', coa: true,
  });
  const [rootId, setRootId] = useState('');
  const [subId, setSubId] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const l = existing.data?.listing;
    if (!l) return;
    setMedia(l.media);
    setF({
      title: l.title, artist: l.artist, year: l.year ? String(l.year) : '', medium: l.medium, description: l.description,
      widthCm: l.widthCm ?? '', heightCm: l.heightCm ?? '', depthCm: l.depthCm ?? '',
      price: dollars(l.priceCents), shipDomestic: dollars(l.shippingDomesticCents), shipInternational: dollars(l.shippingInternationalCents),
      originCountry: l.originCountry, provenance: l.provenance, edition: l.edition, coa: l.certificateOfAuthenticity,
    });
    if (l.category?.parentId) {
      setRootId(String(l.category.parentId));
      setSubId(String(l.category.id));
    } else if (l.category) setRootId(String(l.category.id));
  }, [existing.data]);

  useEffect(() => {
    if (!editing && gallery.data && !f.originCountry) setF((x) => ({ ...x, originCountry: gallery.data!.gallery.country }));
  }, [gallery.data, editing, f.originCountry]);

  const root = useMemo(() => cats.data?.categories.find((c) => String(c.id) === rootId), [cats.data, rootId]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (status: 'active' | 'draft') => {
    setBusy(true);
    setError(null);
    try {
      if (!rootId) throw new Error('Choose a category');
      const category =
        subId === SUGGEST
          ? { suggestedCategory: { parentId: Number(rootId), name: suggestion.trim() } }
          : { categoryId: Number(subId || rootId) };
      const body = {
        title: f.title, artist: f.artist, year: f.year ? Number(f.year) : null, medium: f.medium, description: f.description,
        widthCm: numOrNull(String(f.widthCm)), heightCm: numOrNull(String(f.heightCm)), depthCm: numOrNull(String(f.depthCm)),
        priceCents: toCents(f.price), shippingDomesticCents: toCents(f.shipDomestic), shippingInternationalCents: toCents(f.shipInternational),
        originCountry: f.originCountry || undefined, provenance: f.provenance, edition: f.edition, certificateOfAuthenticity: f.coa,
        media, status, ...category,
      };
      const r = await api<{ listing: { slug: string } }>(editing ? `/vendor/listings/${id}` : '/vendor/listings', { method: editing ? 'PATCH' : 'POST', body });
      navigate(status === 'active' && gallery.data?.gallery.status === 'approved' ? `/listing/${r.listing.slug}` : '/vendor?tab=inventory');
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  if (cats.loading || existing.loading) return <Spinner />;
  const galleryPending = gallery.data && gallery.data.gallery.status !== 'approved';

  return (
    <Page className="py-12">
      <Link to="/vendor" className="text-[11px] uppercase tracking-[0.2em] text-faint hover:text-gold">← Vendor portal</Link>
      <h1 className="mt-4 text-5xl">{editing ? 'Edit listing' : 'List a work'}</h1>
      <div className="mt-6 max-w-3xl space-y-3">
        {params.get('welcome') && <Notice tone="ok">Welcome, {user?.name.split(' ')[0]} — your gallery is open. Add your first work below.</Notice>}
        {galleryPending && <Notice tone="warn">Your gallery is awaiting approval. You can list works now; they go public as soon as you’re approved.</Notice>}
        <ErrorNote error={error} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit('active'); }} className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-12">
          <section>
            <h2 className="mb-5 text-2xl">Media</h2>
            <MediaUploader value={media} onChange={setMedia} />
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <h2 className="text-2xl sm:col-span-2">The work</h2>
            <div className="sm:col-span-2"><Field label="Title"><input value={f.title} onChange={set('title')} className="field" required /></Field></div>
            <Field label="Artist / maker"><input value={f.artist} onChange={set('artist')} className="field" required /></Field>
            <Field label="Year"><input value={f.year} onChange={set('year')} className="field" inputMode="numeric" pattern="\d{4}" placeholder="2024" /></Field>
            <div className="sm:col-span-2">
              <Field label="Medium">
                <input value={f.medium} onChange={set('medium')} className="field" list="mediums" required />
                <datalist id="mediums">{MEDIUMS.map((m) => <option key={m} value={m} />)}</datalist>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <Field label="Width (cm)"><input value={f.widthCm} onChange={set('widthCm')} className="field" inputMode="decimal" /></Field>
              <Field label="Height (cm)"><input value={f.heightCm} onChange={set('heightCm')} className="field" inputMode="decimal" /></Field>
              <Field label="Depth (cm)"><input value={f.depthCm} onChange={set('depthCm')} className="field" inputMode="decimal" /></Field>
            </div>
            <div className="sm:col-span-2"><Field label="Description"><textarea value={f.description} onChange={set('description')} rows={5} className="field" /></Field></div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <h2 className="text-2xl sm:col-span-2">Authenticity</h2>
            <Field label="Edition"><input value={f.edition} onChange={set('edition')} className="field" /></Field>
            <label className="flex items-center gap-3 self-end pb-3 text-sm text-mute">
              <input type="checkbox" checked={f.coa} onChange={set('coa')} className="accent-[#D4AF37]" /> Certificate of authenticity included
            </label>
            <div className="sm:col-span-2"><Field label="Provenance" hint="Ownership history, exhibitions, foundry or print records."><textarea value={f.provenance} onChange={set('provenance')} rows={3} className="field" /></Field></div>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
          <section className="card space-y-5 p-6">
            <h2 className="text-2xl">Category</h2>
            <Field label="Medium / category">
              <select value={rootId} onChange={(e) => { setRootId(e.target.value); setSubId(''); }} className="field" required>
                <option value="">Select…</option>
                {cats.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            {root && (
              <Field label="Subcategory">
                <select value={subId} onChange={(e) => setSubId(e.target.value)} className="field">
                  <option value="">General {root.name}</option>
                  {root.children.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status === 'pending' ? ' (pending review)' : ''}</option>)}
                  <option value={SUGGEST}>+ Suggest a new subcategory…</option>
                </select>
              </Field>
            )}
            {subId === SUGGEST && (
              <Field label="Suggested subcategory" hint="Administrators review suggestions. Your work is listed under the parent category until approved.">
                <input value={suggestion} onChange={(e) => setSuggestion(e.target.value)} className="field" required minLength={2} placeholder="e.g. Encaustic" />
              </Field>
            )}
          </section>

          <section className="card space-y-5 p-6">
            <h2 className="text-2xl">Price & shipping</h2>
            <Field label="Price (USD)" hint={`Up to ${money(maxPriceCents)} per work`}>
              <input value={f.price} onChange={set('price')} className="field text-lg text-gold" inputMode="decimal" required placeholder="0" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Domestic flat rate"><input value={f.shipDomestic} onChange={set('shipDomestic')} className="field" inputMode="decimal" required placeholder="0" /></Field>
              <Field label="International flat rate"><input value={f.shipInternational} onChange={set('shipInternational')} className="field" inputMode="decimal" required placeholder="0" /></Field>
            </div>
            <Field label="Ships from">
              <select value={f.originCountry} onChange={set('originCountry')} className="field">
                {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </Field>
            {Number(f.price) > 0 && (
              <p className="text-xs text-faint">
                You receive {money(toCents(f.price) * (1 - commission) + toCents(f.shipDomestic))} on a domestic sale, after the {Math.round(commission * 100)}% platform commission.
              </p>
            )}
          </section>

          <div className="flex flex-col gap-3">
            <button className="btn-gold w-full py-4" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save & publish' : 'Publish listing'}</button>
            <button type="button" onClick={() => submit('draft')} className="btn-ghost w-full" disabled={busy}>Save as draft</button>
          </div>
        </aside>
      </form>
    </Page>
  );
}
