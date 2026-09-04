import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Register a new admin with username + password.
 * Creates only the admin record (userId is set during finalization).
 */
export const register = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim();

    // Check if username already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (existing) {
      throw new Error("Este nome de usuário já está em uso");
    }

    // Create admin record (userId will be set during finalization)
    const adminId = await ctx.db.insert("admins", {
      username,
      password: args.password,
      name: args.name || args.username,
      userId: "pending" as any,
      createdAt: Date.now(),
    });

    return { adminId, username };
  },
});

/**
 * Finalize admin registration: link admin to the current Convex Auth user
 * and create the business record.
 * Called after anonymous sign-in.
 */
export const finalizeRegistration = mutation({
  args: { adminId: v.id("admins") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const admin = await ctx.db.get(args.adminId);
    if (!admin) throw new Error("Admin not found");

    // Update admin with the real Convex Auth userId
    await ctx.db.patch(args.adminId, { userId });

    // Create business linked to this user if it doesn't exist
    const existingBusiness = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingBusiness) {
      await ctx.db.insert("businesses", {
        userId,
        name: "MeltCookies",
        brandColor: "#B5651D",
        logoEmoji: "🍪",
        createdAt: Date.now(),
      });
    }

    return { userId };
  },
});

/**
 * Login with username + password.
 * Returns admin info if credentials match.
 */
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!admin) {
      throw new Error("Usuário ou senha incorretos");
    }

    if (admin.password !== args.password) {
      throw new Error("Usuário ou senha incorretos");
    }

    return {
      adminId: admin._id,
      userId: admin.userId,
      name: admin.name,
      username: admin.username,
    };
  },
});

/**
 * Check if any admin exists in the system.
 * Used to determine if registration should be available.
 */
export const hasAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db.query("admins").first();
    return admin !== null;
  },
});

/**
 * Get admin info by admin ID (for session verification).
 */
export const getAdmin = query({
  args: { adminId: v.id("admins") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin) return null;
    return {
      adminId: admin._id,
      userId: admin.userId,
      name: admin.name,
      username: admin.username,
    };
  },
});
