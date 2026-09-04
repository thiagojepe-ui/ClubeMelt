import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Find customer by phone within a specific business.
 * Used to detect if the customer already registered.
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
 * Register a new customer by phone. Returns the customer document.
 * If already registered, returns the existing document.
 */
export const register = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.phone.replace(/\D/g, "");

    // Check if already registered
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

    const totalRevealed = stamps.reduce((sum, s) => sum + s.count, 0);

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

/**
 * Reveal one stamp. Picks the next prize from the card's stampPrizes array.
 */
export const revealStamp = mutation({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) throw new Error("Cartão não encontrado");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Cliente não encontrado");
    if (customer.businessId !== card.businessId) {
      throw new Error("Cliente não pertence a este negócio");
    }

    // Count already revealed stamps
    const existingStamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", args.loyaltyCardId)
          .eq("customerId", args.customerId),
      )
      .collect();

    const totalRevealed = existingStamps.reduce((sum, s) => sum + s.count, 0);

    if (totalRevealed >= card.totalStamps) {
      throw new Error("Todos os carimbos já foram revelados");
    }

    // Pick prize for this position
    const position = totalRevealed;
    const prizes = card.stampPrizes ?? [];
    const prize =
      prizes.length > 0
        ? prizes[position % prizes.length]
        : { message: "Carimbo coletado!", isPrize: false };

    // Create stamp doc
    await ctx.db.insert("stamps", {
      customerId: args.customerId,
      loyaltyCardId: args.loyaltyCardId,
      businessId: card.businessId,
      count: 1,
      createdAt: Date.now(),
    });

    return {
      position,
      prize,
      totalRevealed: totalRevealed + 1,
      totalStamps: card.totalStamps,
      completed: totalRevealed + 1 >= card.totalStamps,
      rewardDescription: card.rewardDescription,
    };
  },
});
