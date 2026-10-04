import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Espelha um cadastro vindo do sistema de Delivery (chamado por http.ts
 * em POST /api/customers/import).
 *
 * Upsert por [businessId, phone]:
 * - telefone normalizado só com dígitos (mesma convenção do restante do Clube);
 * - cliente novo é inserido; existente é atualizado apenas nos campos enviados
 *   (campos ausentes na payload nunca apagam dados já gravados aqui).
 */
export const importCustomer = internalMutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    name: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    addressNumber: v.optional(v.string()),
    complement: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Nome é obrigatório");

    const phone = args.phone.replace(/\D/g, "");
    if (phone.length < 8) throw new Error("Telefone inválido");

    const businessId =
      args.businessId ?? (await ctx.db.query("businesses").first())?._id;
    if (!businessId) {
      throw new Error("Nenhum business cadastrado no ClubeMelt");
    }

    const existing = await ctx.db
      .query("customers")
      .withIndex("by_business_phone", (q) =>
        q.eq("businessId", businessId).eq("phone", phone),
      )
      .first();

    // Só grava os campos presentes na payload (espelho não destrutivo)
    const fields: {
      name: string;
      phone: string;
      address?: string;
      addressNumber?: string;
      complement?: string;
      neighborhood?: string;
      zipCode?: string;
      notes?: string;
    } = { name, phone };
    if (args.address !== undefined) fields.address = args.address;
    if (args.addressNumber !== undefined)
      fields.addressNumber = args.addressNumber;
    if (args.complement !== undefined) fields.complement = args.complement;
    if (args.neighborhood !== undefined)
      fields.neighborhood = args.neighborhood;
    if (args.zipCode !== undefined) fields.zipCode = args.zipCode;
    if (args.notes !== undefined) fields.notes = args.notes;

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { customerId: existing._id, created: false };
    }

    const customerId = await ctx.db.insert("customers", {
      businessId,
      ...fields,
      createdAt: Date.now(),
    });
    return { customerId, created: true };
  },
});
