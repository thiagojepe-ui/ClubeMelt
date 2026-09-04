import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get public business info (no auth required).
 */
export const getBusinessPublic = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) return null;
    return {
      _id: business._id,
      name: business.name,
      brandColor: business.brandColor,
      logoEmoji: business.logoEmoji,
    };
  },
});

/**
 * Find customer by phone within a specific business.
 */
export const findByPhone = query({
  args: {
    businessId: v.id("businesses"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.phone.replace(/\D/g, "");
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_business_phone", (q) =>
        q.eq("businessId", args.businessId).eq("phone", normalized),
      )
      .first();
    return customer ?? null;
  },
});

/**
 * Register a new customer by phone (owner action).
 */
export const register = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.phone.replace(/\D/g, "");

    const existing = await ctx.db
      .query("customers")
      .withIndex("by_business_phone", (q) =>
        q.eq("businessId", args.businessId).eq("phone", normalized),
      )
      .first();
    if (existing) return existing;

    const id = await ctx.db.insert("customers", {
      businessId: args.businessId,
      name: args.name,
      phone: normalized,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

/**
 * Client self-registration: creates or finds a customer by phone for a business.
 * Returns the customer record.
 */
export const registerSelf = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.phone.replace(/\D/g, "");

    // Check if customer already exists
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_business_phone", (q) =>
        q.eq("businessId", args.businessId).eq("phone", normalized),
      )
      .first();

    if (existing) {
      // Update name if different
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return existing;
    }

    const id = await ctx.db.insert("customers", {
      businessId: args.businessId,
      name: args.name,
      phone: normalized,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

/**
 * Look up a stamp by its unique token (legacy single-link).
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const stamp = await ctx.db
      .query("stamps")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!stamp) return null;

    const card = await ctx.db.get(stamp.loyaltyCardId);
    const business = card ? await ctx.db.get(card.businessId) : null;
    const customer = await ctx.db.get(stamp.customerId);

    return {
      stamp,
      card,
      business,
      customer,
      isRevealed: stamp.revealed ?? false,
    };
  },
});

/**
 * Reveal a stamp by token. Single-use.
 */
export const revealByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const stamp = await ctx.db
      .query("stamps")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!stamp) throw new Error("Link inválido ou expirado");

    if (stamp.revealed) {
      throw new Error("Este carimbo já foi coletado");
    }

    const card = await ctx.db.get(stamp.loyaltyCardId);
    if (!card) throw new Error("Cartão não encontrado");

    const existingStamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", stamp.loyaltyCardId)
          .eq("customerId", stamp.customerId),
      )
      .collect();

    const alreadyRevealed = existingStamps.filter(
      (s) => s.revealed && s._id !== stamp._id,
    ).length;

    const position = alreadyRevealed;
    const prizes = card.stampPrizes ?? [];
    const prize =
      prizes.length > 0
        ? prizes[position % prizes.length]
        : { message: "Carimbo coletado!", isPrize: false };

    await ctx.db.patch(stamp._id, {
      revealed: true,
      revealedAt: Date.now(),
    });

    const totalRevealed = alreadyRevealed + 1;

    return {
      position,
      prize,
      totalRevealed,
      totalStamps: card.totalStamps,
      completed: totalRevealed >= card.totalStamps,
      rewardDescription: card.rewardDescription,
      customerName: (await ctx.db.get(stamp.customerId))?.name,
    };
  },
});

/**
 * Look up a batch by its batch token.
 * Returns all stamps in the batch, card info, business, and customer.
 */
export const getByBatchToken = query({
  args: { batchToken: v.string() },
  handler: async (ctx, args) => {
    // Find all stamps with this batchToken
    const allStamps = await ctx.db.query("stamps").collect();
    const batchStamps = allStamps.filter(
      (s) => s.batchToken === args.batchToken,
    );

    if (batchStamps.length === 0) return null;

    const firstStamp = batchStamps[0];
    const card = await ctx.db.get(firstStamp.loyaltyCardId);
    const business = card ? await ctx.db.get(card.businessId) : null;
    const customer = await ctx.db.get(firstStamp.customerId);

    // Count revealed vs pending in this batch
    const revealedCount = batchStamps.filter((s) => s.revealed).length;
    const pendingCount = batchStamps.filter((s) => !s.revealed).length;

    // Also count total revealed across all stamps for this customer+card
    const allCustomerStamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", firstStamp.loyaltyCardId)
          .eq("customerId", firstStamp.customerId),
      )
      .collect();

    const totalRevealed = allCustomerStamps.filter((s) => s.revealed).length;

    return {
      batchToken: args.batchToken,
      batchTotal: batchStamps.length,
      batchRevealed: revealedCount,
      batchPending: pendingCount,
      totalRevealed,
      totalStamps: card?.totalStamps ?? 0,
      completed: totalRevealed >= (card?.totalStamps ?? 0),
      card,
      business,
      customer,
    };
  },
});

/**
 * Reveal the next unrevealed stamp in a batch. Single-use per page load.
 * The client clicks once per visit; page reloads to reveal next.
 */
