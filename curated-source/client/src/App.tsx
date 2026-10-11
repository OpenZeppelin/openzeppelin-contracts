import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth } from './lib/auth';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ListingPage from './pages/ListingPage';
import NotFound from './pages/NotFound';

const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const Galleries = lazy(() => import('./pages/Galleries'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/account/Orders'));
const OrderPage = lazy(() => import('./pages/account/OrderPage'));
const Sell = lazy(() => import('./pages/Sell'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const ListingEditor = lazy(() => import('./pages/vendor/ListingEditor'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));
const Contact = lazy(() => import('./pages/Contact'));

/** Client-side guard. The API enforces the same permissions server-side. */
function Guard({ permission, children }: { permission?: string; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (permission && !user.permissions.includes(permission)) return <NotFound forbidden />;
  return <>{children}</>;
}

export function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gallery" element={<Catalog />} />
          <Route path="listing/:slug" element={<ListingPage />} />
          <Route path="galleries" element={<Galleries />} />
          <Route path="galleries/:slug" element={<GalleryPage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="sell" element={<Sell />} />
          <Route path="checkout/:listingId" element={<Guard permission="order:create"><Checkout /></Guard>} />
          <Route path="account/orders" element={<Guard><Orders /></Guard>} />
          <Route path="orders/:id" element={<Guard><OrderPage /></Guard>} />
          <Route path="vendor" element={<Guard permission="listing:manage"><VendorDashboard /></Guard>} />
          <Route path="vendor/listings/new" element={<Guard permission="listing:manage"><ListingEditor /></Guard>} />
          <Route path="vendor/listings/:id" element={<Guard permission="listing:manage"><ListingEditor /></Guard>} />
          <Route path="admin" element={<Guard permission="admin:access"><AdminDashboard /></Guard>} />
          <Route path="legal/:doc" element={<LegalPage />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
