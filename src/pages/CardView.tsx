import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState, useCallback } from "react";
import { Star, Gift, PartyPopper, Loader2 } from "lucide-react";

export default function CardView() {
  const { batchToken } = useParams<{ batchToken: string }>();

  const data = useQuery(
    api.publicCustomers.getByBatchToken,
    batchToken ? { batchToken } : "skip",
  );

  const revealNext = useMutation(api.publicCustomers.revealNextByBatchToken);

  const [revealing, setRevealing] = useState(false);
  const [lastReveal, setLastReveal] = useState<any>(null);
  const [showPrize, setShowPrize] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = useCallback(async () => {
    if (!batchToken || revealing || showPrize) return;
    setRevealing(true);
    setError(null);

    try {
      const result = await revealNext({ batchToken });
      setLastReveal(result);
      setShowPrize(true);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao coletar carimbo");
    }
    setRevealing(false);
  }, [batchToken, revealing, showPrize, revealNext]);

  const dismissPrize = () => {
    setShowPrize(false);
    setLastReveal(null);
  };

  const brandColor = data?.business?.brandColor || "var(--clay-orange)";

  if (!batchToken) {
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

  const { card, business, customer, batchPending, totalStamps, cyclesCompleted } = data;

  // Use lastReveal data for optimistic updates when prize is showing
  const displayProgress = showPrize && lastReveal
    ? lastReveal.currentProgress
    : data.currentProgress;
  const displayCyclesCompleted = showPrize && lastReveal
    ? lastReveal.cyclesCompleted
    : cyclesCompleted;
  const displayBatchPending = showPrize && lastReveal
    ? lastReveal.batchPending
    : batchPending;

  // All stamps in this batch collected
  const allBatchDone = displayBatchPending === 0 && !showPrize;

  // Check if we just completed a cycle (from the reveal)
  const justCompleted = showPrize && lastReveal?.justCompleted;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl clay-badge"
            style={{ background: `${brandColor}18`, boxShadow: `0 4px 12px ${brandColor}15` }}
          >
            {business.logoEmoji || "🏪"}
          </div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          {customer?.name && <p className="text-muted-foreground mt-1">Olá, {customer.name}!</p>}
        </div>

        {/* Main card */}
        <div className="clay-float p-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: brandColor }} />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-1 text-center" style={{ color: brandColor }}>
              {card.cardName}
            </h2>

            {/* Cycle indicator */}
            {displayCyclesCompleted > 0 && (
              <div className="text-center mb-2">
                <span
                  className="clay-badge px-3 py-1 text-[10px] font-bold inline-flex items-center gap-1"
                  style={{ background: `${brandColor}15`, color: brandColor }}
                >
                  🏆 Ciclo {displayCyclesCompleted} completo{displayCyclesCompleted > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center mb-6">
              {allBatchDone
                ? displayCyclesCompleted > 0
                  ? "Todos os carimbos deste lote coletados! Aguarde novos links."
                  : "Todos os carimbos coletados! ✨"
                : displayBatchPending > 0
                  ? `Toque para coletar — ${displayBatchPending} restante(s)`
                  : "Carregando..."
              }
            </p>

            {/* Stamp slots grid */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {Array.from({ length: totalStamps }).map((_, i) => {
                const isRevealed = i < displayProgress;
                const isJustRevealed = showPrize && lastReveal && i === displayProgress - 1 && lastReveal.justCompleted === false;

                return (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      isRevealed
                        ? "stamp-slot-filled text-white scale-100"
                        : "stamp-slot-empty"
                    } ${isJustRevealed ? "animate-bounce" : ""}`}
                    style={isRevealed ? { background: brandColor } : {}}
                  >
                    {isRevealed ? (
                      <Star className="w-5 h-5" />
                    ) : (
                      <span className="text-muted-foreground/30">{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prize reveal inline */}
            {showPrize && lastReveal && (
              <div
                className="mb-5 p-4 rounded-2xl text-center relative overflow-hidden"
                style={{
                  background: lastReveal.prize?.isPrize
                    ? `linear-gradient(135deg, ${brandColor}15, ${brandColor}08)`
                    : "oklch(0.96 0.005 90)",
                  border: `2px solid ${lastReveal.prize?.isPrize ? brandColor + "30" : "oklch(0.9 0.01 90 / 0.5)"}`,
                  animation: "clayModalIn 0.3s ease-out",
                }}
              >
                <div className="relative z-10">
                  {lastReveal.prize?.isPrize ? (
                    <>
                      <div className="text-3xl mb-2">🎁</div>
                      <div
                        className="clay-badge px-3 py-1 text-xs font-semibold mb-2 inline-flex"
                        style={{ background: `${brandColor}15`, color: brandColor }}
                      >
                        Prêmio!
                      </div>
                    </>
                  ) : (
                    <div className="text-3xl mb-2">⭐</div>
                  )}
                  <p className="font-bold text-base mb-1">
                    {lastReveal.justCompleted
                      ? "🎉 Ciclo completo!"
                      : lastReveal.prize?.isPrize
                        ? "Parabéns!"
                        : "Selo coletado!"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lastReveal.prize?.message || "Carimbo coletado!"}
                  </p>

                  {lastReveal.justCompleted ? (
                    <div className="mt-3 space-y-2">
                      <div className="clay-badge px-4 py-2 inline-flex items-center gap-2 bg-primary text-primary-foreground">
                        <PartyPopper className="w-4 h-4" />
                        <span className="font-bold text-sm">Recompensa desbloqueada!</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: brandColor }}>
                        {lastReveal.rewardDescription}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Continue coletando selos para o próximo prêmio!
                      </p>
                    </div>
                  ) : lastReveal.batchPending > 0 ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Ainda tem {lastReveal.batchPending} carimbo(s) — colete o próximo!
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Faltam {lastReveal.totalStamps - lastReveal.currentProgress} para completar o ciclo.
                    </p>
                  )}

                  <button
                    onClick={dismissPrize}
                    className="clay-button px-5 py-2 text-sm font-semibold mt-3"
                    style={{ background: brandColor, color: "white" }}
                  >
                    {lastReveal.justCompleted ? "🎉 Incrível!" : "Continuar"}
                  </button>
                </div>
              </div>
            )}

            {/* Collect button */}
            {!allBatchDone && !showPrize && (
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="clay-button w-full py-3.5 font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: brandColor, color: "white" }}
              >
                {revealing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Star className="w-5 h-5" />
                )}
                {revealing ? "Coletando..." : "Coletar carimbo"}
              </button>
            )}

            {/* Batch complete — waiting for more */}
            {allBatchDone && (
              <div className="text-center py-2">
                <div className="text-4xl mb-3">✨</div>
                <p className="font-bold text-base mb-1">Lote completo!</p>
                <p className="text-sm text-muted-foreground">
                  {displayCyclesCompleted > 0
                    ? `${customer?.name ? customer.name + ", você" : "Você"} já completou ${displayCyclesCompleted} ciclo(s). Aguarde novos links para continuar!`
                    : `${customer?.name ? customer.name + ", você" : "Você"} coletou todos os carimbos deste link.`
                  }
                </p>
              </div>
            )}

            {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}
          </div>
        </div>

        {/* Reward info */}
        <div className="clay-card p-5 text-center mt-4">
          <div
            className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center text-white clay-badge"
            style={{
              background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`,
              boxShadow: `0 3px 8px ${brandColor}25`,
            }}
          >
            <Gift className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
            Recompensa do cartão
          </p>
          <p className="text-sm font-bold">{card.rewardDescription}</p>
          {displayCyclesCompleted > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {displayCyclesCompleted}x conquistado{displayCyclesCompleted > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