export const revealNextByBatchToken = mutation({
  args: { batchToken: v.string() },
  handler: async (ctx, args) => {
    // Find all stamps with this batchToken
    const allStamps = await ctx.db.query("stamps").collect();
    const batchStamps = allStamps
      .filter((s) => s.batchToken === args.batchToken)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (batchStamps.length === 0) {
      throw new Error("Link inválido ou expirado");
    }

    // Find the first unrevealed stamp
    const nextStamp = batchStamps.find((s) => !s.revealed);
    if (!nextStamp) {
      throw new Error("Todos os carimbos deste lote já foram coletados");
    }

    const card = await ctx.db.get(nextStamp.loyaltyCardId);
    if (!card) throw new Error("Cartão não encontrado");

    // Count how many in this batch are already revealed
    const batchRevealed = batchStamps.filter((s) => s.revealed).length;
    const position = batchRevealed; // 0-indexed position of this stamp

    // Get prizes
    const prizes = card.stampPrizes ?? [];
    const prize =
      prizes.length > 0
        ? prizes[position % prizes.length]
        : { message: "Carimbo coletado!", isPrize: false };

    // Reveal the stamp
    await ctx.db.patch(nextStamp._id, {
      revealed: true,
      revealedAt: Date.now(),
    });

    // Count total revealed for customer+card
    const allCustomerStamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", nextStamp.loyaltyCardId)
          .eq("customerId", nextStamp.customerId),
      )
      .collect();

    const totalRevealed = allCustomerStamps.filter((s) => s.revealed).length;
    const batchPending = batchStamps.filter(
      (s) => !s.revealed && s._id !== nextStamp._id,
    ).length;

    return {
      position,
      prize,
      totalRevealed,
      totalStamps: card.totalStamps,
      batchPending,
      completed: totalRevealed >= card.totalStamps,
      rewardDescription: card.rewardDescription,
      customerName: (await ctx.db.get(nextStamp.customerId))?.name,
    };
  },
});

/**
 * Get all pending batches for a customer across all their cards.
 * Used by the client dashboard.
 */
export const getMyBatches = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const allStamps = await ctx.db
      .query("stamps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    // Group by batchToken
    const batchMap = new Map<
      string,
      {
        batchToken: string;
        loyaltyCardId: string;
        cardName: string;
        totalStamps: number;
        batchTotal: number;
        batchRevealed: number;
        batchPending: number;
        totalRevealed: number;
        completed: boolean;
        rewardDescription: string;
        businessName: string;
        brandColor: string;
        logoEmoji: string;
      }
    >();

    for (const stamp of allStamps) {
      const bt = stamp.batchToken || stamp.token || "solo";
      if (!batchMap.has(bt)) {
        const card = await ctx.db.get(stamp.loyaltyCardId);
        const business = card
          ? await ctx.db.get(card.businessId)
          : null;
        batchMap.set(bt, {
          batchToken: bt,
          loyaltyCardId: stamp.loyaltyCardId,
          cardName: card?.cardName ?? "",
          totalStamps: card?.totalStamps ?? 0,
          batchTotal: 0,
          batchRevealed: 0,
          batchPending: 0,
          totalRevealed: 0,
          completed: false,
          rewardDescription: card?.rewardDescription ?? "",
          businessName: business?.name ?? "",
          brandColor: business?.brandColor ?? "",
          logoEmoji: business?.logoEmoji ?? "🏪",
        });
      }
      const b = batchMap.get(bt)!;
      b.batchTotal++;
      if (stamp.revealed) {
        b.batchRevealed++;
      } else {
        b.batchPending++;
      }
    }

    // Calculate totalRevealed and completed per loyaltyCard
    const cardRevealedMap = new Map<string, number>();
    for (const stamp of allStamps) {
      if (stamp.revealed) {
        const cur = cardRevealedMap.get(stamp.loyaltyCardId) || 0;
        cardRevealedMap.set(stamp.loyaltyCardId, cur + 1);
      }
    }

    for (const b of batchMap.values()) {
      b.totalRevealed = cardRevealedMap.get(b.loyaltyCardId) || 0;
      b.completed = b.totalRevealed >= b.totalStamps;
    }

    return Array.from(batchMap.values()).sort(
      (a, b) => b.batchRevealed - a.batchRevealed, // show completed last
    );
  },
});

/**
 * @deprecated Old stamp-by-count API, kept for dashboard backward compat.
 */
export const revealStamp = mutation({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async () => {
    throw new Error("Este método foi descontinuado. Use links de token.");
  },
});

/**
 * Get a customer's stamp progress for a specific loyalty card.
 */
export const getMyStamps = query({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) return null;

    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", args.loyaltyCardId)
          .eq("customerId", args.customerId),
      )
      .collect();

    const totalRevealed = stamps.reduce(
      (sum, s) => (s.revealed ? sum + s.count : sum),
      0,
    );

    return {
      totalStamps: card.totalStamps,
      totalRevealed,
      remaining: Math.max(0, card.totalStamps - totalRevealed),
      completed: totalRevealed >= card.totalStamps,
      rewardDescription: card.rewardDescription,
      stampPrizes: card.stampPrizes,
    };
  },
});
