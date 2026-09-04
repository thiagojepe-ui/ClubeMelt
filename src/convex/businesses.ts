import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    brandColor: v.optional(v.string()),
    logoEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    return ctx.db.insert("businesses", {
      userId,
      name: args.name,
      brandColor: args.brandColor,
      logoEmoji: args.logoEmoji,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const update = mutation({
  args: {
    name: v.string(),
    brandColor: v.optional(v.string()),
    logoEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!business) throw new Error("Business not found");

    await ctx.db.patch(business._id, {
      name: args.name,
      brandColor: args.brandColor,
      logoEmoji: args.logoEmoji,
    });
    return business._id;
  },
});
