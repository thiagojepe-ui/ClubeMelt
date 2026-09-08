import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Admin: List all prize redemptions for a business.
 * Optional status filter.
 */
export const list = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("delivered")),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    let q = ctx.db
      .query("prizeRedemptions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    if (args.status) {
      q = ctx.db
        .query("prizeRedemptions")
        .withIndex("by_business_status", (q) =>
          q.eq("businessId", args.businessId).eq("status", args.status!),
        );
    }

    return q.order("desc").collect();
  },
});

/**
 * Admin: Update the status of a prize redemption.
 */
export const updateStatus = mutation({
  args: {
    redemptionId: v.id("prizeRedemptions"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const redemption = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");

    const business = await ctx.db.get(redemption.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    const patch: Record<string, any> = {
      status: args.status,
    };
    if (args.note !== undefined) patch.note = args.note;
    if (args.status === "sent") patch.sentAt = now;
    if (args.status === "delivered") patch.deliveredAt = now;

    await ctx.db.patch(args.redemptionId, patch);
  },
});

/**
 * Internal: Register a prize redemption when a cycle is completed.
 * Called from revealNext mutations.
 */
export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    customerId: v.id("customers"),
    loyaltyCardId: v.id("loyaltyCards"),
    rewardDescription: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    cycleNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("prizeRedemptions", {
      businessId: args.businessId,
      customerId: args.customerId,
      loyaltyCardId: args.loyaltyCardId,
      rewardDescription: args.rewardDescription,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      cycleNumber: args.cycleNumber,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/**
 * Admin: Get summary counts for a business.
 */
export const counts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const all = await ctx.db
      .query("prizeRedemptions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return {
      total: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      sent: all.filter((r) => r.status === "sent").length,
      delivered: all.filter((r) => r.status === "delivered").length,
    };
  },
});
