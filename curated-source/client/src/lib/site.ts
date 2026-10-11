/**
 * Brand and legal-entity details shown in the footer, the policy pages and the contact page.
 * UK law requires the registered company name, number, place of registration and registered
 * office to appear on the website.
 */
export const SITE = {
  name: 'Curated Art',
  domain: 'curated-art.shop',
  url: 'https://www.curated-art.shop',
  supportEmail: 'support@curated-art.shop',
  phone: '+44 7868 142462',
  phoneHref: 'tel:+447868142462',
  company: {
    legalName: 'FITMORF LTD',
    number: '16782808',
    registeredIn: 'England and Wales',
    registeredOffice: '2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom',
  },
  /** Shown on the policy pages; keep in step with POLICIES_VERSION in server/lib/legal.ts. */
  policiesUpdated: '11 October 2026',
};

export const tradingNameNotice = `${SITE.name} is a trading name of ${SITE.company.legalName}, a company registered in ${SITE.company.registeredIn} (company number ${SITE.company.number}). Registered office: ${SITE.company.registeredOffice}.`;
