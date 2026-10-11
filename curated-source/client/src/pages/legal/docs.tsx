import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../lib/site';

export type LegalCtx = { commissionPct: number; maxPrice: string };
export type LegalSection = { id: string; title: string; body: ReactNode };
export type LegalDoc = { title: string; summary: string; sections: (ctx: LegalCtx) => LegalSection[] };

const C = SITE.company;
const Email = () => <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;
const L = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to}>{children}</Link>;

const whoWeAre: LegalSection = {
  id: 'who-we-are',
  title: 'Who we are',
  body: (
    <>
      <p>
        {SITE.name} ({SITE.domain}) is a trading name of <strong>{C.legalName}</strong>, a company registered in {C.registeredIn} under company number {C.number},
        with its registered office at {C.registeredOffice} (“{SITE.name}”, “we”, “us”).
      </p>
      <p>
        You can contact us at <Email />, by phone on <a href={SITE.phoneHref}>{SITE.phone}</a>, or through our <L to="/contact">contact page</L>.
      </p>
    </>
  ),
};

/* -------------------------------------------------------------------------- */

const terms: LegalDoc = {
  title: 'Terms of Service',
  summary: 'The rules for browsing, buying and using your account on Curated Art.',
  sections: ({ maxPrice }) => [
    whoWeAre,
    {
      id: 'marketplace',
      title: '1. Our role as a marketplace',
      body: (
        <>
          <p>
            {SITE.name} is an online marketplace. Works listed on the site are offered for sale by independent galleries, studios and artists (“Galleries”) who have
            been reviewed and approved by us. When you buy a work, your contract of sale is with the Gallery that listed it, not with {SITE.name}.
          </p>
          <p>
            We provide the platform, collect your payment on the Gallery’s behalf as its limited payment collection agent, hold that payment under our Buyer Protection
            until the work is delivered, and help resolve problems. A payment you make to us counts as payment to the Gallery.
          </p>
        </>
      ),
    },
    {
      id: 'accounts',
      title: '2. Your account',
      body: (
        <ul>
          <li>You must be at least 18 years old and able to enter into binding contracts to create an account or buy.</li>
          <li>Keep your password secure. You are responsible for activity on your account, and you must tell us promptly if you think it has been compromised.</li>
          <li>The information you give us, including your name and delivery address, must be accurate and kept up to date.</li>
          <li>We may suspend or close accounts that break these terms, are used fraudulently, or put other users at risk.</li>
        </ul>
      ),
    },
    {
      id: 'listings',
      title: '3. Listings, prices and availability',
      body: (
        <>
          <p>
            Galleries are responsible for their listings, including descriptions, images, dimensions, condition, edition details, provenance and price. Images are
            provided to represent the work as accurately as possible, but colours can vary between screens.
          </p>
          <p>
            Prices are shown in US dollars (USD) and include the Gallery’s price for the work. Shipping is charged as a flat rate (domestic or international) shown on
            the listing and at checkout. Your card issuer may apply its own currency conversion fees.
          </p>
          <p>
            Works are currently offered online at prices up to US${maxPrice} each, and one buyer’s purchases from the same Gallery are limited to US${maxPrice} in
            total within any 90-day period. Larger acquisitions can be arranged by private enquiry through our <L to="/contact">contact page</L>, subject to
            identity checks.
          </p>
          <p>
            Import duties, customs fees and local taxes charged by the destination country are not included unless stated, and are payable by you on delivery. See our{' '}
            <L to="/legal/shipping">Shipping Policy</L>.
          </p>
        </>
      ),
    },
    {
      id: 'buying',
      title: '4. Buying a work',
      body: (
        <ol>
          <li>When you start checkout, the work is reserved for you for 30 minutes. If you do not complete payment in that time, the reservation is released.</li>
          <li>Your order is accepted and a contract of sale with the Gallery is formed when your payment is successfully taken. We will show your order confirmation on screen and in your account.</li>
          <li>If a Gallery cannot fulfil your order (for example, the work has been damaged before dispatch), the order is cancelled and you receive a full refund.</li>
          <li>We may refuse or cancel an order where we reasonably suspect fraud, a pricing error, or a breach of these terms. You will be refunded in full.</li>
        </ol>
      ),
    },
    {
      id: 'buyer-protection',
      title: '5. Buyer Protection',
      body: (
        <>
          <p>Your payment is not released to the Gallery when you order. Instead:</p>
          <ol>
            <li>Your payment is taken and held by us through our payment provider.</li>
            <li>The Gallery dispatches the work with tracking and insurance.</li>
            <li>When the work arrives, you inspect it and confirm delivery.</li>
            <li>You release the payment to the Gallery once you are satisfied, or raise an issue if it is not as described.</li>
          </ol>
          <p>
            If you raise an issue, the payment stays on hold while our team reviews it with you and the Gallery. If tracking shows the work was delivered and you have
            neither confirmed nor raised an issue within 14 days, we may release the payment to the Gallery.
          </p>
          <p>
            “Escrow” on the site refers to this hold. It is a service we provide as a marketplace; it is not a regulated escrow or client trust account.
          </p>
        </>
      ),
    },
    {
      id: 'cancellations',
      title: '6. Cancellations, returns and refunds',
      body: (
        <p>
          You can return most works within 14 days of delivery, and you have additional rights if a work is damaged, faulty or not as described. Full details are in
          our <L to="/legal/refunds">Refunds &amp; Returns Policy</L>, which forms part of these terms.
        </p>
      ),
    },
    {
      id: 'content',
      title: '7. Reviews, questions and other content',
      body: (
        <>
          <p>
            Only buyers who have received a work can review the Gallery that sold it. Reviews and questions must be honest, relevant and lawful. They must not be
            offensive, defamatory, misleading, or include personal data about others.
          </p>
          <p>
            You keep ownership of what you post, and you give us a non-exclusive, royalty-free licence to display it on the site. We may remove content that breaks
            these rules.
          </p>
        </>
      ),
    },
    {
      id: 'ip',
      title: '8. Intellectual property',
      body: (
        <p>
          Buying a physical work gives you ownership of that object. It does not transfer the copyright in the work, which normally stays with the artist. Images and
          text on the site belong to us, the Galleries or the artists, and may not be copied for commercial use without permission.
        </p>
      ),
    },
    {
      id: 'acceptable-use',
      title: '9. Acceptable use',
      body: (
        <ul>
          <li>Do not use the site for fraud, money laundering or any unlawful purpose.</li>
          <li>Do not try to arrange payment outside the site to avoid Buyer Protection or fees.</li>
          <li>Do not interfere with the site’s security, scrape it at scale, or impersonate others.</li>
        </ul>
      ),
    },
    {
      id: 'liability',
      title: '10. Our liability',
      body: (
        <>
          <p>
            Nothing in these terms limits liability that cannot legally be limited, including for death or personal injury caused by negligence, for fraud, or your
            statutory rights as a consumer.
          </p>
          <p>
            Galleries are responsible for the works they sell. Subject to the paragraph above, we are not liable for losses that were not reasonably foreseeable, for
            business losses, or for problems caused by events outside our reasonable control. Our total liability to you in connection with an order is limited to the
            amount you paid for that order.
          </p>
        </>
      ),
    },
    {
      id: 'changes',
      title: '11. Changes to these terms',
      body: <p>We may update these terms from time to time. The version that applies to an order is the one you accepted at checkout.</p>,
    },
    {
      id: 'law',
      title: '12. Governing law and disputes',
      body: (
        <p>
          These terms are governed by the law of England and Wales. If you are a consumer, you may bring proceedings in England and Wales, or in your home part of
          the UK. Consumers living elsewhere keep any mandatory protections of the law of their country of residence. Please contact us first so we can try to resolve
          any problem informally.
        </p>
      ),
    },
  ],
};

