/**
 * Demo catalogue: 3 galleries, 18 works with generated artwork, orders at every escrow stage and test accounts.
 * Used by `npm run seed` and, when AUTO_SEED_DEMO=true, by the server on first boot against an empty database.
 */
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { db } from './client';
import { artworkSvg, renderArtwork, type ArtStyle } from './artgen';
import * as schema from './schema';
import type { Role } from './schema';
import { hashPassword } from '../lib/auth';
import { storeImage } from '../lib/images';
import { transitionOrder } from '../lib/escrow';
import { audit } from '../lib/audit';

export const DEMO_PASSWORDS = { admin: 'Admin#2026', moderator: 'Moderator#2026', seller: 'Seller#2026', buyer: 'Buyer#2026' };

/** True when no user exists yet, i.e. the database has never been seeded or used. */
export function isDatabaseEmpty() {
  return !db.select({ id: schema.users.id }).from(schema.users).limit(1).get();
}

/** Inserts the demo data into an already-migrated, empty database. */
export async function seedDemo({ log = console.log }: { log?: (msg: string) => void } = {}) {
  const { users, galleries, categories, listings, listingMedia, orders, orderEvents, questions, reviews, payouts } = schema;

  /* ---------- Users ---------- */

  async function user(name: string, email: string, role: Role, password: string, country = 'US') {
    return db.insert(users).values({ name, email, role, country, passwordHash: await hashPassword(password) }).returning().get();
  }

  const superadmin = await user('Celeste Arden', 'admin@curated-source.com', 'superadmin', DEMO_PASSWORDS.admin);
  await user('Marcus Vale', 'moderator@curated-source.com', 'subadmin', DEMO_PASSWORDS.moderator);
  const sLumiere = await user('Élise Moreau', 'lumiere@curated-source.com', 'seller', DEMO_PASSWORDS.seller, 'FR');
  const sNoir = await user('Julian Cross', 'noir@curated-source.com', 'seller', DEMO_PASSWORDS.seller, 'US');
  const sForm = await user('Astrid Nyholm', 'formvoid@curated-source.com', 'seller', DEMO_PASSWORDS.seller, 'DK');
  const sPending = await user('Rafael Ortega', 'pending.seller@curated-source.com', 'seller', DEMO_PASSWORDS.seller, 'ES');
  const buyer = await user('Victoria Hale', 'buyer@curated-source.com', 'buyer', DEMO_PASSWORDS.buyer, 'US');
  const buyer2 = await user('Kenji Morita', 'collector@curated-source.com', 'buyer', DEMO_PASSWORDS.buyer, 'JP');

  /* ---------- Taxonomy: 5 roots, 11 subcategories, 1 pending suggestion ---------- */

  const tree: [string, string, [string, string][]][] = [
    ['Painting', 'Original works in oil, acrylic and mixed media.', [['Oil on Canvas', 'oil-on-canvas'], ['Abstract', 'abstract'], ['Works on Paper', 'works-on-paper']]],
    ['Sculpture', 'Three-dimensional works in bronze, stone and beyond.', [['Bronze', 'bronze'], ['Stone & Marble', 'stone-marble']]],
    ['Photography', 'Limited edition fine art photographs.', [['Fine Art Prints', 'fine-art-prints'], ['Black & White', 'black-white']]],
    ['Design & Furniture', 'Collectible design, lighting and furniture.', [['Furniture', 'furniture'], ['Lighting', 'lighting']]],
    ['Ceramics & Glass', 'Studio ceramics and art glass.', [['Studio Ceramics', 'studio-ceramics'], ['Art Glass', 'art-glass']]],
  ];
  const cat: Record<string, number> = {};
  tree.forEach(([name, description, subs], i) => {
    const root = db.insert(categories).values({ name, slug: name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-'), description, sortOrder: i }).returning().get();
    cat[root.slug] = root.id;
    subs.forEach(([subName, slug], j) => {
      cat[slug] = db.insert(categories).values({ name: subName, slug, parentId: root.id, sortOrder: j }).returning().get().id;
    });
  });

  /* ---------- Galleries ---------- */

  async function cover(style: ArtStyle, seed: number, palette: string[]) {
    const svg = artworkSvg(style, 2400, 1200, seed, palette);
    return (await storeImage(await (await renderArtwork(svg)).jpeg({ quality: 90 }).toBuffer())).url;
  }

  const gLumiere = db
    .insert(galleries)
    .values({
      ownerId: sLumiere.id,
      name: 'Atelier Lumière',
      slug: 'atelier-lumiere',
      tagline: 'Luminous painting from the Left Bank',
      bio: 'Founded in 1987 in the 6th arrondissement, Atelier Lumière represents painters working at the threshold of colour and light. The gallery is known for its long relationships with artists and for museum-grade conservation of every work it places.',
      location: 'Paris, France',
      country: 'FR',
      status: 'approved',
      featured: true,
      coverUrl: await cover('colorfield', 11, ['#1a1410', '#8a5a2b', '#c9a24a', '#3a2418']),
    })
    .returning()
    .get();
  const gNoir = db
    .insert(galleries)
    .values({
      ownerId: sNoir.id,
      name: 'Noir Gallery',
      slug: 'noir-gallery',
      tagline: 'Photography and sculpture in shadow and form',
      bio: 'Noir Gallery occupies a former printing house in Tribeca. Its programme centres on photography and sculpture that explore absence, darkness and the materiality of light.',
      location: 'New York, USA',
      country: 'US',
      status: 'approved',
      featured: true,
      coverUrl: await cover('noir', 22, ['#0d0d0d']),
    })
    .returning()
    .get();
  const gForm = db
    .insert(galleries)
    .values({
      ownerId: sForm.id,
      name: 'Form & Void Studio',
      slug: 'form-and-void-studio',
      tagline: 'Collectible Nordic design, ceramics and glass',
      bio: 'A Copenhagen studio-gallery presenting limited-production furniture, lighting and vessels by Scandinavian makers. Every object is documented with maker certificates and production records.',
      location: 'Copenhagen, Denmark',
      country: 'DK',
      status: 'approved',
      featured: true,
      coverUrl: await cover('vessel', 33, ['#16130f', '#2a241d', '#8b7d6b', '#d9cbb5']),
    })
    .returning()
    .get();
  db.insert(galleries)
    .values({
      ownerId: sPending.id,
      name: 'Maison Verre',
      slug: 'maison-verre',
      tagline: 'Contemporary Mediterranean glass',
      bio: 'A new gallery from Valencia focused on blown and cast glass. Awaiting marketplace approval.',
      location: 'Valencia, Spain',
      country: 'ES',
      status: 'pending',
    })
    .run();

  const suggested = db
    .insert(categories)
    .values({ name: 'Ash-Glazed Stoneware', slug: 'ash-glazed-stoneware-suggested', parentId: cat['ceramics-glass'], status: 'pending', suggestedById: sForm.id })
    .returning()
    .get();

  /* ---------- Listings (18 works, 1–3 images each) ---------- */

  type Seed = {
    g: typeof gLumiere;
    cat: string;
    title: string;
    artist: string;
    year: number;
    medium: string;
    dims: [number, number, number?];
    price: number;
    ship: [number, number];
    style: ArtStyle;
    palette: string[];
    aspect: [number, number];
    provenance: string;
    description: string;
    edition?: string;
    featured?: boolean;
  };

  const P = {
    ember: ['#1b0f0a', '#7a2e12', '#c1601f', '#e6b45a'],
    dusk: ['#141a2b', '#3d3a63', '#c27b6b', '#f0c987'],
    sea: ['#0e1a1f', '#1f4b55', '#7fa7a3', '#e9e1cf'],
    gold: ['#121212', '#2a2a2a', '#D4AF37', '#f1e3b0'],
    bauhaus: ['#efe7da', '#c0392b', '#1d3557', '#D4AF37'],
    ink: ['#f3eee4', '#1a1a1a', '#8c1c13', '#1a1a1a'],
    stone: ['#0f0f0f', '#3a3a3a', '#8f8a82', '#d8d2c6'],
    bronze: ['#0d0b09', '#3b2a1a', '#6e4a26', '#c49a5c'],
    oak: ['#1a1714', '#2e2924', '#a37b4f', '#d4b483'],
    amber: ['#0f0d0b', '#2b2018', '#3a2e24', '#f2b75b'],
    celadon: ['#121614', '#25302b', '#8fae9b', '#d9e6dc'],
    cobalt: ['#0c1018', '#1c2433', '#2f5dab', '#8fd3ff'],
  };

  const seeds: Seed[] = [
    { g: gLumiere, cat: 'abstract', title: 'Threshold of Ember', artist: 'Camille Vasseur', year: 2023, medium: 'Oil on linen', dims: [140, 180], price: 9400, ship: [450, 1200], style: 'colorfield', palette: P.ember, aspect: [4, 5], featured: true, provenance: 'Acquired directly from the artist’s studio, Montreuil, 2023. Exhibited: “Seuils”, Atelier Lumière, Paris, 2024.', description: 'Three suspended fields of burnt sienna and saffron hover over a ground of near-black umber. Vasseur builds each band from more than thirty translucent glazes, so the canvas seems to emit rather than reflect light.' },
    { g: gLumiere, cat: 'oil-on-canvas', title: 'Nocturne in Indigo', artist: 'Camille Vasseur', year: 2022, medium: 'Oil on canvas', dims: [120, 120], price: 7600, ship: [400, 1100], style: 'colorfield', palette: P.dusk, aspect: [1, 1], provenance: 'The artist; Atelier Lumière, Paris. Private collection, Lyon (2022–2024).', description: 'A square meditation on evening light along the Seine, its indigo and rose bands dissolving into one another at the edges.' },
    { g: gLumiere, cat: 'oil-on-canvas', title: 'Littoral I', artist: 'Henri Delacroix-Ames', year: 2021, medium: 'Oil on canvas', dims: [200, 110], price: 9800, ship: [600, 1600], style: 'horizon', palette: P.sea, aspect: [16, 9], featured: true, provenance: 'Commissioned for the Biennale de Lyon 2021; returned to the artist; consigned to Atelier Lumière 2024.', description: 'A panoramic seascape reduced to its horizon, painted on site on the Breton coast over eleven consecutive dawns.' },
    { g: gLumiere, cat: 'works-on-paper', title: 'Étude pour un Silence', artist: 'Inès Marchetti', year: 2024, medium: 'Sumi ink and gold leaf on washi', dims: [56, 76], price: 8400, ship: [120, 380], style: 'lines', palette: P.ink, aspect: [3, 4], provenance: 'Directly from the artist, 2024.', description: 'Sixty hand-drawn ink lines, each drawn in a single breath, interrupted by a seam of 23-carat gold leaf.' },
    { g: gLumiere, cat: 'abstract', title: 'Composition Solaire', artist: 'Inès Marchetti', year: 2023, medium: 'Acrylic and gouache on panel', dims: [90, 120], price: 4200, ship: [220, 640], style: 'geometric', palette: P.bauhaus, aspect: [3, 4], provenance: 'The artist; exhibited “Formes Libres”, Milan, 2023.', description: 'A homage to the Bauhaus colour studies of Itten, reinterpreted with hand-ground pigments and a single gold arc.' },
    { g: gLumiere, cat: 'works-on-paper', title: 'Lignes d’Or', artist: 'Henri Delacroix-Ames', year: 2020, medium: 'Gold ink on black Arches paper', dims: [50, 70], price: 6200, ship: [100, 320], style: 'lines', palette: P.gold, aspect: [5, 7], provenance: 'The artist; private collection, Brussels; Atelier Lumière, 2024.', description: 'Undulating lines of metallic ink drawn with a ruling pen, catching light as the viewer moves.' },

    { g: gNoir, cat: 'black-white', title: 'Tribeca, 4:12 AM', artist: 'Mara Okonkwo', year: 2022, medium: 'Gelatin silver print', dims: [100, 150], price: 3800, ship: [180, 520], style: 'noir', palette: P.stone, aspect: [2, 3], edition: 'Edition 3 of 7 + 2 AP', featured: true, provenance: 'Printed by the artist; edition records held by Noir Gallery.', description: 'Shot on an 8×10 view camera during a citywide blackout, printed by hand on fibre-based paper.' },
    { g: gNoir, cat: 'fine-art-prints', title: 'Salt Flats, Afterglow', artist: 'Leo Brandt', year: 2023, medium: 'Archival pigment print', dims: [180, 100], price: 9600, ship: [200, 560], style: 'horizon', palette: P.dusk, aspect: [16, 9], edition: 'Edition 2 of 5', provenance: 'Printed by Laumont, New York; signed certificate from the artist.', description: 'The Bonneville Salt Flats moments after sunset, the horizon dissolving into violet haze.' },
    { g: gNoir, cat: 'black-white', title: 'Column Study No. 9', artist: 'Mara Okonkwo', year: 2021, medium: 'Platinum-palladium print', dims: [60, 90], price: 7400, ship: [140, 420], style: 'noir', palette: P.stone, aspect: [2, 3], edition: 'Edition 1 of 5', provenance: 'Printed by the artist; exhibited “Afterimage”, Noir Gallery, 2022.', description: 'Raking light across the cast-iron facades of SoHo, rendered in the warm tonal range of platinum.' },
    { g: gNoir, cat: 'bronze', title: 'Vessel of Absence', artist: 'Theo Lindqvist', year: 2022, medium: 'Patinated bronze', dims: [42, 78, 30], price: 9200, ship: [900, 2400], style: 'monolith', palette: P.bronze, aspect: [3, 4], edition: 'Edition 2 of 6', featured: true, provenance: 'Cast at Polich Tallix foundry; foundry certificate and edition ledger included.', description: 'A hollowed monolith whose central void frames the space behind it. Lost-wax cast and finished with a hand-applied ferric patina.' },
    { g: gNoir, cat: 'stone-marble', title: 'Quiet Mass', artist: 'Theo Lindqvist', year: 2024, medium: 'Nero Marquina marble', dims: [35, 60, 28], price: 8600, ship: [850, 2200], style: 'monolith', palette: P.stone, aspect: [4, 5], provenance: 'Carved in Pietrasanta, Italy, 2024. Unique.', description: 'A single block of Spanish black marble, its white veining following the form like a contour line.' },
    { g: gNoir, cat: 'fine-art-prints', title: 'Pacific, Long Exposure', artist: 'Leo Brandt', year: 2020, medium: 'Archival pigment print, face-mounted to acrylic', dims: [150, 150], price: 3400, ship: [220, 600], style: 'horizon', palette: P.sea, aspect: [1, 1], edition: 'Edition 4 of 5', provenance: 'Printed and mounted by Laumont, New York.', description: 'A four-minute exposure that renders the ocean as a perfectly still plane of silver-blue.' },

    { g: gForm, cat: 'furniture', title: 'Hvile Lounge Chair', artist: 'Astrid Nyholm', year: 2023, medium: 'Smoked oak and saddle leather', dims: [78, 82, 84], price: 6900, ship: [650, 1900], style: 'chair', palette: P.oak, aspect: [4, 3], edition: 'Limited production of 24', featured: true, provenance: 'Produced in the Form & Void workshop, Copenhagen; maker’s plaque and production number.', description: 'A low-slung lounge chair in solid smoked oak with a hand-stitched leather sling, joined without metal fasteners.' },
    { g: gForm, cat: 'lighting', title: 'Ember Pendant', artist: 'Sune Kjær', year: 2024, medium: 'Hand-spun brass, opal glass', dims: [60, 40, 60], price: 7200, ship: [180, 540], style: 'lamp', palette: P.amber, aspect: [4, 5], edition: 'Edition of 50', provenance: 'Studio Sune Kjær; numbered and signed under the canopy.', description: 'A shallow dome of hand-spun brass with an opal diffuser that casts a warm, ember-like glow.' },
    { g: gForm, cat: 'studio-ceramics', title: 'Celadon Moon Jar', artist: 'Freja Holm', year: 2023, medium: 'Wood-fired stoneware, celadon glaze', dims: [38, 42, 38], price: 9800, ship: [260, 780], style: 'vessel', palette: P.celadon, aspect: [4, 5], provenance: 'Fired in the artist’s anagama kiln, Bornholm, 2023.', description: 'A large moon jar thrown in two halves and joined, its pale celadon glaze pooling to jade in the recesses.' },
    { g: gForm, cat: 'art-glass', title: 'Tidal Trio', artist: 'Mads Riis', year: 2024, medium: 'Blown cobalt glass', dims: [70, 45, 20], price: 6400, ship: [240, 720], style: 'glass', palette: P.cobalt, aspect: [16, 10], provenance: 'Studio Riis, Ebeltoft; signed and dated on each base.', description: 'Three blown vessels in graduated cobalt, each one irregular, like stones smoothed by the North Sea.' },
    { g: gForm, cat: 'studio-ceramics', title: 'Ash Vessel II', artist: 'Freja Holm', year: 2022, medium: 'Stoneware with natural ash glaze', dims: [28, 46, 28], price: 5200, ship: [200, 640], style: 'vessel', palette: P.bronze, aspect: [2, 3], provenance: 'Exhibited at Collect, Saatchi Gallery, London, 2023.', description: 'A tall bottle form whose shoulders carry rivulets of natural ash glaze from a five-day firing.' },
    { g: gForm, cat: 'lighting', title: 'Halo Floor Lamp', artist: 'Sune Kjær', year: 2023, medium: 'Patinated brass, linen', dims: [45, 165, 45], price: 8900, ship: [320, 980], style: 'lamp', palette: P.gold, aspect: [9, 16], provenance: 'Studio Sune Kjær; production number on base.', description: 'A slender brass column crowned by a linen halo, designed to wash a wall in soft reflected light.' },
  ];

  const createdListings: (typeof listings.$inferSelect)[] = [];
  let seedN = 100;
  for (const [i, s] of seeds.entries()) {
    const [aw, ah] = s.aspect;
    const scale = 2400 / Math.max(aw, ah);
    const W = Math.round(aw * scale), H = Math.round(ah * scale);
    const l = db
      .insert(listings)
      .values({
        galleryId: s.g.id,
        categoryId: cat[s.cat],
        title: s.title,
        slug: `${s.title}-${s.artist}`.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        artist: s.artist,
        year: s.year,
        medium: s.medium,
        description: s.description,
        widthCm: s.dims[0],
        heightCm: s.dims[1],
        depthCm: s.dims[2] ?? null,
        priceCents: s.price * 100,
        shippingDomesticCents: s.ship[0] * 100,
        shippingInternationalCents: s.ship[1] * 100,
        originCountry: s.g.country,
        provenance: s.provenance,
        edition: s.edition ?? 'Unique work',
        featured: !!s.featured,
        views: 40 + ((i * 37) % 260),
        createdAt: new Date(Date.now() - (seeds.length - i) * 86400_000 * 3).toISOString(),
      })
      .returning()
      .get();
    // Primary view plus 1–2 alternate "detail" crops so the media gallery has depth.
    const shots = 1 + (i % 3);
    for (let k = 0; k < shots; k++) {
      const svg = artworkSvg(s.style, W, H, seedN++, s.palette);
      let img = await renderArtwork(svg);
      if (k > 0) img = sharp(await img.png().toBuffer()).extract({ left: Math.round(W * 0.15 * k), top: Math.round(H * 0.1 * k), width: Math.round(W * 0.6), height: Math.round(H * 0.6) });
      const stored = await storeImage(await img.jpeg({ quality: 92 }).toBuffer());
      db.insert(listingMedia).values({ ...stored, listingId: l.id, position: k }).run();
    }
    createdListings.push(l);
    log(`  rendered ${i + 1}/${seeds.length} works`);
  }

  // One listing filed under the pending suggested category, to demonstrate moderation.
  db.update(listings).set({ categoryId: suggested.id }).where(eq(listings.slug, 'ash-vessel-ii-freja-holm')).run();

  /* ---------- Orders across every escrow stage ---------- */

  const bySlug = (title: string) => createdListings.find((l) => l.title === title)!;
  const actor = (u: typeof buyer) => ({ id: u.id, email: u.email, name: u.name, role: u.role });
  const addr = (u: typeof buyer, country: string) => ({ fullName: u.name, line1: '1 Collector’s Row', city: country === 'US' ? 'New York' : 'Tokyo', postalCode: '10001', country });

  function order(b: typeof buyer, l: (typeof listings.$inferSelect), country: string, monthsAgo: number) {
    const domestic = country === l.originCountry;
    const ship = domestic ? l.shippingDomesticCents : l.shippingInternationalCents;
    const created = new Date(Date.now() - monthsAgo * 30 * 86400_000).toISOString();
    const o = db
      .insert(orders)
      .values({
        reference: `CS-DEMO-${l.id.toString().padStart(4, '0')}`,
        buyerId: b.id,
        listingId: l.id,
        galleryId: l.galleryId,
        priceCents: l.priceCents,
        shippingCents: ship,
        totalCents: l.priceCents + ship,
        commissionCents: Math.round(l.priceCents * config.commissionRate),
        shippingRegion: domestic ? 'domestic' : 'international',
        shippingAddress: addr(b, country),
        createdAt: created,
        updatedAt: created,
      })
      .returning()
      .get();
    db.update(listings).set({ status: 'reserved' }).where(eq(listings.id, l.id)).run();
    db.insert(orderEvents).values({ orderId: o.id, status: 'pending', note: 'Checkout started', actorId: b.id, createdAt: created }).run();
    return o;
  }

  // Released + reviewed (feeds vendor analytics and balance)
  const o1 = order(buyer, bySlug('Lignes d’Or'), 'US', 4);
  transitionOrder(actor(buyer), o1.id, 'pay');
  transitionOrder(actor(sLumiere), o1.id, 'dispatch', { carrier: 'DHL Express', trackingNumber: 'DHL1234567890' });
  transitionOrder(actor(buyer), o1.id, 'confirm_delivery');
  transitionOrder(actor(buyer), o1.id, 'release');
  db.insert(reviews).values({ orderId: o1.id, listingId: o1.listingId, galleryId: o1.galleryId, buyerId: buyer.id, rating: 5, body: 'Impeccably crated, with a handwritten note from the artist. The gold ink is even more alive in person.' }).run();

  const o2 = order(buyer2, bySlug('Column Study No. 9'), 'JP', 2);
  transitionOrder(actor(buyer2), o2.id, 'pay');
  transitionOrder(actor(sNoir), o2.id, 'dispatch', { carrier: 'FedEx International Priority', trackingNumber: 'FX99812234' });
  transitionOrder(actor(buyer2), o2.id, 'confirm_delivery');
  transitionOrder(actor(buyer2), o2.id, 'release');
  db.insert(reviews).values({ orderId: o2.id, listingId: o2.listingId, galleryId: o2.galleryId, buyerId: buyer2.id, rating: 5, body: 'Museum-quality print, archival packaging, flawless communication.' }).run();

  // In escrow (seller must dispatch)
  const o3 = order(buyer, bySlug('Ember Pendant'), 'US', 0);
  transitionOrder(actor(buyer), o3.id, 'pay');

  // Dispatched (buyer must confirm delivery)
  const o4 = order(buyer, bySlug('Étude pour un Silence'), 'US', 1);
  transitionOrder(actor(buyer), o4.id, 'pay');
  transitionOrder(actor(sLumiere), o4.id, 'dispatch', { carrier: 'UPS Worldwide', trackingNumber: '1Z999AA10123456784' });

  // Disputed (admin must resolve)
  const o5 = order(buyer2, bySlug('Tidal Trio'), 'JP', 1);
  transitionOrder(actor(buyer2), o5.id, 'pay');
  transitionOrder(actor(sForm), o5.id, 'dispatch', { carrier: 'DHL Express', trackingNumber: 'DHL5550001112' });
  transitionOrder(actor(buyer2), o5.id, 'confirm_delivery');
  transitionOrder(actor(buyer2), o5.id, 'dispute', { reason: 'One of the three vessels arrived with a hairline crack along the base. Photos attached to the courier claim.' });

  /* ---------- Payouts, Q&A ---------- */

  db.insert(payouts).values({ galleryId: gLumiere.id, amountCents: 300000, method: 'wire', destination: 'FR76 •••• 4421', status: 'paid', processedById: superadmin.id, processedAt: new Date().toISOString() }).run();
  db.insert(payouts).values({ galleryId: gNoir.id, amountCents: 250000, method: 'bank_transfer', destination: 'Chase •••• 9012', status: 'requested' }).run();

  const qa: [string, typeof buyer, string, string | null][] = [
    ['Threshold of Ember', buyer, 'Is the work varnished, and would the gallery arrange installation in London?', 'Yes — a removable Gamvar varnish was applied in 2024. We work with Momart for white-glove installation across the UK at cost.'],
    ['Vessel of Absence', buyer2, 'Can you share the foundry certificate before purchase?', 'Of course. A scan of the Polich Tallix certificate and the edition ledger is available on request; the original ships with the work.'],
    ['Hvile Lounge Chair', buyer, 'Is the leather available in a natural (unsmoked) tone?', null],
  ];
  for (const [title, u, body, answer] of qa) {
    db.insert(questions).values({ listingId: bySlug(title).id, askerId: u.id, body, answer, answeredAt: answer ? new Date().toISOString() : null }).run();
  }

  audit(null, 'system.seed', 'system', null, { listings: seeds.length });

  log(`
Seed complete.
  Categories: 5 root, 11 sub (+1 pending suggestion)
  Galleries:  3 approved, 1 pending
  Listings:   ${seeds.length}
  Orders:     5 (released ×2, in escrow, dispatched, disputed)

Demo accounts:
  Super-Admin  admin@curated-source.com          ${DEMO_PASSWORDS.admin}
  Sub-Admin    moderator@curated-source.com      ${DEMO_PASSWORDS.moderator}
  Seller       lumiere@curated-source.com        ${DEMO_PASSWORDS.seller}   (Atelier Lumière)
  Seller       noir@curated-source.com           ${DEMO_PASSWORDS.seller}   (Noir Gallery)
  Seller       formvoid@curated-source.com       ${DEMO_PASSWORDS.seller}   (Form & Void Studio)
  Seller       pending.seller@curated-source.com ${DEMO_PASSWORDS.seller}   (Maison Verre — pending approval)
  Buyer        buyer@curated-source.com          ${DEMO_PASSWORDS.buyer}
  Buyer        collector@curated-source.com      ${DEMO_PASSWORDS.buyer}
`);
}
