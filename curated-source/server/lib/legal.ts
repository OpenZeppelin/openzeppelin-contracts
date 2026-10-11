import { z } from 'zod';

/**
 * Version of the published policies (Terms, Seller Agreement, Refunds…). Bump it whenever the
 * policy pages change materially; each acceptance is recorded in the audit log against it.
 */
export const POLICIES_VERSION = '2026-10-11';

export const acceptTermsSchema = z
  .boolean({ message: 'You must accept the terms to continue' })
  .refine((v) => v === true, 'You must accept the terms to continue');
