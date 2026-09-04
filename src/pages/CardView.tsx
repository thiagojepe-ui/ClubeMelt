import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Gift, PartyPopper, Loader2 } from "lucide-react";

export default function CardView() {
  const { token } = useParams<{ token: string }>();

  const data = useQuery(
    api.publicCustomers.getByToken,
    token ? { token } : "skip",
  );

  const revealByToken = useMutation(api.publicCustomers.revealByToken);

  const [revealing, setRevealing] = useState(false);
  const [lastReveal, setLastReveal] = useState<any>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = useCallback(async () => {
    if (!token || revealing || showPrizeModal) return;
    setRevealing(true);
    setError(null);

    try {
      const result = await revealByToken({ token });
      setLastReveal(result);
      setShowPrizeModal(true);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao coletar carimbo");
    }
    setRevealing(false);
  }, [token, revealing, showPrizeModal, revealByToken]);

  const brandColor = data?.business?.brandColor || "var(--clay-orange)";

  if (!token) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Link inválido.</p>
        </div>
      </main>
    );
  }

  if (data === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </main>
    );
  }

  if (!data || !data.card || !data.business) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Este link não existe ou expirou.</p>
        </div>
      </main>
    );
  }

  const { card, business, customer, isRevealed } = data;

  if (isRevealed) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-10 text-center max-w-sm relative z-10">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-xl font-bold mb-2">Carimbo já coletado!</h1>
          <p className="text-muted-foreground text-sm mb-4">
            {customer?.name ? `${customer.name}, você` : "Você"} já coletou este carimbo.
          </p>
          <p className="text-xs text-muted-foreground">
            Peça um novo link na próxima compra para coletar o próximo selo.
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl clay-badge" style={{ background: `${brandColor}18`, boxShadow: `0 4px 12px ${brandColor}15` }}>
            {business.logoEmoji || "🏪"}
          </motion.div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          {customer?.name && <p className="text-muted-foreground mt-1">Olá, {customer.name}!</p>}
        </div>

        <div className="clay-float p-8 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: brandColor }} />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-1" style={{ color: brandColor }}>{card.cardName}</h2>
            <p className="text-sm text-muted-foreground mb-6">Toque para coletar seu carimbo!</p>

            <motion.div animate={!revealing ? { scale: [1, 1.05, 1] } : { scale: [1, 0.95, 1.1, 0] }} transition={!revealing ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }} className="w-24 h-24 mx-auto mb-6 rounded-3xl stamp-slot-empty flex items-center justify-center" style={{ borderColor: `${brandColor}40`, boxShadow: `0 0 0 3px ${brandColor}15, inset 0 2px 6px oklch(0.7 0.01 90 / 0.1)` }}>
              <span className="text-3xl font-bold" style={{ color: brandColor }}>?</span>
            </motion.div>

            <button onClick={handleReveal} disabled={revealing} className="clay-button px-8 py-3.5 font-semibold text-base disabled:opacity-50" style={{ background: brandColor, color: "white" }}>
              {revealing ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : <Star className="w-5 h-5 inline mr-2" />}
              {revealing ? "Coletando..." : "Coletar carimbo"}
            </button>

            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          </div>
        </div>

        <div className="clay-card p-5 text-center mt-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center text-white clay-badge" style={{ background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`, boxShadow: `0 3px 8px ${brandColor}25` }}>
            <Gift className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Recompensa do cartão</p>
          <p className="text-sm font-bold">{card.rewardDescription}</p>
        </div>
      </motion.div>

      {showPrizeModal && lastReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowPrizeModal(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="clay-float p-8 text-center relative z-10 max-w-sm w-full" onClick={(e) => e.stopPropagation()}
            style={{ animation: "clayModalIn 0.3s ease-out" }}>
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: brandColor }} />
              <div className="relative z-10">
                {lastReveal.prize?.isPrize ? (
                  <>
                    <div className="text-5xl mb-3">🎁</div>
                    <div className="clay-badge px-3 py-1 text-xs font-semibold mb-3" style={{ background: `${brandColor}15`, color: brandColor }}>Prêmio!</div>
                  </>
                ) : (
                  <div className="text-5xl mb-3">⭐</div>
                )}
                <h3 className="text-xl font-bold mb-2">{lastReveal.prize?.isPrize ? "Parabéns!" : "Selo coletado!"}</h3>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{lastReveal.prize?.message || "Carimbo coletado!"}</p>
                {lastReveal.completed ? (
                  <div className="space-y-3">
                    <div className="clay-badge px-4 py-2.5 inline-flex items-center gap-2 bg-primary text-primary-foreground">
                      <PartyPopper className="w-4 h-4" />
                      <span className="font-bold text-sm">Recompensa desbloqueada!</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: brandColor }}>{lastReveal.rewardDescription}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Faltam {lastReveal.totalStamps - lastReveal.totalRevealed} carimbo(s) para sua recompensa</p>
                )}
                <button onClick={() => setShowPrizeModal(false)} className="clay-button px-6 py-2.5 text-sm font-semibold mt-5" style={{ background: brandColor, color: "white" }}>
                  {lastReveal.completed ? "Ver recompensa" : "Fechar"}
                </button>
              </div>
          </div>
        </div>
      )}
    </main>
  );
}
