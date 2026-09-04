import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create N stamps with unique tokens for a specific customer and card.
 * Returns the created stamps with their tokens and shareable links.
 */
export const createStamps = mutation({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) throw new Error("Cartão não encontrado");

    const business = await ctx.db.get(card.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Não autorizado");
    }

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.businessId !== card.businessId) {
      throw new Error("Cliente não pertence a este negócio");
    }

    if (args.count < 1 || args.count > 30) {
      throw new Error("Quantidade deve ser entre 1 e 30");
    }

    const createdStamps = [];
    for (let i = 0; i < args.count; i++) {
      const token = generateToken();
      const id = await ctx.db.insert("stamps", {
        customerId: args.customerId,
        loyaltyCardId: args.loyaltyCardId,
        businessId: card.businessId,
        count: 1,
        token,
        revealed: false,
        createdAt: Date.now(),
      });
      createdStamps.push({ id, token });
    }

    return createdStamps;
  },
});

/**
 * Get all stamps for a business, grouped by customer.
 * Returns customer info + their stamps (revealed + unrevealed).
 */
export const getStampsByCustomer = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Não autorizado");
    }

    // Get all customers for this business
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Get all stamps for this business
    const allStamps = await ctx.db
      .query("stamps")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Get all loyalty cards for this business
    const cards = await ctx.db
      .query("loyaltyCards")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const cardMap = new Map(cards.map((c) => [c._id, c]));

    // Group stamps by customer
    const customerMap = new Map<string, {
      customer: typeof customers[0];
      stamps: typeof allStamps;
      revealedCount: number;
      unrevealedCount: number;
      cardName: string;
      totalStamps: number;
    }>();

    for (const customer of customers) {
      customerMap.set(customer._id, {
        customer,
        stamps: [],
        revealedCount: 0,
        unrevealedCount: 0,
        cardName: "",
        totalStamps: 0,
      });
    }

    for (const stamp of allStamps) {
      const entry = customerMap.get(stamp.customerId);
      if (!entry) continue;

      entry.stamps.push(stamp);
      if (stamp.revealed) {
        entry.revealedCount += stamp.count;
      } else {
        entry.unrevealedCount += stamp.count;
      }

      const card = cardMap.get(stamp.loyaltyCardId);
      if (card) {
        entry.cardName = card.cardName;
        entry.totalStamps = card.totalStamps;
      }
    }

    // Only include customers that have stamps
    return Array.from(customerMap.values()).filter(
      (e) => e.stamps.length > 0,
    );
  },
});

/**
 * Get all unrevealed stamps (links) for a specific customer + card.
 */
export const getUnrevealedStamps = query({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", args.loyaltyCardId)
          .eq("customerId", args.customerId),
      )
      .collect();

    return stamps
      .filter((s) => !s.revealed && s.token)
      .map((s) => ({ id: s._id, token: s.token!, createdAt: s.createdAt }));
  },
});
