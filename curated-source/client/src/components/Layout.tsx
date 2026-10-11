import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useCategories } from '../lib/catalog';
import { useClickOutside } from '../lib/hooks';
import { SearchBox } from './SearchBox';
import { SITE, tradingNameNotice } from '../lib/site';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-baseline gap-1 font-serif text-2xl tracking-tight ${className}`} aria-label="Curated Art home">
      <span className="text-bone">curated</span>
      <span className="text-gold transition-transform group-hover:rotate-12">—</span>
      <span className="italic text-bone">art</span>
    </Link>
  );
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  const { categories } = useCategories();
  return (
    <div className="absolute inset-x-0 top-full border-y border-line bg-ink/97 shadow-2xl backdrop-blur-md">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-8 py-10 md:grid-cols-5">
        {categories.map((c) => (
          <div key={c.id}>
            <Link to={`/gallery?category=${c.slug}`} onClick={onClose} className="font-serif text-xl text-bone hover:text-gold">
              {c.name}
            </Link>
            <div className="gold-rule my-3 w-6 opacity-60" />
            <ul className="space-y-2">
              {c.children.map((s) => (
                <li key={s.id}>
                  <Link to={`/gallery?category=${s.slug}`} onClick={onClose} className="text-sm text-mute transition-colors hover:text-gold">
                    {s.name}
                    <span className="ml-1.5 text-faint">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();
  if (!user)
    return (
      <Link to="/login" className="text-[11px] uppercase tracking-[0.2em] text-mute hover:text-gold">
        Sign in
      </Link>
    );
  const isAdmin = user.permissions.includes('admin:access');
  const isSeller = user.role === 'seller';
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm text-mute hover:text-bone" aria-expanded={open}>
        <span className="flex h-8 w-8 items-center justify-center border border-gold/50 font-serif text-gold">{user.name[0]}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-60 border border-line bg-ink-2 py-2 shadow-2xl" onClick={() => setOpen(false)}>
          <div className="border-b border-line px-4 pb-3 pt-1">
            <div className="truncate text-sm text-bone">{user.name}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{user.role.replace('superadmin', 'super-admin').replace('subadmin', 'sub-admin')}</div>
          </div>
          <MenuLink to="/account/orders">My acquisitions</MenuLink>
          {isSeller ? <MenuLink to="/vendor">Vendor portal</MenuLink> : user.role === 'buyer' && <MenuLink to="/sell">Open a gallery</MenuLink>}
          {isAdmin && <MenuLink to="/admin">Admin control panel</MenuLink>}
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="block w-full px-4 py-2 text-left text-sm text-mute hover:bg-ink-3 hover:text-bone"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const MenuLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="block px-4 py-2 text-sm text-mute hover:bg-ink-3 hover:text-bone">
    {children}
  </Link>
);

function Header() {
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { categories } = useCategories();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `text-[11px] uppercase tracking-[0.22em] transition-colors ${isActive ? 'text-gold' : 'text-mute hover:text-bone'}`;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-500 ${scrolled || mega ? 'border-b border-line bg-ink/92 backdrop-blur-md' : 'border-b border-transparent bg-transparent'}`}
      onMouseLeave={() => setMega(false)}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-8 px-4 sm:px-8">
        <button className="text-mute lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
          <Menu size={20} strokeWidth={1.4} />
        </button>
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          <button onMouseEnter={() => setMega(true)} onClick={() => setMega((m) => !m)} className="flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-mute hover:text-bone" aria-expanded={mega}>
            Collections <ChevronDown size={12} />
          </button>
          <NavLink to="/gallery" end className={navCls} onMouseEnter={() => setMega(false)}>
            All Works
          </NavLink>
          <NavLink to="/galleries" className={navCls} onMouseEnter={() => setMega(false)}>
            Galleries
          </NavLink>
          {(!user || user.role === 'buyer') && (
            <NavLink to="/sell" className={navCls} onMouseEnter={() => setMega(false)}>
              Sell
            </NavLink>
          )}
        </nav>
        <div className="ml-auto hidden w-72 md:block">
          <SearchBox />
        </div>
        <Link to="/gallery" className="ml-auto text-mute md:hidden" aria-label="Search">
          <Search size={18} strokeWidth={1.4} />
        </Link>
        <AccountMenu />
      </div>
      {mega && <MegaMenu onClose={() => setMega(false)} />}

      {mobile && (
        <div className="fixed inset-0 z-50 bg-ink lg:hidden">
          <div className="flex h-20 items-center justify-between px-4">
            <Logo />
            <button onClick={() => setMobile(false)} className="text-mute" aria-label="Close menu">
              <X size={22} strokeWidth={1.4} />
            </button>
          </div>
          <div className="h-[calc(100vh-5rem)] overflow-y-auto px-6 pb-12">
            <div className="mb-8">
              <SearchBox onNavigate={() => setMobile(false)} />
            </div>
            <Link to="/gallery" className="block py-3 font-serif text-3xl">All Works</Link>
            <Link to="/galleries" className="block py-3 font-serif text-3xl">Galleries</Link>
            <Link to="/sell" className="block py-3 font-serif text-3xl">Sell with us</Link>
            {user ? (
              <Link to="/account/orders" className="block py-3 font-serif text-3xl">My acquisitions</Link>
            ) : (
              <Link to="/login" className="block py-3 font-serif text-3xl">Sign in</Link>
            )}
            <div className="gold-rule my-8" />
            {categories.map((c) => (
              <div key={c.id} className="mb-6">
                <Link to={`/gallery?category=${c.slug}`} className="eyebrow">{c.name}</Link>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {c.children.map((s) => (
                    <Link key={s.id} to={`/gallery?category=${s.slug}`} className="text-sm text-mute">{s.name}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export const LEGAL_LINKS = [
  ['/legal/terms', 'Terms of Service'],
  ['/legal/seller-agreement', 'Seller Agreement'],
  ['/legal/shipping', 'Shipping Policy'],
  ['/legal/refunds', 'Refunds & Returns'],
  ['/legal/privacy', 'Privacy Policy'],
] as const;

function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">
            A curated marketplace for original art, collectible design and objects of enduring value. Your payment is held until you confirm the work has arrived as described.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Collect</div>
          <ul className="space-y-2 text-sm text-mute">
            <li><Link to="/gallery" className="hover:text-gold">All works</Link></li>
            <li><Link to="/galleries" className="hover:text-gold">Galleries</Link></li>
            <li><Link to="/account/orders" className="hover:text-gold">My acquisitions</Link></li>
          </ul>
          <div className="eyebrow mb-4 mt-8">Galleries</div>
          <ul className="space-y-2 text-sm text-mute">
            <li><Link to="/sell" className="hover:text-gold">Open a gallery</Link></li>
            <li><Link to="/vendor" className="hover:text-gold">Vendor portal</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Policies</div>
          <ul className="space-y-2 text-sm text-mute">
            {LEGAL_LINKS.map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-gold">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Help</div>
          <ul className="space-y-2 text-sm text-mute">
            <li><Link to="/contact" className="hover:text-gold">Contact us</Link></li>
            <li><a href={`mailto:${SITE.supportEmail}`} className="hover:text-gold">{SITE.supportEmail}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1400px] space-y-3 px-4 py-6 sm:px-8">
          <div className="flex flex-wrap justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-faint">
            <span>© {new Date().getFullYear()} {SITE.company.legalName}</span>
            <span>Buyer protection · Provenance verified</span>
          </div>
          <p className="text-xs leading-relaxed text-faint">{tradingNameNotice}</p>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 sm:px-8 ${className}`}>{children}</div>;
}

