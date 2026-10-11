import { Link } from 'react-router-dom';
import { Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { Page } from '../components/Layout';
import { SITE } from '../lib/site';
import { useDocumentTitle } from '../lib/hooks';

export default function Contact() {
  useDocumentTitle('Contact us');
  const c = SITE.company;
  return (
    <Page className="py-12">
      <div className="eyebrow mb-3">We’re here to help</div>
      <h1 className="text-5xl">Contact us</h1>
      <p className="mt-4 max-w-2xl text-mute">
        Questions about a work, an order, a return or selling with us? Write to us and a member of our team will reply within one business day.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <a href={`mailto:${SITE.supportEmail}`} className="card group p-6 transition-colors hover:border-gold/50">
          <Mail size={22} strokeWidth={1.2} className="text-gold" />
          <h2 className="mt-5 text-2xl group-hover:text-gold">Email</h2>
          <p className="mt-2 text-sm text-mute">{SITE.supportEmail}</p>
        </a>
        <div className="card p-6">
          <ShieldCheck size={22} strokeWidth={1.2} className="text-gold" />
          <h2 className="mt-5 text-2xl">An issue with an order</h2>
          <p className="mt-2 text-sm text-mute">
            Open the order from <Link to="/account/orders" className="text-gold">My acquisitions</Link> and choose <em>Open a dispute</em>. Your payment stays on hold while we help.
          </p>
        </div>
        <div className="card p-6">
          <MessageSquare size={22} strokeWidth={1.2} className="text-gold" />
          <h2 className="mt-5 text-2xl">A question about a work</h2>
          <p className="mt-2 text-sm text-mute">Ask the gallery directly in the Questions & answers section of any listing.</p>
        </div>
      </div>

      <div className="mt-12 max-w-2xl border-t border-line pt-8 text-sm leading-relaxed text-mute">
        <div className="eyebrow mb-3">Company information</div>
        <p>
          {SITE.name} is a trading name of <span className="text-bone">{c.legalName}</span>
          <br />
          Registered in {c.registeredIn}, company number {c.number}
          <br />
          Registered office: {c.registeredOffice}
        </p>
      </div>
    </Page>
  );
}
