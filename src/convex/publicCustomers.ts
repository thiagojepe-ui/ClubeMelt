import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
 * Register a new customer by phone.
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
 * Look up a stamp by its unique token.
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
