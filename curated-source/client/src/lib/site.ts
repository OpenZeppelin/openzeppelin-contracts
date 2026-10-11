/**
 * Brand and legal-entity details shown in the footer, the policy pages and the contact page.
 * UK law requires the registered company name, number, place of registration and registered
 * office to appear on the website, so fill every [placeholder] before going live.
 */
export const SITE = {
  name: 'Curated Art',
  domain: 'curated-art.shop',
  url: 'https://www.curated-art.shop',
  supportEmail: 'support@curated-art.shop',
  company: {
    legalName: 'FITMORF LTD',
    number: '[COMPANY NUMBER]',
    registeredIn: 'England and Wales',
    registeredOffice: '[REGISTERED OFFICE ADDRESS]',
  },
  /** Shown on the policy pages; keep in step with POLICIES_VERSION in server/lib/legal.ts. */
  policiesUpdated: '11 October 2026',
};

export const tradingNameNotice = `${SITE.name} is a trading name of ${SITE.company.legalName}, a company registered in ${SITE.company.registeredIn} (company number ${SITE.company.number}). Registered office: ${SITE.company.registeredOffice}.`;
