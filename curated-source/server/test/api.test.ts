import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import sharp from 'sharp';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'curated-test-'));
process.env.DATABASE_PATH = path.join(tmp, 'test.db');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');

const { db } = await import('../db/client');
const { runMigrations } = await import('../db/migrate');
const { createApp } = await import('../app');
const { users, categories } = await import('../db/schema');
const { hashPassword } = await import('../lib/auth');

let server: Server;
let base = '';

async function api(method: string, url: string, body?: unknown, token?: string) {
  const isForm = body instanceof FormData;
  const res = await fetch(base + '/api' + url, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'content-type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  return { status: res.status, body: (await res.json()) as any };
}

const login = async (email: string) => (await api('POST', '/auth/login', { email, password: 'Password#1' })).body.token as string;

before(async () => {
  runMigrations(db);
  const pw = await hashPassword('Password#1');
  db.insert(users).values([
    { email: 'admin@t.io', name: 'Admin', role: 'superadmin', passwordHash: pw },
    { email: 'mod@t.io', name: 'Mod', role: 'subadmin', passwordHash: pw },
  ]).run();
  const root = db.insert(categories).values({ name: 'Painting', slug: 'painting' }).returning().get();
  db.insert(categories).values({ name: 'Oil', slug: 'oil', parentId: root.id }).run();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('full marketplace lifecycle: onboarding → listing → escrow → payout', async () => {
  // Seller onboarding
  const reg = await api('POST', '/auth/register', { name: 'Sam Seller', email: 'seller@t.io', password: 'Password#1', country: 'FR' });
  assert.equal(reg.status, 201);
  let sellerToken = reg.body.token;
  assert.equal((await api('GET', '/vendor/listings', undefined, sellerToken)).status, 403, 'buyers cannot manage listings');
  const apply = await api('POST', '/vendor/apply', { name: 'Test Gallery', country: 'FR', acceptTerms: true }, sellerToken);
  assert.equal(apply.status, 201);
  sellerToken = await login('seller@t.io');

  // Upload with automatic thumbnail generation
  const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#D4AF37' } }).png().toBuffer();
  const form = new FormData();
  form.append('files', new Blob([png], { type: 'image/png' }), 'art.png');
  const up = await api('POST', '/vendor/uploads', form, sellerToken);
  assert.equal(up.status, 201);
  assert.equal(up.body.media[0].width, 2400);
  assert.ok(fs.existsSync(path.join(process.env.UPLOAD_DIR!, path.basename(up.body.media[0].thumbUrl))));

  // Listing with a user-suggested category
  const cats = (await api('GET', '/categories')).body.categories;
  const created = await api(
    'POST',
    '/vendor/listings',
    {
      title: 'Gold Field',
      artist: 'A. Painter',
      medium: 'Oil on canvas',
      priceCents: 100_000,
      shippingDomesticCents: 5_000,
      shippingInternationalCents: 20_000,
      suggestedCategory: { parentId: cats[0].id, name: 'Encaustic' },
      media: up.body.media,
    },
    sellerToken,
  );
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const listing = created.body.listing;

  // Not public until the gallery is approved
  assert.equal((await api('GET', `/listings/${listing.slug}`)).status, 404);
  const modToken = await login('mod@t.io');
  const pending = (await api('GET', '/admin/galleries?status=pending', undefined, modToken)).body.galleries;
  assert.equal((await api('PATCH', `/admin/galleries/${pending[0].id}`, { status: 'approved' }, modToken)).status, 200);
  assert.equal((await api('GET', `/listings/${listing.slug}`)).status, 200);
  assert.equal((await api('GET', '/listings?category=painting')).body.total, 1, 'pending subcategory rolls up into its parent');

  // Taxonomy moderation
  const adminCats = (await api('GET', '/admin/categories', undefined, modToken)).body.categories;
  const suggestion = adminCats.find((c: any) => c.status === 'pending');
  assert.equal(suggestion.name, 'Encaustic');
  assert.equal((await api('PATCH', `/admin/categories/${suggestion.id}`, { status: 'approved' }, modToken)).body.category.slug, 'encaustic');

  // Search autocomplete
  assert.ok((await api('GET', '/search/suggest?q=gold')).body.results.some((r: any) => r.type === 'listing'));

  // Buyer checkout (international shipping, FR origin → US)
  const buyerToken = (await api('POST', '/auth/register', { name: 'Bea Buyer', email: 'buyer@t.io', password: 'Password#1', country: 'US' })).body.token;
  const quote = await api('GET', `/listings/${listing.id}/shipping?country=US`);
  assert.deepEqual([quote.body.region, quote.body.shippingCents], ['international', 20_000]);
  const address = { fullName: 'Bea Buyer', line1: '1 Main St', city: 'Boston', postalCode: '02110', country: 'US' };
  assert.equal((await api('POST', '/orders', { listingId: listing.id, shippingAddress: address }, buyerToken)).status, 400, 'terms must be accepted');
  const order = (await api('POST', '/orders', { listingId: listing.id, shippingAddress: address, acceptTerms: true }, buyerToken)).body.order;
  assert.equal(order.status, 'pending');
  assert.equal(order.totalCents, 120_000);
  assert.equal((await api('POST', '/orders', { listingId: listing.id, shippingAddress: address, acceptTerms: true }, buyerToken)).status, 409, 'reserved listing cannot be bought twice');

  const act = (a: string, token: string, body?: object) => api('POST', `/orders/${order.id}/actions/${a}`, body ?? {}, token);
  assert.equal((await act('dispatch', sellerToken, { carrier: 'DHL', trackingNumber: 'X' })).status, 400, 'cannot dispatch before payment');
  assert.equal((await act('pay', sellerToken)).status, 403, 'seller cannot pay for buyer');
  assert.equal((await act('pay', buyerToken)).body.order.status, 'in_escrow');
  assert.equal((await act('dispatch', sellerToken, { carrier: 'DHL', trackingNumber: 'DHL1' })).body.order.status, 'dispatched');
  assert.equal((await act('confirm_delivery', buyerToken)).body.order.status, 'delivered');

  // Dispute → admin resolves in seller's favour
  assert.equal((await act('dispute', buyerToken, { reason: 'Frame corner is chipped on arrival' })).body.order.status, 'disputed');
  assert.equal((await act('resolve_release', buyerToken)).status, 403);
  assert.equal((await act('resolve_release', modToken, { note: 'Damage pre-existing per condition report' })).body.order.status, 'released');

  const detail = (await api('GET', `/orders/${order.id}`, undefined, buyerToken)).body.order;
  assert.deepEqual(detail.ledger.map((t: any) => t.type), ['hold', 'release', 'commission']);
  assert.equal(detail.ledger[1].amountCents + detail.ledger[2].amountCents, 120_000);
  assert.equal(detail.canReview, true);
  assert.equal((await api('POST', `/orders/${order.id}/review`, { rating: 5, body: 'Superb' }, buyerToken)).status, 201);

  // Payouts: balance-limited; only super-admin can process
  const bal = (await api('GET', '/vendor/payouts', undefined, sellerToken)).body.balance;
  assert.equal(bal.availableCents, 120_000 - 12_000);
  assert.equal((await api('POST', '/vendor/payouts', { amountCents: bal.availableCents + 1, method: 'wire', destination: 'FR76 0000' }, sellerToken)).status, 400);
  const payout = (await api('POST', '/vendor/payouts', { amountCents: 50_000, method: 'wire', destination: 'FR76 0000' }, sellerToken)).body.payout;
  assert.equal((await api('PATCH', `/admin/payouts/${payout.id}`, { status: 'approved' }, modToken)).status, 403);
  const adminToken = await login('admin@t.io');
  assert.equal((await api('PATCH', `/admin/payouts/${payout.id}`, { status: 'approved' }, adminToken)).status, 200);
  assert.equal((await api('PATCH', `/admin/payouts/${payout.id}`, { status: 'paid' }, adminToken)).body.balance.availableCents, 58_000);

  // Audit trail captured the sensitive actions
  const logs = (await api('GET', '/admin/audit', undefined, modToken)).body.logs.map((l: any) => l.action);
  const accepted = (await api('GET', '/admin/audit?action=order.create', undefined, modToken)).body.logs[0].metadata.acceptedPolicies;
  assert.ok(accepted, 'policy version recorded with the order');
  for (const a of ['gallery.approved', 'category.approved', 'order.pay', 'order.resolve_release', 'payout.paid']) assert.ok(logs.includes(a), a);
});

test('RBAC guards', async () => {
  const buyer = await login('buyer@t.io');
  assert.equal((await api('GET', '/admin/overview')).status, 401);
  assert.equal((await api('GET', '/admin/overview', undefined, buyer)).status, 403);
  const mod = await login('mod@t.io');
  assert.equal((await api('GET', '/admin/users', undefined, mod)).status, 403, 'sub-admins cannot manage users');
  const admin = await login('admin@t.io');
  assert.equal((await api('GET', '/admin/users', undefined, admin)).status, 200);
});
