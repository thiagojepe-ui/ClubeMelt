import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Fixed brand for this project. The store name/logo are not configurable. */
export const BRAND_NAME = "MeltCookies";
export const BRAND_EMOJI = "🍪";
export const BRAND_COLOR = "#B5651D";

/**
 * Ensure the user always has exactly one MeltCookies business.
 * Creates it if missing and re-applies the fixed brand if it drifted.
 */
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      if (
        existing.name !== BRAND_NAME ||
        existing.logoEmoji !== BRAND_EMOJI ||
        existing.brandColor !== BRAND_COLOR
      ) {
        await ctx.db.patch(existing._id, {
          name: BRAND_NAME,
          logoEmoji: BRAND_EMOJI,
          brandColor: BRAND_COLOR,
        });
      }
      return existing._id;
    }

    return ctx.db.insert("businesses", {
      userId,
      name: BRAND_NAME,
      logoEmoji: BRAND_EMOJI,
      brandColor: BRAND_COLOR,
      createdAt: Date.now(),
    });
  },
});

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

    // 1) Business linked to the current Convex user
    const own = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (own) return own;

    // 2) Fallback: single-business app — return any business so the admin
    //    can always see the dashboard while syncUser re-links ownership.
    return await ctx.db.query("businesses").first();
  },
});

/** Public: returns the single business of the app (used by the /clube short link). */
export const getAnyPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("businesses").first();
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
