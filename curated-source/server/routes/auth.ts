import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { galleries, users } from '../db/schema';
import { currentUser, hashPassword, requireAuth, signToken, verifyPassword } from '../lib/auth';
import { permissionsFor } from '../lib/rbac';
import { conflict, unauthorized } from '../lib/errors';
import { audit } from '../lib/audit';
import { POLICIES_VERSION } from '../lib/legal';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  country: z.string().trim().length(2).toUpperCase().default('US'),
});

function profile(userId: number) {
  const user = db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, country: users.country, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .get()!;
  const gallery =
    db
      .select({ id: galleries.id, name: galleries.name, slug: galleries.slug, status: galleries.status })
      .from(galleries)
      .where(eq(galleries.ownerId, userId))
      .get() ?? null;
  return { ...user, gallery, permissions: permissionsFor(user.role) };
}

authRouter.post('/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const exists = db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).get();
  if (exists) throw conflict('An account with this email already exists');
  const created = db
    .insert(users)
    .values({ name: body.name, email: body.email, country: body.country, passwordHash: await hashPassword(body.password) })
    .returning({ id: users.id })
    .get();
  req.user = { id: created.id, email: body.email, name: body.name, role: 'buyer' };
  audit(req, 'user.register', 'user', created.id, { acceptedPolicies: POLICIES_VERSION });
  res.status(201).json({ token: signToken(created), user: profile(created.id) });
});

authRouter.post('/login', async (req, res) => {
  const body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string() }).parse(req.body);
  const user = db.select().from(users).where(eq(users.email, body.email)).get();
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) throw unauthorized('Invalid email or password');
  if (user.status !== 'active') throw unauthorized('This account has been suspended');
  res.json({ token: signToken(user), user: profile(user.id) });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: profile(currentUser(req).id) });
});

authRouter.patch('/me', requireAuth, (req, res) => {
  const body = z
    .object({ name: z.string().trim().min(2).max(80).optional(), country: z.string().trim().length(2).toUpperCase().optional() })
    .parse(req.body);
  db.update(users).set(body).where(eq(users.id, currentUser(req).id)).run();
  res.json({ user: profile(currentUser(req).id) });
});