/* -------------------------------------------------------------------------- */

const sellerAgreement: LegalDoc = {
  title: 'Seller Agreement',
  summary: 'The agreement between Curated Art and the galleries, studios and artists who sell on the marketplace.',
  sections: ({ commissionPct, maxPrice }) => [
    whoWeAre,
    {
      id: 'eligibility',
      title: '1. Eligibility and approval',
      body: (
        <>
          <p>
            To sell on {SITE.name} you must be a business (a gallery, studio, dealer or professional artist) acting for purposes relating to your trade, and you must
            be approved by us. We review every gallery before its works go public, and we may decline or suspend a gallery at our discretion.
          </p>
          <p>
            You must complete the identity and bank verification required by our payment provider before you can receive payouts, and keep that information up to
            date. By receiving payouts you also agree to our payment provider’s connected account terms.
          </p>
        </>
      ),
    },
    {
      id: 'listings',
      title: '2. Listings and authenticity',
      body: (
        <>
          <p>You warrant that for every work you list:</p>
          <ul>
            <li>you own it or are authorised to sell it, and it is free from claims by third parties;</li>
            <li>it is authentic and attributed correctly, and its title, artist, date, medium, dimensions, edition and condition are described accurately;</li>
            <li>the provenance you give is true to the best of your knowledge, and you hold documents supporting it;</li>
            <li>the images are of the actual work and show any material damage or restoration.</li>
          </ul>
          <p>
            If a work is shown not to be authentic or not to be as described, you must accept its return and refund the buyer in full, including shipping, and you
            will reimburse any costs we reasonably incur as a result.
          </p>
        </>
      ),
    },
    {
      id: 'prohibited',
      title: '3. Prohibited works',
      body: (
        <>
          <p>You must not list:</p>
          <ul>
            <li>stolen, looted or illegally exported works, or works whose export requires a licence you do not hold;</li>
            <li>forgeries, unauthorised copies, or works that infringe intellectual property rights;</li>
            <li>works containing protected species materials (such as ivory) without the required CITES or other permits;</li>
            <li>works connected with sanctioned countries, entities or persons;</li>
            <li>anything else that is illegal to sell or ship to the buyer’s country.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'sales',
      title: '4. Sales, payments and commission',
      body: (
        <>
          <p>
            You are the seller of each work, and the contract of sale is between you and the buyer. You appoint us as your limited payment collection agent: when the
            buyer pays us, they have paid you.
          </p>
          <p>
            Listing prices may not currently exceed <strong>US${maxPrice}</strong> per work. We also limit a single buyer’s purchases from your gallery to
            that amount within any 90-day period. Larger sales may only be arranged with our agreement, following the checks in section 7.
          </p>
          <p>
            We charge a commission of <strong>{commissionPct}%</strong> of the price of each work sold (excluding shipping). The commission is deducted before the
            sale proceeds are released to you. If we change our commission, we will give you at least 30 days’ notice, and it will not apply to existing orders.
          </p>
          <p>
            Sale proceeds are held under our Buyer Protection and released when the buyer confirms receipt and releases payment, when a dispute is resolved in your
            favour, or under the timing rules in our <L to="/legal/terms">Terms of Service</L>. Released funds are paid to your verified payout account through our
            payment provider.
          </p>
          <p>
            You are responsible for your own taxes, including VAT or sales tax due on your sales, unless the law makes {SITE.name} responsible for collecting a tax on
            a particular sale.
          </p>
        </>
      ),
    },
    {
      id: 'shipping',
      title: '5. Packing and shipping',
      body: (
        <ul>
          <li>Set accurate flat-rate domestic and international shipping prices on each listing.</li>
          <li>Dispatch within 5 business days of payment, and add the carrier and tracking number in your vendor portal.</li>
          <li>Pack works to fine-art standards and insure every shipment for at least the full sale price.</li>
          <li>Prepare correct customs documentation for international shipments, including any export licences.</li>
          <li>The risk of loss or damage stays with you until the work is delivered to the buyer.</li>
        </ul>
      ),
    },
    {
      id: 'returns',
      title: '6. Returns and buyer rights',
      body: (
        <>
          <p>
            You must honour our <L to="/legal/refunds">Refunds &amp; Returns Policy</L>, which gives every buyer a 14-day return right on most works. This applies
            even where the law of your own country would require less. You must also meet the consumer law of the buyer’s country where it gives more protection.
          </p>
          <p>
            If funds have already been released when a refund becomes due, you must refund the buyer promptly. We may recover the amount from your future sale
            proceeds.
          </p>
        </>
      ),
    },
    {
      id: 'aml',
      title: '7. Anti-money-laundering checks',
      body: (
        <p>
          UK anti-money-laundering rules apply to art transactions of €10,000 or more. For these sales we may need to verify your identity and that of the buyer, and
          ask about the source of funds and the provenance of the work, before the sale completes or funds are released. You agree to provide this information
          promptly. We may refuse or cancel a transaction where checks cannot be completed.
        </p>
      ),
    },
    {
      id: 'conduct',
      title: '8. Conduct',
      body: (
        <ul>
          <li>Answer buyer questions promptly, honestly and on the platform.</li>
          <li>Do not invite buyers to complete purchases outside {SITE.name}.</li>
          <li>Use buyers’ personal data only to fulfil their orders, and protect it in line with data protection law.</li>
        </ul>
      ),
    },
    {
      id: 'termination',
      title: '9. Suspension and termination',
      body: (
        <p>
          You may close your gallery at any time once your open orders are complete. We may suspend or end your access if you break this agreement, receive repeated
          justified complaints, or put buyers at risk. Sale proceeds for completed orders will still be paid, less any refunds or amounts you owe.
        </p>
      ),
    },
    {
      id: 'liability',
      title: '10. Liability and indemnity',
      body: (
        <p>
          You indemnify us against claims, losses and costs arising from your listings, the works you sell, or your breach of this agreement. Our liability to you is
          limited to the commission we earned from you in the 12 months before the claim, except where the law does not allow this limit.
        </p>
      ),
    },
    {
      id: 'law',
      title: '11. Governing law',
      body: <p>This agreement is governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.</p>,
    },
  ],
};

/* -------------------------------------------------------------------------- */

const shipping: LegalDoc = {
  title: 'Shipping Policy',
  summary: 'How works are packed, insured and delivered, and what international buyers should know.',
  sections: () => [
    {
      id: 'rates',
      title: 'Flat-rate shipping',
      body: (
        <p>
          Each Gallery sets two flat shipping rates for every work: one for delivery within the Gallery’s own country (domestic), and one for delivery anywhere else
          (international). The rate for your address is shown on the listing (use the shipping calculator) and confirmed at checkout before you pay.
        </p>
      ),
    },
    {
      id: 'dispatch',
      title: 'Dispatch times',
      body: (
        <p>
          Galleries dispatch within 5 business days of payment, unless the listing says otherwise. When your work is dispatched, the carrier and tracking number
          appear in your order page under <L to="/account/orders">My acquisitions</L>.
        </p>
      ),
    },
    {
      id: 'packing',
      title: 'Packing and insurance',
      body: (
        <p>
          Works are packed to fine-art standards (for example, crating, corner protection and moisture barriers where appropriate). Every shipment is insured for at
          least its full sale price, and the Gallery carries the risk until the work is delivered to you.
        </p>
      ),
    },
    {
      id: 'times',
      title: 'Delivery times',
      body: (
        <p>
          Domestic deliveries usually arrive within 3–7 business days of dispatch, and international deliveries within 5–15 business days. Large works and customs
          clearance can take longer. These are estimates, not guarantees.
        </p>
      ),
    },
    {
      id: 'customs',
      title: 'International orders, customs and duties',
      body: (
        <>
          <p>
            International shipments may be charged import duties, import VAT or sales tax, and customs handling fees by the destination country. These charges are
            not included in the price unless the listing says so, and they are payable by you, usually to the carrier before delivery.
          </p>
          <p>
            Some works need export licences or permits (for example, older or high-value works, or works containing protected materials). The Gallery is responsible
            for these, and an order may be cancelled with a full refund if a required licence cannot be obtained.
          </p>
        </>
      ),
    },
    {
      id: 'arrival',
      title: 'When your work arrives',
      body: (
        <>
          <p>
            Please inspect the packaging and the work as soon as you receive it. If anything is damaged, keep all the packaging, take photographs, and raise an issue
            from your order page within 48 hours of delivery. Your payment stays on hold while we resolve it.
          </p>
          <p>
            If you are satisfied, confirm delivery and release payment to the Gallery from your order page. See our{' '}
            <L to="/legal/refunds">Refunds &amp; Returns Policy</L> for your return rights.
          </p>
        </>
      ),
    },
    {
      id: 'failed',
      title: 'Failed or lost deliveries',
      body: (
        <p>
          If a shipment is lost, or returned to the Gallery because it could not be delivered for reasons outside your control, you will receive a full refund or a
          re-delivery at no cost. If delivery fails because of an incorrect address or because duties were refused, return and re-delivery costs may be deducted
          from your refund.
        </p>
      ),
    },
  ],
};

/* -------------------------------------------------------------------------- */

const refunds: LegalDoc = {
  title: 'Refunds & Returns Policy',
  summary: 'Your 14-day right to return, and what happens if a work arrives damaged or not as described.',
  sections: () => [
    {
      id: 'protection',
      title: 'How Buyer Protection keeps you covered',
      body: (
        <p>
          Your payment is held, not passed to the Gallery, until you confirm the work has arrived as described. If something is wrong, raise an issue from your order
          page before you release payment, and the funds stay on hold while our team helps resolve it.
        </p>
      ),
    },
    {
      id: 'before-dispatch',
      title: 'Cancelling before dispatch',
      body: (
        <p>
          You can cancel an unpaid reservation at any time. Once you have paid, contact us or the Gallery as soon as possible. If the work has not yet been
          dispatched, we will cancel the order and refund you in full.
        </p>
      ),
    },
    {
      id: 'change-of-mind',
      title: '14-day return right',
      body: (
        <>
          <p>
            You can return a work for any reason within <strong>14 days of the day it is delivered to you</strong>. This reflects the UK Consumer Contracts
            Regulations, and every Gallery on {SITE.name} offers it, wherever the Gallery is based.
          </p>
          <ol>
            <li>Tell us within the 14 days by raising an issue on your order page or emailing <Email />. You do not have to give a reason.</li>
            <li>Send the work back within 14 days of telling us, in its original condition and packaging, fully insured and with tracking.</li>
            <li>For change-of-mind returns, you pay the cost of the return shipment.</li>
          </ol>
          <p>
            We refund the price and the original standard shipping charge within 14 days of the Gallery receiving the work back (or of you providing proof of
            return, if earlier). We may deduct an amount for any loss in value caused by handling the work more than was necessary to inspect it.
          </p>
        </>
      ),
    },
    {
      id: 'exceptions',
      title: 'Exceptions',
      body: (
        <ul>
          <li>Works made or personalised to your specification (for example, commissions) cannot be returned for change of mind.</li>
          <li>The 14-day return right is for consumers. Business buyers can still use our dispute process if a work is damaged or not as described.</li>
        </ul>
      ),
    },
    {
      id: 'not-as-described',
      title: 'Damaged, faulty or not as described',
      body: (
        <>
          <p>
            If a work arrives damaged, is not authentic, or differs materially from its description, raise an issue within 48 hours of delivery for transit damage,
            or as soon as you notice any other problem. Include photographs.
          </p>
          <p>
            You will be entitled to a full refund, including shipping and the cost of returning the work, which the Gallery pays. Where appropriate, you may instead
            agree to a repair or a partial refund. Your statutory rights under the Consumer Rights Act 2015 are not affected.
          </p>
        </>
      ),
    },
    {
      id: 'disputes',
      title: 'How disputes are decided',
      body: (
        <p>
          A specialist from our team reviews the evidence from you and the Gallery, such as photographs, condition reports, tracking and correspondence. We then
          either refund you or release the payment to the Gallery. We aim to resolve disputes within 10 business days of receiving all the information.
        </p>
      ),
    },
    {
      id: 'how-refunds',
      title: 'How refunds are paid',
      body: (
        <p>
          Refunds go back to your original payment method in the original currency. They usually appear within 5–10 business days, depending on your bank. If the
          payment had already been released to the Gallery, the Gallery refunds you, and we will help make sure it does.
        </p>
      ),
    },
  ],
};

/* -------------------------------------------------------------------------- */

const privacy: LegalDoc = {
  title: 'Privacy Policy',
  summary: 'What personal data we collect, why, who we share it with, and your rights under UK GDPR.',
  sections: () => [
    {
      id: 'controller',
      title: 'Who is responsible for your data',
      body: (
        <p>
          {C.legalName}, trading as {SITE.name}, is the controller of the personal data described in this policy. Contact us about privacy at <Email />. Our
          registered office is {C.registeredOffice}.
        </p>
      ),
    },
    {
      id: 'collect',
      title: 'What we collect',
      body: (
        <ul>
          <li><strong>Account details:</strong> your name, email address, country and password (stored only in encrypted, hashed form).</li>
          <li><strong>Orders:</strong> the works you buy, delivery addresses, order history, and messages linked to orders and disputes.</li>
          <li><strong>Galleries:</strong> gallery profile details, listings, uploaded images, and payout and verification details held by our payment provider.</li>
          <li><strong>Content you post:</strong> questions, answers and reviews.</li>
          <li><strong>Technical data:</strong> IP addresses and records of important account actions, kept in our security and audit logs.</li>
        </ul>
      ),
    },
    {
      id: 'payments',
      title: 'Payment details',
      body: (
        <p>
          Card payments are processed by our payment provider, Stripe. Your full card details are sent directly to Stripe and are never stored on our servers. Stripe
          processes payment data under its own privacy policy, including for fraud prevention.
        </p>
      ),
    },
    {
      id: 'why',
      title: 'Why we use your data, and our legal bases',
      body: (
        <ul>
          <li><strong>To provide the marketplace</strong> (accounts, orders, delivery, Buyer Protection and payouts): to perform our contract with you.</li>
          <li><strong>To keep records and meet legal duties</strong>, such as tax, accounting and anti-money-laundering checks: legal obligation.</li>
          <li><strong>To keep the site secure</strong> and prevent fraud and misuse: our legitimate interests.</li>
          <li><strong>To send marketing emails</strong>, if we ever do: only with your consent, which you can withdraw at any time.</li>
        </ul>
      ),
    },
    {
      id: 'share',
      title: 'Who we share it with',
      body: (
        <ul>
          <li><strong>The Gallery you buy from</strong> receives your name, delivery address and order details so it can ship your work.</li>
          <li><strong>Buyers</strong> who purchase from a gallery see the gallery’s public profile and the shipping details it provides.</li>
          <li><strong>Service providers</strong> who run the site for us: Stripe (payments), Render (hosting), carriers chosen by Galleries, and Google Fonts (which receives your IP address when fonts load).</li>
          <li><strong>Authorities</strong>, where the law requires it.</li>
        </ul>
      ),
    },
    {
      id: 'transfers',
      title: 'International transfers',
      body: (
        <p>
          Some of our providers, including our hosting provider, process data outside the UK, for example in the United States. Galleries may also be located
          outside the UK. Where data leaves the UK, we rely on adequacy regulations or on safeguards such as the UK International Data Transfer Agreement or
          Addendum.
        </p>
      ),
    },
    {
      id: 'retention',
      title: 'How long we keep it',
      body: (
        <p>
          We keep account data while your account is open. Order, payment and tax records are kept for 6 years after the end of the financial year they relate to, as
          UK law requires. Security logs are kept for up to 2 years. When data is no longer needed, we delete or anonymise it.
        </p>
      ),
    },
    {
      id: 'storage',
      title: 'Cookies and browser storage',
      body: (
        <p>
          We do not use advertising or analytics cookies. To keep you signed in, we store a login token in your browser’s local storage. This is strictly
          necessary for the site to work, so it does not need your consent.
        </p>
      ),
    },
    {
      id: 'rights',
      title: 'Your rights',
      body: (
        <>
          <p>
            You have the right to access your data, correct it, have it deleted, restrict or object to its use, and receive it in a portable format. Some of these
            rights have exceptions, for example where we must keep transaction records. To use your rights, email <Email />. We will reply within one month.
          </p>
          <p>
            If you are unhappy with how we handle your data, you can complain to the Information Commissioner’s Office (ico.org.uk). We would appreciate the chance
            to help first.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      title: 'Children',
      body: <p>{SITE.name} is not intended for anyone under 18, and we do not knowingly collect children’s data.</p>,
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      body: <p>We will post any changes on this page and update the date above. If a change is significant, we will tell account holders by email.</p>,
    },
  ],
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms,
  'seller-agreement': sellerAgreement,
  shipping,
  refunds,
  privacy,
};
