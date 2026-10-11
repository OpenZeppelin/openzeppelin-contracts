import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Page } from '../components/Layout';
import { ListingGrid } from '../components/ListingCard';
import { Empty, ErrorNote, Spinner } from '../components/ui';
import { findCategory, useCategories } from '../lib/catalog';
import { money } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { Listing } from '../lib/types';

type Facets = {
  mediums: { value: string; n: number }[];
  galleries: { value: string; label: string; n: number }[];
  price: { min: number; max: number };
};
type ListResponse = { listings: Listing[]; total: number; page: number; pageSize: number; facets: Facets };

const SIZES = [
  ['small', 'Small', 'under 50 cm'],
  ['medium', 'Medium', '50–120 cm'],
  ['large', 'Large', 'over 120 cm'],
] as const;

const PRICE_PRESETS: [string, number | '', number | ''][] = [
  ['Under $1k', '', 1000],
  ['$1k – $2.5k', 1000, 2500],
  ['$2.5k – $5k', 2500, 5000],
  ['$5k – $10k', 5000, 10000],
];

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-6">
      <h4 className="mb-4 text-[11px] uppercase tracking-[0.22em] text-mute">{title}</h4>
      {children}
    </div>
  );
}

function Check({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-sm text-mute hover:text-bone">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex h-3.5 w-3.5 items-center justify-center border ${checked ? 'border-gold bg-gold' : 'border-faint'}`}>
        {checked && <span className="h-1.5 w-1.5 bg-ink" />}
      </span>
      <span className={`flex-1 ${checked ? 'text-bone' : ''}`}>{label}</span>
      {count != null && <span className="text-xs text-faint">{count}</span>}
    </label>
  );
}

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const { categories } = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [minP, setMinP] = useState(params.get('minPrice') ?? '');
  const [maxP, setMaxP] = useState(params.get('maxPrice') ?? '');

  useEffect(() => {
    setMinP(params.get('minPrice') ?? '');
    setMaxP(params.get('maxPrice') ?? '');
  }, [params]);

  const category = findCategory(categories, params.get('category'));
  const q = params.get('q');
  const title = q ? `“${q}”` : category?.node.name ?? 'All works';
  useDocumentTitle(q ? `Search: ${q}` : category?.node.name ?? 'The Gallery');

  const query = new URLSearchParams(params);
  if (!query.get('pageSize')) query.set('pageSize', '24');
  const { data, error, loading } = useApi<ListResponse>(`/listings?${query.toString()}`);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };
  const toggleList = (key: string, value: string) => {
    const set = new Set((params.get(key) ?? '').split(',').filter(Boolean));
    set.has(value) ? set.delete(value) : set.add(value);
    update({ [key]: [...set].join(',') || null });
  };
  const inList = (key: string, value: string) => (params.get(key) ?? '').split(',').includes(value);
  const activeCount = ['medium', 'gallery', 'size', 'minPrice', 'maxPrice'].filter((k) => params.get(k)).length;
  const page = Number(params.get('page') ?? 1);
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1;

  const sidebar = (
    <aside className="text-sm">
      <FilterGroup title="Category">
        <ul className="space-y-1">
          <li>
            <button onClick={() => update({ category: null })} className={`py-1 ${!category ? 'text-gold' : 'text-mute hover:text-bone'}`}>
              All works
            </button>
          </li>
          {categories.map((c) => {
            const open = category?.node.id === c.id || category?.parent?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => update({ category: c.slug })}
                  className={`flex w-full items-center justify-between py-1 text-left ${category?.node.id === c.id ? 'text-gold' : 'text-mute hover:text-bone'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight size={12} className={`transition-transform ${open ? 'rotate-90 text-gold' : 'text-faint'}`} />
                    {c.name}
                  </span>
                  <span className="text-xs text-faint">{c.count}</span>
                </button>
                {open && (
                  <ul className="mb-2 ml-[18px] mt-1 space-y-1 border-l border-line pl-3">
                    {c.children.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => update({ category: s.slug })}
                          className={`flex w-full justify-between py-0.5 text-left ${category?.node.id === s.id ? 'text-gold' : 'text-mute hover:text-bone'}`}
                        >
                          {s.name}
                          <span className="text-xs text-faint">{s.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price (USD)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ minPrice: minP || null, maxPrice: maxP || null });
          }}
        >
          <input value={minP} onChange={(e) => setMinP(e.target.value.replace(/\D/g, ''))} placeholder="Min" inputMode="numeric" className="field px-3 py-2" aria-label="Minimum price" />
          <span className="text-faint">–</span>
          <input value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/\D/g, ''))} placeholder="Max" inputMode="numeric" className="field px-3 py-2" aria-label="Maximum price" />
          <button className="btn-ghost btn-sm" type="submit">Go</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map(([label, lo, hi]) => (
            <button
              key={label}
              onClick={() => update({ minPrice: lo === '' ? null : String(lo), maxPrice: hi === '' ? null : String(hi) })}
              className={`border px-2.5 py-1 text-xs ${params.get('minPrice') === (lo === '' ? null : String(lo)) && params.get('maxPrice') === (hi === '' ? null : String(hi)) ? 'border-gold text-gold' : 'border-line text-mute hover:border-mute'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {data && <p className="mt-3 text-xs text-faint">Range: {money(data.facets.price.min)} – {money(data.facets.price.max)}</p>}
      </FilterGroup>

      <FilterGroup title="Medium">
        <div className="max-h-56 overflow-y-auto pr-1">
          {data?.facets.mediums.map((m) => (
            <Check key={m.value} label={m.value} count={m.n} checked={inList('medium', m.value)} onChange={() => toggleList('medium', m.value)} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Dimensions">
        {SIZES.map(([value, label, hint]) => (
          <Check key={value} label={`${label} · ${hint}`} checked={params.get('size') === value} onChange={() => update({ size: params.get('size') === value ? null : value })} />
        ))}
      </FilterGroup>

      <FilterGroup title="Gallery">
        {data?.facets.galleries.map((g) => (
          <Check key={g.value} label={g.label} count={g.n} checked={inList('gallery', g.value)} onChange={() => toggleList('gallery', g.value)} />
        ))}
      </FilterGroup>

      {activeCount > 0 && (
        <button onClick={() => update({ medium: null, gallery: null, size: null, minPrice: null, maxPrice: null })} className="mt-6 text-[11px] uppercase tracking-[0.2em] text-gold">
          Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
        </button>
      )}
    </aside>
  );

  return (
    <Page className="pt-10">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-faint" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link to="/gallery" className="hover:text-gold">Gallery</Link>
        {category?.parent && (
          <>
            <span>/</span>
            <Link to={`/gallery?category=${category.parent.slug}`} className="hover:text-gold">{category.parent.name}</Link>
          </>
        )}
        {category && (
          <>
            <span>/</span>
            <span className="text-mute">{category.node.name}</span>
          </>
        )}
      </nav>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <h1 className="text-5xl sm:text-6xl">{title}</h1>
          {category?.node.description && <p className="mt-3 max-w-xl text-mute">{category.node.description}</p>}
          {category && !category.parent && category.node.children.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {category.node.children.map((s) => (
                <button key={s.id} onClick={() => update({ category: s.slug })} className="border border-line px-3 py-1.5 text-xs text-mute hover:border-gold hover:text-gold">
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-faint">{data ? `${data.total} work${data.total === 1 ? '' : 's'}` : ''}</span>
          <button onClick={() => setShowFilters(true)} className="btn-ghost btn-sm lg:hidden">
            <SlidersHorizontal size={12} /> Filters {activeCount ? `(${activeCount})` : ''}
          </button>
          <select value={params.get('sort') ?? 'newest'} onChange={(e) => update({ sort: e.target.value })} className="field w-auto py-2 pr-8 text-xs" aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="popular">Most viewed</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
        <div className="-mt-6 hidden lg:block">{sidebar}</div>
        {showFilters && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-ink px-6 pb-10 lg:hidden">
            <div className="sticky top-0 flex items-center justify-between bg-ink py-5">
              <span className="eyebrow">Filters</span>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters"><X size={20} /></button>
            </div>
            {sidebar}
            <button onClick={() => setShowFilters(false)} className="btn-gold mt-8 w-full">Show {data?.total ?? ''} works</button>
          </div>
        )}
        <div>
          <ErrorNote error={error} />
          {loading && !data ? (
            <Spinner />
          ) : data && data.listings.length === 0 ? (
            <Empty title="Nothing on the walls here">Try widening your filters or exploring another collection.</Empty>
          ) : (
            data && (
              <div className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
                <ListingGrid listings={data.listings} cols="sm:grid-cols-2 xl:grid-cols-3" />
              </div>
            )
          )}
          {pages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-6 text-xs uppercase tracking-[0.2em]">
              <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="btn-ghost btn-sm">Previous</button>
              <span className="text-faint">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => update({ page: String(page + 1) })} className="btn-ghost btn-sm">Next</button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
