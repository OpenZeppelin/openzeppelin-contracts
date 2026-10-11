import { Link, useParams } from 'react-router-dom';
import { Page, LEGAL_LINKS } from '../../components/Layout';
import { SITE } from '../../lib/site';
import { useDocumentTitle, usePlatformConfig } from '../../lib/hooks';
import NotFound from '../NotFound';
import { LEGAL_DOCS } from './docs';

export default function LegalPage() {
  const { doc } = useParams();
  const legal = doc ? LEGAL_DOCS[doc] : undefined;
  const platform = usePlatformConfig();
  useDocumentTitle(legal?.title);
  if (!legal) return <NotFound />;

  const sections = legal.sections({
    commissionPct: Math.round(platform.commissionRate * 100),
    maxPrice: (platform.maxPriceCents / 100).toLocaleString('en-US'),
  });

  return (
    <Page className="py-12">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="eyebrow mb-4">Policies</div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm lg:flex-col" aria-label="Policies">
            {LEGAL_LINKS.map(([to, label]) => (
              <Link key={to} to={to} className={to === `/legal/${doc}` ? 'text-gold' : 'text-mute hover:text-bone'}>
                {label}
              </Link>
            ))}
            <Link to="/contact" className="text-mute hover:text-bone">Contact us</Link>
          </nav>
        </aside>

        <article className="max-w-3xl">
          <div className="eyebrow mb-3">{SITE.name}</div>
          <h1 className="text-5xl">{legal.title}</h1>
          <p className="mt-4 text-mute">{legal.summary}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-faint">Last updated {SITE.policiesUpdated}</p>

          <nav className="card mt-10 p-5 text-sm" aria-label="Contents">
            <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-mute">Contents</div>
            <ol className="columns-1 gap-8 sm:columns-2">
              {sections.map((s) => (
                <li key={s.id} className="mb-1.5 break-inside-avoid">
                  <a href={`#${s.id}`} className="text-mute hover:text-gold">{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal mt-12 space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="mb-4 text-3xl">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </article>
      </div>
    </Page>
  );
}
