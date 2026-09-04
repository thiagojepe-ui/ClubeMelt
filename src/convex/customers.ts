import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Try to find existing customer by phone within this business
    if (args.phone) {
      const normalized = args.phone.replace(/\D/g, "");
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_business_phone", (q) =>
          q.eq("businessId", args.businessId).eq("phone", normalized),
        )
        .first();
      if (existing) return existing._id;
    }

    return ctx.db.insert("customers", {
      businessId: args.businessId,
      name: args.name,
      phone: args.phone ? args.phone.replace(/\D/g, "") : undefined,
      createdAt: Date.now(),
    });
  },
});

export const search = query({
  args: {
    businessId: v.id("businesses"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const term = args.searchTerm.toLowerCase().trim();
    if (!term) return [];

    const allCustomers = await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term.replace(/\D/g, ""))),
    );
  },
});

export const getAll = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    return ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();
  },
});
