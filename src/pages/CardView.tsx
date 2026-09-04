import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "react-router";
import { motion } from "framer-motion";
import { Star, Gift } from "lucide-react";

export default function CardView() {
  const { cardId } = useParams<{ cardId: string }>();

  const data = useQuery(
    api.loyaltyCards.getPublic,
    cardId ? { loyaltyCardId: cardId as any } : "skip",
  );

  if (!cardId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Cartão não encontrado.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clay-card p-10 text-center max-w-sm"
        >
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </motion.div>
      </main>
    );
  }

  const { card, business } = data;

  if (!card || !business) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Este cartão não existe ou foi desativado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Hero Card */}
        <div className="clay-float p-8 mb-6 relative overflow-hidden">
          {/* Decorative background blob */}
          <div
            className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20 blur-3xl"
            style={{ background: business.brandColor || "var(--clay-orange)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-15 blur-3xl"
            style={{ background: business.brandColor || "var(--clay-blue)" }}
          />

          <div className="relative z-10 text-center">
            {/* Business Emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl"
              style={{
                background: `${business.brandColor || "var(--clay-orange)"}22`,
                boxShadow: `0 4px 12px ${business.brandColor || "var(--clay-orange)"}20`,
              }}
            >
              {business.logoEmoji || "🏪"}
            </motion.div>

            <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
            <p className="text-lg font-semibold" style={{ color: business.brandColor || "var(--clay-orange)" }}>
              {card.cardName}
            </p>
          </div>
        </div>

        {/* Stamp Grid */}
        <div className="clay-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4" style={{ color: business.brandColor || "var(--clay-orange)" }} />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Colete {card.totalStamps} carimbos
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: card.totalStamps }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                className="stamp-slot stamp-slot-empty flex items-center justify-center"
              >
                <span className="text-muted-foreground/40 text-xs font-semibold">{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reward */}
        <div className="clay-card p-6 text-center">
          <div
            className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white"
            style={{
              background: `linear-gradient(135deg, ${business.brandColor || "var(--clay-orange)"}, oklch(0.65 0.12 30))`,
              boxShadow: `0 4px 12px ${business.brandColor || "var(--clay-orange)"}40`,
            }}
          >
            <Gift className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Sua recompensa
          </p>
          <p className="text-lg font-bold">{card.rewardDescription}</p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Seu cartão fidelidade · Pague com carinho, volte com carinho
        </p>
      </motion.div>
    </main>
  );
}
