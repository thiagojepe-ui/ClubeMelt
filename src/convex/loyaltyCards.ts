import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    totalStamps: v.number(),
    rewardDescription: v.string(),
    cardName: v.string(),
    stampPrizes: v.optional(
      v.array(
        v.object({
          message: v.string(),
          isPrize: v.boolean(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    return ctx.db.insert("loyaltyCards", {
      businessId: args.businessId,
      totalStamps: args.totalStamps,
      rewardDescription: args.rewardDescription,
      cardName: args.cardName,
      isActive: true,
      stampPrizes: args.stampPrizes,
      createdAt: Date.now(),
    });
  },
});

export const getByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    return ctx.db
      .query("loyaltyCards")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();
  },
});

export const getActiveByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("loyaltyCards")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();
  },
});

export const getPublic = query({
  args: { loyaltyCardId: v.id("loyaltyCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) return null;

    const business = await ctx.db.get(card.businessId);
    return { card, business };
  },
});

export const update = mutation({
  args: {
    loyaltyCardId: v.id("loyaltyCards"),
    totalStamps: v.number(),
    rewardDescription: v.string(),
    cardName: v.string(),
    isActive: v.boolean(),
    stampPrizes: v.optional(
      v.array(
        v.object({
          message: v.string(),
          isPrize: v.boolean(),
        }),
      ),
    ),
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

    await ctx.db.patch(args.loyaltyCardId, {
      totalStamps: args.totalStamps,
      rewardDescription: args.rewardDescription,
      cardName: args.cardName,
      isActive: args.isActive,
      stampPrizes: args.stampPrizes,
    });
  },
});

export const remove = mutation({
  args: { loyaltyCardId: v.id("loyaltyCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.loyaltyCardId);
    if (!card) throw new Error("Card not found");

    const business = await ctx.db.get(card.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Clean up stamps associated with this card to prevent orphaned data
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_loyalty_card", (q) =>
        q.eq("loyaltyCardId", args.loyaltyCardId),
      )
      .collect();
    for (const stamp of stamps) {
      await ctx.db.delete(stamp._id);
    }

    await ctx.db.delete(args.loyaltyCardId);
  },
});
