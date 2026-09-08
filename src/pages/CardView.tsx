import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
      setError(err?.data?.message || err?.message || "Erro ao coletar selo");
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

  const { card, business, customer, totalStamps, cyclesCompleted } = data;

  const displayProgress = showPrize && lastReveal
    ? lastReveal.currentProgress
    : data.currentProgress;
  const displayCyclesCompleted = showPrize && lastReveal
    ? lastReveal.cyclesCompleted
    : cyclesCompleted;
  const displayBatchPending = showPrize && lastReveal
    ? lastReveal.batchPending
    : data.batchPending;

  const allBatchDone = displayBatchPending === 0 && !showPrize;

  return (
    <>
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

        <div className="w-full max-w-md relative z-10">
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

          <div className="clay-float p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: brandColor }} />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: brandColor }}>
                {card.cardName}
              </h2>

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
                    ? "Todos os selos deste lote coletados! Aguarde novos links."
                    : "Todos os selos coletados! ✨"
                  : displayBatchPending > 0
                    ? `Toque para coletar — ${displayBatchPending} restante(s)`
                    : "Carregando..."
                }
              </p>

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

              <div style={{ display: showPrize || allBatchDone ? "none" : "block" }}>
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
                  {revealing ? "Coletando..." : "Coletar selo"}
                </button>
              </div>

              <div className="text-center py-2" style={{ display: allBatchDone && !showPrize ? "block" : "none" }}>
                <div className="text-4xl mb-3">✨</div>
                <p className="font-bold text-base mb-1">Lote completo!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {displayCyclesCompleted > 0
                    ? `${customer?.name ? customer.name + ", você" : "Você"} já completou ${displayCyclesCompleted} ciclo(s). Aguarde novos links para continuar!`
                    : `${customer?.name ? customer.name + ", você" : "Você"} coletou todos os selos deste link.`
                  }
                </p>
                {customer?._id && (
                  <a
                    href={`/customer/${customer._id}`}
                    className="clay-button px-6 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2"
                    style={{ background: brandColor, color: "white" }}
                  >
                    Voltar para minha área
                  </a>
                )}
              </div>

              {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}
            </div>
          </div>

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

      {/* Prize overlay — portal renders on document.body */}
      {createPortal(
        <CardViewPrizeOverlay
          show={showPrize}
          reveal={lastReveal}
          brandColor={brandColor}
          customerId={customer?._id}
          onDismiss={dismissPrize}
        />,
        document.body,
      )}
    </>
  );
}

/* ─── CardView Prize Overlay ─────────────────────── */

function CardViewPrizeOverlay({
  show,
  reveal,
  brandColor,
  customerId,
  onDismiss,
}: {
  show: boolean;
  reveal: any;
  brandColor: string;
  customerId?: string;
  onDismiss: () => void;
}) {
  if (!reveal) return null;

  const isCycleComplete = reveal.justCompleted;
  const isPrize = reveal.prize?.isPrize;
  const stampMessage = reveal.prize?.message || "Selo coletado!";

  let icon: string;
  let badgeText: string;
  let title: string;
  let cardBg: string;
  let cardBorder: string;

  if (isCycleComplete) {
    icon = "🎉";
    badgeText = "Ciclo completo!";
    title = "Parabéns! 🏆";
    cardBg = `linear-gradient(135deg, ${brandColor}18, ${brandColor}08)`;
    cardBorder = `${brandColor}40`;
  } else if (isPrize) {
    icon = "🎁";
    badgeText = "Prêmio desbloqueado!";
    title = "Parabéns!";
    cardBg = `linear-gradient(135deg, ${brandColor}15, ${brandColor}08)`;
    cardBorder = `${brandColor}35`;
  } else {
    icon = "⭐";
    badgeText = `Selo ${reveal.position + 1}`;
    title = stampMessage;
    cardBg = `linear-gradient(135deg, ${brandColor}12, ${brandColor}05)`;
    cardBorder = `${brandColor}25`;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: show ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "24rem",
          textAlign: "center",
          background: cardBg,
          border: `2px solid ${cardBorder}`,
          borderRadius: "1.5rem",
          padding: "2rem 1.5rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isCycleComplete && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 30%, ${brandColor}25 0%, transparent 70%)`,
              pointerEvents: "none",
              borderRadius: "1.5rem",
            }}
          />
        )}

        <div style={{ fontSize: isCycleComplete ? "4rem" : "3.5rem", marginBottom: "0.75rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))", position: "relative" }}>
          {icon}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 1rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            borderRadius: "9999px",
            background: `${brandColor}20`,
            color: brandColor,
            marginBottom: "0.75rem",
            position: "relative",
          }}
        >
          {isCycleComplete && <PartyPopper style={{ width: "0.875rem", height: "0.875rem" }} />}
          {badgeText}
        </div>

        <p style={{ fontWeight: 700, fontSize: isCycleComplete ? "1.5rem" : "1.25rem", marginBottom: "0.25rem", color: "oklch(0.2 0.02 60)", position: "relative" }}>
          {title}
        </p>

        {!isCycleComplete && (
          <p style={{ fontSize: "0.875rem", color: "oklch(0.5 0.01 60)", lineHeight: 1.6, marginBottom: "1rem", position: "relative" }}>
            {stampMessage}
          </p>
        )}

        {(isCycleComplete || isPrize) && (
          <div
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              textAlign: "center",
              marginBottom: "1rem",
              background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}08)`,
              border: `2px solid ${brandColor}30`,
              boxShadow: `0 8px 24px ${brandColor}15`,
              position: "relative",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
              {isCycleComplete ? "🎁" : "🌟"}
            </div>
            <p style={{ fontSize: "0.625rem", color: "oklch(0.5 0.01 60)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>
              {isCycleComplete ? "Sua recompensa" : "Prêmio deste selo"}
            </p>
            <p style={{ fontSize: "1.125rem", fontWeight: 700, color: brandColor }}>
              {isCycleComplete ? reveal.rewardDescription : stampMessage}
            </p>
          </div>
        )}

        {!isCycleComplete && !isPrize && reveal.batchPending > 0 && (
          <p style={{ fontSize: "0.75rem", color: "oklch(0.5 0.01 60)", marginBottom: "1rem", position: "relative" }}>
            🎯 Ainda tem {reveal.batchPending} selo(s) — colete o próximo!
          </p>
        )}

        {isCycleComplete && (
          <div
            style={{
              borderRadius: "0.75rem",
              padding: "0.75rem",
              textAlign: "center",
              marginBottom: "1rem",
              background: `${brandColor}08`,
              border: `1px solid ${brandColor}15`,
              position: "relative",
            }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: brandColor }}>
              Apresente este prêmio no estabelecimento para resgatar
            </p>
          </div>
        )}

        <button
          onClick={onDismiss}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: brandColor,
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            cursor: "pointer",
            position: "relative",
          }}
        >
          {isCycleComplete ? "🎉 Incrível!" : isPrize ? "🎁 Obrigado!" : "Continuar"}
        </button>

        {!isCycleComplete && reveal.batchPending === 0 && customerId && (
          <a
            href={`/customer/${customerId}`}
            style={{
              display: "block",
              marginTop: "0.5rem",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: brandColor,
              border: `2px solid ${brandColor}40`,
              borderRadius: "0.75rem",
              textDecoration: "none",
              position: "relative",
            }}
          >
            Voltar para minha área
          </a>
        )}
      </div>
    </div>
  );
}
