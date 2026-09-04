import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    admins: defineTable({
      username: v.string(),
      password: v.string(),
      name: v.string(),
      userId: v.id("users"),
      createdAt: v.number(),
    }).index("by_username", ["username"]),

    businesses: defineTable({
      userId: v.id("users"),
      name: v.string(),
      brandColor: v.optional(v.string()),
      logoEmoji: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    loyaltyCards: defineTable({
      businessId: v.id("businesses"),
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
      createdAt: v.number(),
    }).index("by_business", ["businessId"]),

    customers: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      phone: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_business", ["businessId"])
      .index("by_business_phone", ["businessId", "phone"])
      .index("by_business_name", ["businessId", "name"]),

    stamps: defineTable({
      customerId: v.id("customers"),
      loyaltyCardId: v.id("loyaltyCards"),
      businessId: v.id("businesses"),
      count: v.number(),
      token: v.optional(v.string()),
      batchToken: v.optional(v.string()),
      revealed: v.optional(v.boolean()),
      revealedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_customer", ["customerId"])
      .index("by_loyalty_card", ["loyaltyCardId"])
      .index("by_business", ["businessId"])
      .index("by_loyalty_customer", ["loyaltyCardId", "customerId"])
      .index("by_token", ["token"])
      .index("by_batch_token", ["batchToken"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
