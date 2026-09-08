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

    // Prevent duplicate phone registrations within the same business
    if (args.phone) {
      const normalized = args.phone.replace(/\D/g, "");
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_business_phone", (q) =>
          q.eq("businessId", args.businessId).eq("phone", normalized),
        )
        .first();
      if (existing) {
        throw new Error(
          "Já existe um cliente com este telefone. Edite o cadastro existente ou use outro número.",
        );
      }
    }

    return ctx.db.insert("customers", {
      businessId: args.businessId,
      name: args.name,
      phone: args.phone ? args.phone.replace(/\D/g, "") : undefined,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    const business = await ctx.db.get(customer.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    const normalized = args.phone ? args.phone.replace(/\D/g, "") : undefined;

    // Prevent duplicate phones within the same business
    if (normalized) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_business_phone", (q) =>
          q.eq("businessId", customer.businessId).eq("phone", normalized),
        )
        .first();
      if (existing && existing._id !== customer._id) {
        throw new Error("Já existe um cliente com este telefone");
      }
    }

    await ctx.db.patch(args.customerId, {
      name: args.name,
      phone: normalized,
    });
  },
});

export const remove = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    const business = await ctx.db.get(customer.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Remove the customer's stamps to keep progress data consistent
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    for (const stamp of stamps) {
      await ctx.db.delete(stamp._id);
    }

    // Remove orphaned prize redemptions for this customer
    const redemptions = await ctx.db
      .query("prizeRedemptions")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    for (const r of redemptions) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(args.customerId);
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
