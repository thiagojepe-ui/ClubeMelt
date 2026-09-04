import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) throw new Error("Card not found");

    const business = await ctx.db.get(card.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.businessId !== card.businessId) {
      throw new Error("Customer not in this business");
    }

    if (args.count < 1) throw new Error("Count must be at least 1");

    return ctx.db.insert("stamps", {
      customerId: args.customerId,
      loyaltyCardId: args.loyaltyCardId,
      businessId: card.businessId,
      count: args.count,
      createdAt: Date.now(),
    });
  },
});

export const getCustomerStamps = query({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    const relevant = stamps.filter((s) => s.loyaltyCardId === args.loyaltyCardId);
    const totalCount = relevant.reduce((sum, s) => sum + s.count, 0);

    return { totalCount, stamps: relevant };
  },
});

export const getCustomerProgress = query({
  args: {
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) return null;

    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    const relevant = stamps.filter((s) => s.loyaltyCardId === args.loyaltyCardId);
    const totalCount = relevant.reduce((sum, s) => sum + s.count, 0);

    const totalStamps = card.totalStamps;
    const currentProgress = totalCount % totalStamps;
    const cyclesCompleted = Math.floor(totalCount / totalStamps);

    return {
      totalStamps,
      earnedStamps: totalCount,
      currentProgress,
      cyclesCompleted,
      remaining: currentProgress === 0 && totalCount > 0 ? 0 : totalStamps - currentProgress,
      completed: currentProgress === 0 && totalCount > 0,
    };
  },
});

export const getAllForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    return stamps;
  },
});
