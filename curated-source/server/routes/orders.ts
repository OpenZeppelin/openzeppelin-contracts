import { Router } from 'express';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { disputes, escrowTransactions, galleries, listings, orderEvents, orders, reviews, users } from '../db/schema';
import { config } from '../config';
import { currentUser, requireAuth, requirePermission } from '../lib/auth';
import { actorsFor, availableActions, transitionOrder, TRANSITIONS, type OrderAction } from '../lib/escrow';
import { hydrateListing, hydrateListings } from '../lib/listings';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { orderReference, shippingFor } from '../lib/util';
import { audit } from '../lib/audit';
import { acceptTermsSchema, POLICIES_VERSION } from '../lib/legal';

export const ordersRouter = Router();

export const PENDING_TTL_MINUTES = 30;

/** Releases reservations held by checkouts that were never paid. */
export function expireStaleOrders() {
  const cutoff = new Date(Date.now() - PENDING_TTL_MINUTES * 60_000).toISOString();
  const stale = db.select().from(orders).where(and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoff))).all();
  for (const o of stale) {
    db.transaction((tx) => {
      tx.update(orders).set({ status: 'cancelled', updatedAt: new Date().toISOString() }).where(eq(orders.id, o.id)).run();
      tx.update(listings).set({ status: 'active' }).where(and(eq(listings.id, o.listingId), eq(listings.status, 'reserved'))).run();
      tx.insert(orderEvents).values({ orderId: o.id, status: 'cancelled', note: 'Reservation expired before payment' }).run();
    });
  }
  return stale.length;
}

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().length(2).toUpperCase(),
});

ordersRouter.post('/', requirePermission('order:create'), (req, res) => {
  const body = z
    .object({ listingId: z.number().int().positive(), shippingAddress: addressSchema, acceptTerms: acceptTermsSchema })
    .parse(req.body);
  const user = currentUser(req);
  expireStaleOrders();

  const order = db.transaction((tx) => {
    const row = tx
      .select({ l: listings, g: galleries })
      .from(listings)
      .innerJoin(galleries, eq(galleries.id, listings.galleryId))
      .where(eq(listings.id, body.listingId))
      .get();
    if (!row || row.g.status !== 'approved') throw notFound('Listing not found');
    if (row.g.ownerId === user.id) throw badRequest('You cannot acquire a piece from your own gallery');
    if (row.l.status !== 'active') throw conflict('This piece is no longer available');

    const ship = shippingFor(row.l, body.shippingAddress.country);
    const total = row.l.priceCents + ship.cents;
    const created = tx
      .insert(orders)
      .values({
        reference: orderReference(),
        buyerId: user.id,
        listingId: row.l.id,
        galleryId: row.g.id,
        priceCents: row.l.priceCents,
        shippingCents: ship.cents,
        totalCents: total,
        commissionCents: Math.round(row.l.priceCents * config.commissionRate),
        currency: row.l.currency,
        shippingRegion: ship.region,
        shippingAddress: body.shippingAddress,
      })
      .returning()
      .get();
    tx.update(listings).set({ status: 'reserved' }).where(eq(listings.id, row.l.id)).run();
    tx.insert(orderEvents).values({ orderId: created.id, status: 'pending', note: `Reserved for ${PENDING_TTL_MINUTES} minutes pending payment`, actorId: user.id }).run();
    return created;
  });
  audit(req, 'order.create', 'order', order.id, {
    listingId: order.listingId,
    totalCents: order.totalCents,
    acceptedPolicies: POLICIES_VERSION,
  });
  res.status(201).json({ order });
});

ordersRouter.get('/', requireAuth, (req, res) => {
  const rows = db.select().from(orders).where(eq(orders.buyerId, currentUser(req).id)).orderBy(desc(orders.createdAt)).all();
  res.json({ orders: withListings(rows) });
});

export function withListings(rows: (typeof orders.$inferSelect)[]) {
  const ids = [...new Set(rows.map((o) => o.listingId))];
  const ls = hydrateListings(ids.length ? db.select().from(listings).where(inArray(listings.id, ids)).all() : []);
  return rows.map((o) => ({ ...o, listing: ls.find((l) => l.id === o.listingId) ?? null }));
}

ordersRouter.get('/:id', requireAuth, (req, res) => {
  const user = currentUser(req);
  const order = db.select().from(orders).where(eq(orders.id, Number(req.params.id))).get();
  if (!order) throw notFound('Order not found');
  const actors = actorsFor(user, order);
  if (!actors.length && !(user.role === 'subadmin' || user.role === 'superadmin')) throw forbidden();

  const listing = db.select().from(listings).where(eq(listings.id, order.listingId)).get()!;
  const gallery = db.select({ id: galleries.id, name: galleries.name, slug: galleries.slug }).from(galleries).where(eq(galleries.id, order.galleryId)).get();
  const buyer = db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, order.buyerId)).get();
  const events = db
    .select({ id: orderEvents.id, status: orderEvents.status, note: orderEvents.note, createdAt: orderEvents.createdAt, actor: users.name })
    .from(orderEvents)
    .leftJoin(users, eq(users.id, orderEvents.actorId))
    .where(eq(orderEvents.orderId, order.id))
    .orderBy(asc(orderEvents.id))
    .all();
  const ledger = db.select().from(escrowTransactions).where(eq(escrowTransactions.orderId, order.id)).orderBy(asc(escrowTransactions.id)).all();
  const dispute = db.select().from(disputes).where(eq(disputes.orderId, order.id)).orderBy(desc(disputes.id)).get() ?? null;
  const review = db.select().from(reviews).where(eq(reviews.orderId, order.id)).get() ?? null;

  res.json({
    order: {
      ...order,
      listing: hydrateListing(listing),
      gallery,
      buyer,
      events,
      ledger,
      dispute,
      review,
      roles: actors,
      actions: availableActions(user, order),
      canReview: actors.includes('buyer') && !review && ['delivered', 'released'].includes(order.status),
    },
  });
});

ordersRouter.post('/:id/actions/:action', requireAuth, (req, res) => {
  const action = req.params.action as OrderAction;
  if (!(action in TRANSITIONS)) throw badRequest('Unknown action');
  const input = z
    .object({
      note: z.string().trim().max(1000).optional(),
      carrier: z.string().trim().max(60).optional(),
      trackingNumber: z.string().trim().max(80).optional(),
      reason: z.string().trim().max(2000).optional(),
    })
    .parse(req.body ?? {});
  const updated = transitionOrder(currentUser(req), Number(req.params.id), action, input);
  audit(req, `order.${action}`, 'order', updated.id, { status: updated.status, ...input });
  res.json({ order: updated });
});

ordersRouter.post('/:id/review', requirePermission('review:create'), (req, res) => {
  const body = z.object({ rating: z.number().int().min(1).max(5), body: z.string().trim().max(2000).default('') }).parse(req.body);
  const user = currentUser(req);
  const order = db.select().from(orders).where(eq(orders.id, Number(req.params.id))).get();
  if (!order || order.buyerId !== user.id) throw notFound('Order not found');
  if (!['delivered', 'released'].includes(order.status)) throw badRequest('You can review a piece once it has been delivered');
  if (db.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderId, order.id)).get()) throw conflict('Already reviewed');
  const review = db
    .insert(reviews)
    .values({ orderId: order.id, listingId: order.listingId, galleryId: order.galleryId, buyerId: user.id, rating: body.rating, body: body.body })
    .returning()
    .get();
  audit(req, 'review.create', 'order', order.id, { rating: body.rating });
  res.status(201).json({ review });
});
