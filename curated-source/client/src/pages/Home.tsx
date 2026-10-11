import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { Page } from '../components/Layout';
import { ListingGrid } from '../components/ListingCard';
import { SectionHeading, Spinner, Stars } from '../components/ui';
import { mediaUrl } from '../lib/api';
import { useCategories } from '../lib/catalog';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { GallerySummary, Listing } from '../lib/types';

export function GalleryShowcase({ gallery, index = 0 }: { gallery: GallerySummary; index?: number }) {
  return (
    <Link to={`/galleries/${gallery.slug}`} className="group relative block overflow-hidden border border-line" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="aspect-[16/10] overflow-hidden bg-ink-3">
        {gallery.coverUrl && (
          <img src={mediaUrl(gallery.coverUrl)} alt="" loading="lazy" className="h-full w-full object-cover opacity-70 transition-all duration-1000 group-hover:scale-105 group-hover:opacity-90" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="eyebrow mb-2">{gallery.location}</div>
        <h3 className="text-3xl transition-colors group-hover:text-gold sm:text-4xl">{gallery.name}</h3>
        <p className="mt-2 line-clamp-1 text-sm text-mute">{gallery.tagline}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-faint">
          <span>{gallery.listingCount} works</span>
          {gallery.rating && <Stars value={gallery.rating} size={11} />}
          <ArrowRight size={14} className="ml-auto text-gold transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  useDocumentTitle('Collect Extraordinary Works');
  const featured = useApi<{ listings: Listing[] }>('/listings?featured=1&pageSize=8');
  const latest = useApi<{ listings: Listing[] }>('/listings?sort=newest&pageSize=8');
  const galleries = useApi<{ galleries: GallerySummary[] }>('/galleries?featured=1');
  const { categories } = useCategories();
  // The widest featured work makes the strongest full-bleed hero.
  const hero = [...(featured.data?.listings ?? [])].sort(
    (a, b) => (b.cover?.width ?? 1) / (b.cover?.height ?? 1) - (a.cover?.width ?? 1) / (a.cover?.height ?? 1),
  )[0];

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-20 flex min-h-[92vh] items-end overflow-hidden">
        <div className="absolute inset-0 bg-ink">
          {hero?.cover && (
            <img src={mediaUrl(hero.cover.url)} alt="" className="animate-ken-burns h-full w-full object-cover opacity-45" fetchPriority="high" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />
        <Page className="relative pb-20 pt-40 sm:pb-28">
          <div className="max-w-3xl animate-fade-up">
            <div className="eyebrow mb-6">Original art · Collectible design · Objects</div>
            <h1 className="text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
              Extraordinary works,
              <br />
              <span className="italic text-gold">held in trust.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
              Acquire directly from the world’s most discerning galleries. Every piece is provenance-verified and every payment is protected in escrow until it arrives.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/gallery" className="btn-gold">
                Enter Gallery <ArrowRight size={14} />
              </Link>
              <Link to="/galleries" className="btn-ghost">Meet the galleries</Link>
            </div>
          </div>
          {hero && (
            <Link to={`/listing/${hero.slug}`} className="absolute bottom-8 right-8 hidden text-right text-xs text-mute hover:text-gold lg:block">
              <span className="font-serif text-base italic text-bone">{hero.title}</span>
              <br />
              {hero.artist} · {hero.gallery?.name}
            </Link>
          )}
        </Page>
      </section>

      {/* Collections */}
      <Page className="py-24">
        <SectionHeading eyebrow="Collections" title="Explore by medium" />
        <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} to={`/gallery?category=${c.slug}`} className="group flex min-h-48 flex-col justify-between bg-ink p-6 transition-colors hover:bg-ink-2">
              <span className="text-[10px] tabular-nums text-faint">{String(c.count ?? 0).padStart(2, '0')} works</span>
              <div>
                <h3 className="text-2xl transition-colors group-hover:text-gold">{c.name}</h3>
                <p className="mt-2 text-xs text-faint">{c.children.map((s) => s.name).join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </Page>

      {/* Featured works */}
      <Page className="pb-24">
        <SectionHeading
          eyebrow="Curators’ selection"
          title="Featured works"
          action={<Link to="/gallery" className="link-underline text-[11px] uppercase tracking-[0.2em] text-gold">View all works</Link>}
        />
        {featured.loading ? <Spinner /> : <ListingGrid listings={featured.data?.listings ?? []} />}
      </Page>

      {/* Galleries */}
      <section className="border-y border-line bg-ink-2 py-24">
        <Page>
          <SectionHeading
            eyebrow="Featured vendors"
            title="The galleries"
            action={<Link to="/galleries" className="link-underline text-[11px] uppercase tracking-[0.2em] text-gold">All galleries</Link>}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {galleries.data?.galleries.map((g, i) => <GalleryShowcase key={g.id} gallery={g} index={i} />)}
          </div>
        </Page>
      </section>

      {/* Escrow explainer */}
      <Page className="py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="eyebrow mb-4">The Curated Art guarantee</div>
            <h2 className="text-4xl sm:text-5xl">Your acquisition, protected at every stage.</h2>
          </div>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {[
              [ShieldCheck, 'Secured in escrow', 'Your payment is held by Curated Art, never released to the gallery on order.'],
              [Truck, 'Insured dispatch', 'Galleries ship with tracked, insured fine-art logistics, domestic or international.'],
              [PackageCheck, 'Inspect on arrival', 'Confirm the work matches its description and condition report.'],
              [Wallet, 'Release with confidence', 'Funds are released only when you approve — or a specialist resolves any dispute.'],
            ].map(([Icon, title, body]: any) => (
              <div key={title} className="bg-ink p-8">
                <Icon size={22} strokeWidth={1.2} className="text-gold" />
                <h3 className="mt-5 text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Page>

      {/* Latest */}
      <Page className="pb-12">
        <SectionHeading eyebrow="Just arrived" title="New to the gallery" />
        {latest.data && <ListingGrid listings={latest.data.listings.slice(0, 4)} />}
      </Page>

      {/* Seller CTA */}
      <Page className="pt-24">
        <div className="relative overflow-hidden border border-gold/30 px-8 py-16 text-center sm:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_60%)]" />
          <div className="relative">
            <div className="eyebrow mb-4">For galleries & studios</div>
            <h2 className="text-4xl sm:text-5xl">Open your gallery in thirty seconds.</h2>
            <p className="mx-auto mt-4 max-w-xl text-mute">Drag in your images, choose a category, set flat-rate shipping and you’re live once approved. We handle escrow, payments and payouts.</p>
            <Link to="/sell" className="btn-outline mt-8">Start selling</Link>
          </div>
        </div>
      </Page>
    </>
  );
}
