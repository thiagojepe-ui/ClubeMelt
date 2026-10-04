import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/customers/import
 * Espelha o cadastro de um cliente do sistema de Delivery para o ClubeMelt.
 * Autenticação: Authorization: Bearer <CUSTOMER_IMPORT_SECRET>
 *
 * Payload: { name, phone, businessId?, address?, addressNumber?, complement?,
 *            neighborhood?, zipCode?, notes? }
 */
const importCustomer = httpAction(async (ctx, request) => {
  const secret = process.env.CUSTOMER_IMPORT_SECRET;
  if (!secret) {
    return json(
      { ok: false, error: "CUSTOMER_IMPORT_SECRET não configurado no Convex" },
      500,
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return json({ ok: false, error: "Não autorizado" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "JSON inválido" }, 400);
  }

  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || typeof b.phone !== "string") {
    return json(
      { ok: false, error: "Campos obrigatórios: name, phone" },
      400,
    );
  }

  const opt = (key: string): string | undefined =>
    typeof b[key] === "string" ? (b[key] as string) : undefined;

  try {
    const result = await ctx.runMutation(internal.customerSync.importCustomer, {
      businessId:
        typeof b.businessId === "string"
          ? (b.businessId as Id<"businesses">)
          : undefined,
      name: b.name,
      phone: b.phone,
      address: opt("address"),
      addressNumber: opt("addressNumber"),
      complement: opt("complement"),
      neighborhood: opt("neighborhood"),
      zipCode: opt("zipCode"),
      notes: opt("notes"),
    });
    return json({ ok: true, ...result }, 200);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message.split("\n")[0].replace(/^Uncaught Error: /, "")
        : "Falha ao importar";
    return json({ ok: false, error: message }, 400);
  }
});

http.route({
  path: "/api/customers/import",
  method: "POST",
  handler: importCustomer,
});

export default http;
