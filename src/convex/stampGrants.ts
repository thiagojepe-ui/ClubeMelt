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
 * Create N stamps with a shared batch token for a specific customer and card.
 * Returns the batch token and created stamps.
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

    const batchToken = generateToken();
    const now = Date.now();
    const createdStamps = [];

    for (let i = 0; i < args.count; i++) {
      const id = await ctx.db.insert("stamps", {
        customerId: args.customerId,
        loyaltyCardId: args.loyaltyCardId,
        businessId: card.businessId,
        count: 1,
        batchToken,
        revealed: false,
        createdAt: now,
      });
      createdStamps.push(id);
    }

    return { batchToken, stampCount: args.count };
  },
});

/**
 * Get all stamps for a business, grouped by customer.
 * Cycle-aware: shows cyclesCompleted, currentProgress, justCompleted, rewardDescription.
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

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const allStamps = await ctx.db
      .query("stamps")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const cards = await ctx.db
      .query("loyaltyCards")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const cardMap = new Map(cards.map((c) => [c._id, c]));

    // Group stamps by customer
    const customerMap = new Map<
      string,
      {
        customer: (typeof customers)[0];
        stamps: typeof allStamps;
        revealedCount: number;
        unrevealedCount: number;
        cardName: string;
        totalStamps: number;
        cyclesCompleted: number;
        currentProgress: number;
        justCompleted: boolean;
        rewardDescription: string;
      }
    >();

    for (const customer of customers) {
      customerMap.set(customer._id, {
        customer,
        stamps: [],
        revealedCount: 0,
        unrevealedCount: 0,
        cardName: "",
        totalStamps: 0,
        cyclesCompleted: 0,
        currentProgress: 0,
        justCompleted: false,
        rewardDescription: "",
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
        entry.rewardDescription = card.rewardDescription;
      }
    }

    // Calculate cycle info for each customer
    for (const entry of customerMap.values()) {
      if (entry.totalStamps > 0) {
        entry.currentProgress = entry.revealedCount % entry.totalStamps;
        entry.cyclesCompleted = Math.floor(entry.revealedCount / entry.totalStamps);
        entry.justCompleted = entry.currentProgress === 0 && entry.revealedCount > 0;
      }
    }

    return Array.from(customerMap.values()).filter(
      (e) => e.stamps.length > 0,
    );
  },
});

/**
 * Get all batch links for a customer on a card.
 */
export const getBatchesByCustomer = query({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_customer", (q) =>
        q
          .eq("loyaltyCardId", args.loyaltyCardId)
          .eq("customerId", args.customerId),
      )
      .collect();

    // Group by batchToken
    const batchMap = new Map<
      string,
      {
        batchToken: string;
        total: number;
        revealed: number;
        pending: number;
        createdAt: number;
      }
    >();

    for (const stamp of stamps) {
      const bt = stamp.batchToken || stamp.token || "solo";
      if (!batchMap.has(bt)) {
        batchMap.set(bt, {
          batchToken: bt,
          total: 0,
          revealed: 0,
          pending: 0,
          createdAt: stamp.createdAt,
        });
      }
      const b = batchMap.get(bt)!;
      b.total++;
      if (stamp.revealed) {
        b.revealed++;
      } else {
        b.pending++;
      }
    }

    return Array.from(batchMap.values());
  },
});
