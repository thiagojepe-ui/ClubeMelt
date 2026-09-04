import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get public customer info (no auth required) for their access area.
 */
export const getCustomerPublic = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;
    const business = await ctx.db.get(customer.businessId);
    return {
      name: customer.name,
      phone: customer.phone,
      businessName: business?.name ?? "",
      brandColor: business?.brandColor ?? undefined,
      logoEmoji: business?.logoEmoji ?? undefined,
    };
  },
});

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
      throw new Error("Este selo já foi coletado");
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

    // Cycle-aware position: position within current cycle
    const position = alreadyRevealed % card.totalStamps;
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
    const currentProgress = totalRevealed % card.totalStamps;
    const cyclesCompleted = Math.floor(totalRevealed / card.totalStamps);

    return {
      position,
      prize,
      totalRevealed,
      totalStamps: card.totalStamps,
      currentProgress,
      cyclesCompleted,
      completed: currentProgress === 0, // just completed a cycle
      justCompleted: currentProgress === 0,
      rewardDescription: card.rewardDescription,
      customerName: (await ctx.db.get(stamp.customerId))?.name,
    };
  },
});

/**
 * Look up a batch by its batch token.
 * Returns all stamps in the batch, card info, business, and customer.
 * Cycle-aware: tracks currentProgress and cyclesCompleted.
 */
export const getByBatchToken = query({
  args: { batchToken: v.string() },
  handler: async (ctx, args) => {
    // Use the index for efficient lookup
    const batchStamps = await ctx.db
      .query("stamps")
      .withIndex("by_batch_token", (q) =>
        q.eq("batchToken", args.batchToken),
      )
      .collect();

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
    const totalStamps = card?.totalStamps ?? 1;
    const currentProgress = totalRevealed % totalStamps;
    const cyclesCompleted = Math.floor(totalRevealed / totalStamps);

    return {
      batchToken: args.batchToken,
      batchTotal: batchStamps.length,
      batchRevealed: revealedCount,
      batchPending: pendingCount,
      totalRevealed,
      totalStamps,
      currentProgress,
      cyclesCompleted,
      completed: currentProgress === 0 && totalRevealed > 0,
      card,
      business,
      customer,
    };
  },
});

/**
 * Reveal the next unrevealed stamp in a batch. Single-use per click.
 * Cycle-aware: position uses modular arithmetic so prizes repeat each cycle.
 * The client clicks once per stamp; stays on same page.
 */
export const revealNextByBatchToken = mutation({
  args: { batchToken: v.string() },
  handler: async (ctx, args) => {
    // Use the index for efficient lookup
    const batchStamps = await ctx.db
      .query("stamps")
      .withIndex("by_batch_token", (q) =>
        q.eq("batchToken", args.batchToken),
      )
      .collect();

    if (batchStamps.length === 0) {
      throw new Error("Link inválido ou expirado");
    }

    // Sort by createdAt to reveal in order
    const sorted = batchStamps.sort((a, b) => a.createdAt - b.createdAt);

    // Find the first unrevealed stamp
    const nextStamp = sorted.find((s) => !s.revealed);
    if (!nextStamp) {
      throw new Error("Todos os selos deste lote já foram coletados");
    }

    const card = await ctx.db.get(nextStamp.loyaltyCardId);
    if (!card) throw new Error("Cartão não encontrado");

    // Count total revealed for customer+card (across all batches)
    const allCustomerStamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", nextStamp.loyaltyCardId)
          .eq("customerId", nextStamp.customerId),
      )
      .collect();

    const revealedBefore = allCustomerStamps.filter(
      (s) => s.revealed && s._id !== nextStamp._id,
    ).length;

    // Cycle-aware position: use modular arithmetic so prizes repeat each cycle
    const position = revealedBefore % card.totalStamps;

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

    const totalRevealed = revealedBefore + 1;
    const currentProgress = totalRevealed % card.totalStamps;
    const cyclesCompleted = Math.floor(totalRevealed / card.totalStamps);
    const justCompleted = currentProgress === 0;

    const batchPending = batchStamps.filter(
      (s) => !s.revealed && s._id !== nextStamp._id,
    ).length;

    return {
      position,
      prize,
      totalRevealed,
      totalStamps: card.totalStamps,
      currentProgress,
      cyclesCompleted,
      batchPending,
      justCompleted,
      rewardDescription: card.rewardDescription,
      customerName: (await ctx.db.get(nextStamp.customerId))?.name,
    };
  },
});

/**
 * Get all pending batches for a customer across all their cards.
 * Used by the client dashboard. Cycle-aware.
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
        currentProgress: number;
        cyclesCompleted: number;
        completed: boolean;
        rewardDescription: string;
        businessName: string;
        brandColor: string;
        logoEmoji: string;
      }
    >();

    // Cache card and business lookups to avoid repeated DB reads
    const cardCache = new Map<string, any>();
    const businessCache = new Map<string, any>();

    for (const stamp of allStamps) {
      const bt = stamp.batchToken || stamp.token || "solo";
      if (!batchMap.has(bt)) {
        let card = cardCache.get(stamp.loyaltyCardId);
        if (card === undefined) {
          card = await ctx.db.get(stamp.loyaltyCardId);
          cardCache.set(stamp.loyaltyCardId, card);
        }
        let business = card ? businessCache.get(card.businessId) : null;
        if (business === undefined && card) {
          business = await ctx.db.get(card.businessId);
          businessCache.set(card.businessId, business);
        }
        batchMap.set(bt, {
          batchToken: bt,
          loyaltyCardId: stamp.loyaltyCardId,
          cardName: card?.cardName ?? "",
          totalStamps: card?.totalStamps ?? 0,
          batchTotal: 0,
          batchRevealed: 0,
          batchPending: 0,
          totalRevealed: 0,
          currentProgress: 0,
          cyclesCompleted: 0,
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

    // Calculate totalRevealed and cycle info per loyaltyCard
    const cardRevealedMap = new Map<string, number>();
    for (const stamp of allStamps) {
      if (stamp.revealed) {
        const cur = cardRevealedMap.get(stamp.loyaltyCardId) || 0;
        cardRevealedMap.set(stamp.loyaltyCardId, cur + 1);
      }
    }

    for (const b of batchMap.values()) {
      b.totalRevealed = cardRevealedMap.get(b.loyaltyCardId) || 0;
      const totalStamps = b.totalStamps || 1;
      b.currentProgress = b.totalRevealed % totalStamps;
      b.cyclesCompleted = Math.floor(b.totalRevealed / totalStamps);
      b.completed = b.currentProgress === 0 && b.totalRevealed > 0;
    }

    return Array.from(batchMap.values()).sort(
      (a, b) => b.batchRevealed - a.batchRevealed, // show batches with more reveals first
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
 * Cycle-aware: shows progress within current cycle.
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

    const totalStamps = card.totalStamps;
    const currentProgress = totalRevealed % totalStamps;
    const cyclesCompleted = Math.floor(totalRevealed / totalStamps);
    const justCompleted = currentProgress === 0 && totalRevealed > 0;
    const remaining = totalStamps - currentProgress;

    return {
      totalStamps,
      totalRevealed,
      currentProgress,
      cyclesCompleted,
      justCompleted,
      remaining: justCompleted ? 0 : remaining,
      completed: justCompleted,
      rewardDescription: card.rewardDescription,
      stampPrizes: card.stampPrizes,
    };
  },
});
