import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { Star, Gift, Loader2, MousePointerClick, Cookie, RotateCcw, LogOut, PartyPopper } from "lucide-react";

/* ─── Helper: opacity via color-mix (works with any CSS color) ─── */
function c(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

/* ─── Native DOM Prize Overlay (outside React tree) ─────────────── */

let _prizeEl: HTMLDivElement | null = null;

function ensurePrizeContainer(): HTMLDivElement {
  if (_prizeEl && document.body.contains(_prizeEl)) return _prizeEl;
  _prizeEl = document.createElement("div");
  _prizeEl.id = "freebuff-prize-overlay";
  _prizeEl.style.cssText = "position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);";
  _prizeEl.addEventListener("click", (e) => {
    if (e.target === _prizeEl) hidePrize();
  });
  document.body.appendChild(_prizeEl);
  return _prizeEl;
}

function showPrizeOverlay(data: {
  position: number;
  prize: { message: string; isPrize: boolean } | null;
  totalRevealed: number;
  totalStamps: number;
  currentProgress: number;
  cyclesCompleted: number;
  justCompleted: boolean;
  rewardDescription: string;
  customerName: string;
}, brandColor: string, customerId?: string) {
  const el = ensurePrizeContainer();
  const isCycleComplete = data.justCompleted;
  const isPrize = data.prize?.isPrize;
  const stampMessage = data.prize?.message || "Selo coletado!";
  const remaining = data.totalStamps - data.currentProgress;

  let icon: string, badgeText: string, title: string;
  if (isCycleComplete) {
    icon = "🎉"; badgeText = "Ciclo completo!"; title = "Parabéns! 🏆";
  } else if (isPrize) {
    icon = "🎁"; badgeText = "Prêmio desbloqueado!"; title = "Parabéns!";
  } else {
    icon = "⭐"; badgeText = `Selo ${data.position + 1}`; title = stampMessage;
  }

  // Solid background colors that work with any brandColor format
  const cardBg = isCycleComplete
    ? `linear-gradient(135deg, #FFF8F0, #FFF5ED)`
    : isPrize
      ? `linear-gradient(135deg, #FFFAF5, #FFF8F0)`
      : `linear-gradient(135deg, #FFFCF8, #FFFAF5)`;
  const cardBorder = isCycleComplete ? c(brandColor, 40) : isPrize ? c(brandColor, 35) : c(brandColor, 25);

  const showRewardCard = isCycleComplete || isPrize;
  const btnText = isCycleComplete ? "🎉 Incrível!" : isPrize ? "🎁 Obrigado!" : "Continuar";

  el.innerHTML = `
    <div style="width:100%;max-width:24rem;text-align:center;background:${cardBg};border:2px solid ${cardBorder};border-radius:1.5rem;padding:2rem 1.5rem;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;overflow:hidden;" onclick="event.stopPropagation()">
      ${isCycleComplete ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,${c(brandColor, 18)} 0%,transparent 70%);pointer-events:none;border-radius:1.5rem;"></div>` : ""}
      <div style="font-size:${isCycleComplete ? "4rem" : "3.5rem"};margin-bottom:0.75rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15));position:relative;">${icon}</div>
      <div style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 1rem;font-size:0.75rem;font-weight:700;border-radius:9999px;background:${c(brandColor, 15)};color:${brandColor};margin-bottom:0.75rem;position:relative;">${badgeText}</div>
      <p style="font-weight:700;font-size:${isCycleComplete ? "1.5rem" : "1.25rem"};margin-bottom:0.25rem;color:oklch(0.2 0.02 60);position:relative;">${title}</p>
      ${!isCycleComplete ? `<p style="font-size:0.875rem;color:oklch(0.5 0.01 60);line-height:1.6;margin-bottom:1rem;position:relative;">${stampMessage}</p>` : ""}
      ${showRewardCard ? `
        <div style="border-radius:1rem;padding:1.25rem;text-align:center;margin-bottom:1rem;background:linear-gradient(135deg, ${c(brandColor, 20)}, ${c(brandColor, 10)});border:2px solid ${c(brandColor, 35)};box-shadow:0 8px 24px ${c(brandColor, 20)};position:relative;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">${isCycleComplete ? "🎁" : "🌟"}</div>
          <p style="font-size:0.625rem;color:oklch(0.5 0.01 60);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.25rem;">${isCycleComplete ? "Sua recompensa" : "Prêmio deste selo"}</p>
          <p style="font-size:1.125rem;font-weight:700;color:${brandColor};">${isCycleComplete ? data.rewardDescription : stampMessage}</p>
        </div>
      ` : ""}
      ${!isCycleComplete && !isPrize && remaining > 0 ? `<p style="font-size:0.75rem;color:oklch(0.5 0.01 60);margin-bottom:1rem;position:relative;">🎯 Faltam ${remaining} selo(s) para completar o cartão</p>` : ""}
      ${!isCycleComplete && !isPrize && remaining <= 0 ? `<p style="font-size:0.75rem;color:oklch(0.5 0.01 60);margin-bottom:1rem;position:relative;">🎉 Último selo coletado!</p>` : ""}
      ${isCycleComplete ? `
        <div style="border-radius:0.75rem;padding:0.75rem;text-align:center;margin-bottom:1rem;background:${c(brandColor, 6)};border:1px solid ${c(brandColor, 12)};position:relative;">
          <p style="font-size:0.75rem;font-weight:600;color:${brandColor};">Apresente este prêmio no estabelecimento para resgatar</p>
        </div>
      ` : ""}
      <button onclick="window.__freebuff_dismiss_prize()" style="width:100%;padding:0.75rem 1.5rem;font-size:0.875rem;font-weight:600;background:${brandColor};color:white;border:none;border-radius:0.75rem;cursor:pointer;position:relative;">${btnText}</button>
      ${!isCycleComplete && remaining <= 0 && customerId ? `<a href="/customer/${customerId}" style="display:block;margin-top:0.5rem;padding:0.625rem 1.5rem;font-size:0.875rem;font-weight:600;color:${brandColor};border:2px solid ${c(brandColor, 30)};border-radius:0.75rem;text-decoration:none;position:relative;">Voltar para minha área</a>` : ""}
    </div>
  `;
  el.style.display = "flex";

  const card = el.firstElementChild as HTMLElement | null;
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";
    card.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
    requestAnimationFrame(() => {
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    });
  }
}

function hidePrize() {
  if (_prizeEl) _prizeEl.style.display = "none";
}

(window as any).__freebuff_dismiss_prize = hidePrize;

/* ─── Main Component ────────────────────────────── */

export default function CustomerDashboard() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customerPhone, setCustomerPhone] = useState<string | null>(() => {
    if (!customerId) return null;
    try {
      const stored = localStorage.getItem(`freebuff_customer_${customerId}`);
      return stored ? JSON.parse(stored).phone ?? null : null;
    } catch {
      return null;
    }
  });
  const [collectingCardId, setCollectingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revealNext = useMutation(api.publicCustomers.revealNextForCustomer);

  const batches = useQuery(
    api.publicCustomers.getMyBatches,
    customerId && customerPhone
      ? { customerId: customerId as any, phone: customerPhone }
      : "skip",
  );

  const customerInfo = useQuery(
    api.publicCustomers.getCustomerPublic,
    customerId ? { customerId: customerId as any } : "skip",
  );

  useEffect(() => {
    if (customerInfo && !customerPhone) {
      setTimeout(() => {
        window.location.replace(`/register/${customerInfo.businessId}`);
      }, 0);
    }
  }, [customerInfo, customerPhone]);

  useEffect(() => {
    return () => {
      if (_prizeEl && document.body.contains(_prizeEl)) {
        document.body.removeChild(_prizeEl);
        _prizeEl = null;
      }
    };
  }, []);

  const handleCollect = useCallback(async (loyaltyCardId: string) => {
    if (!customerId || !customerPhone || collectingCardId) return;
    setCollectingCardId(loyaltyCardId);
    setError(null);
    try {
      const result = await revealNext({
        customerId: customerId as any,
        loyaltyCardId: loyaltyCardId as any,
        phone: customerPhone,
      });
      const bc = customerInfo?.brandColor || "var(--clay-orange)";
      requestAnimationFrame(() => {
        showPrizeOverlay(result, bc, customerId);
      });
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Não foi possível coletar o selo");
    } finally {
      setCollectingCardId(null);
    }
  }, [customerId, customerPhone, collectingCardId, revealNext, customerInfo]);

  const handleLogout = () => {
    if (customerId) localStorage.removeItem(`freebuff_customer_${customerId}`);
    if (customerInfo?.businessId) {
      setTimeout(() => {
        window.location.replace(`/register/${customerInfo.businessId}`);
      }, 0);
    }
  };

  if (!customerId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Link inválido.</p>
        </div>
      </main>
    );
  }

  if (!customerPhone) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Abrindo seu acesso...</p>
        </div>
      </main>
    );
  }

  if (batches === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </main>
    );
  }

  const brandColor = customerInfo?.brandColor || "var(--clay-orange)";

  const currentBatch = batches.length > 0
    ? batches.find((b) => b.batchPending > 0) ?? batches[0]
    : null;

  const cyclesByCard = new Map<string, number>();
  for (const b of batches) {
    const prev = cyclesByCard.get(b.loyaltyCardId) ?? 0;
    if (b.cyclesCompleted > prev) {
      cyclesByCard.set(b.loyaltyCardId, b.cyclesCompleted);
    }
  }
  const totalCyclesCompleted = Array.from(cyclesByCard.values()).reduce((sum, c) => sum + c, 0);

  if (!batches || batches.length === 0) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />
        <div className="clay-card p-10 text-center max-w-sm relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl clay-badge" style={{ background: c(brandColor, 10) }}>
            <Cookie className="w-8 h-8" style={{ color: brandColor }} />
          </div>
          <h1 className="text-xl font-bold mb-2">Nenhum carimbo ainda</h1>
          <p className="text-muted-foreground text-sm">
            Aguarde o estabelecimento enviar links para você coletar selos. Eles aparecerão aqui!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-3xl flex items-center justify-center text-3xl clay-badge"
            style={{ background: c(brandColor, 10), boxShadow: `0 4px 12px ${c(brandColor, 10)}` }}
          >
            {customerInfo?.logoEmoji || "⭐"}
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Olá, {customerInfo?.name?.split(" ")[0] || "cliente"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {customerInfo?.businessName ? `${customerInfo.businessName} · ` : ""}
            Acompanhe seus selos e prêmios
          </p>

          {totalCyclesCompleted > 0 && (
            <div className="mt-3">
              <div
                className="clay-badge px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
                style={{ background: c(brandColor, 10), color: brandColor }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {totalCyclesCompleted} cartão(ões) completo(s) — continue acumulando!
              </div>
            </div>
          )}

          {currentBatch?.rewardDescription && (
            <div
              className="rounded-2xl p-5 text-center mt-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${c(brandColor, 8)}, ${c(brandColor, 3)})`,
                border: `2px solid ${c(brandColor, 16)}`,
              }}
            >
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white clay-badge"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`,
                  boxShadow: `0 4px 12px ${c(brandColor, 22)}`,
                }}
              >
                <Gift className="w-7 h-7" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                Recompensa do cartão
              </p>
              <p className="text-lg font-bold mb-1" style={{ color: brandColor }}>
                {currentBatch.rewardDescription}
              </p>
              {currentBatch.cyclesCompleted > 0 && (
                <p className="text-xs text-muted-foreground font-medium">
                  {currentBatch.cyclesCompleted}x conquistado{currentBatch.cyclesCompleted > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {currentBatch && (
          <CurrentCard
            batch={currentBatch}
            brandColor={brandColor}
            collecting={collectingCardId === currentBatch.loyaltyCardId}
            onCollect={() => handleCollect(currentBatch.loyaltyCardId)}
          />
        )}

        {error && (
          <div className="clay-badge mt-4 px-4 py-3 text-sm text-center font-semibold text-red-500" style={{ background: "rgba(239,68,68,0.08)" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="clay-button-secondary w-full mt-6 py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair da minha área
        </button>
      </div>
    </main>
  );
}

/* ─── Current Card Component ────────────────────── */

function CurrentCard({
  batch,
  brandColor,
  collecting,
  onCollect,
}: {
  batch: {
    batchToken: string;
    loyaltyCardId: string;
    cardName: string;
    totalStamps: number;
    batchPending: number;
    batchRevealed: number;
    currentProgress: number;
    cyclesCompleted: number;
    completed: boolean;
    rewardDescription: string;
    businessName: string;
    brandColor: string;
    logoEmoji: string;
  };
  brandColor: string;
  collecting: boolean;
  onCollect: () => void;
}) {
  const cardBrandColor = batch.brandColor || brandColor;
  const progress =
    batch.totalStamps > 0
      ? (batch.currentProgress / batch.totalStamps) * 100
      : 0;

  return (
    <div className="clay-float p-6 relative overflow-hidden">
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 blur-3xl"
        style={{ background: cardBrandColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl clay-badge"
            style={{
              background: c(cardBrandColor, 10),
              boxShadow: `0 3px 8px ${c(cardBrandColor, 10)}`,
            }}
          >
            {batch.logoEmoji || "🏪"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {batch.businessName}
            </p>
            <h3
              className="font-bold text-base"
              style={{ color: cardBrandColor }}
            >
              {batch.cardName}
            </h3>
          </div>
          {batch.cyclesCompleted > 0 && (
            <div className="clay-badge px-2 py-1 text-[10px] font-bold inline-flex items-center gap-1" style={{ background: c(cardBrandColor, 10), color: cardBrandColor }}>
              <RotateCcw className="w-3 h-3" />
              Ciclo {batch.cyclesCompleted + 1}
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Progresso
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: cardBrandColor }}
            >
              {batch.currentProgress}/{batch.totalStamps} selos
            </span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden clay-progress-track">
            <div
              className="h-full rounded-full transition-all duration-500 clay-progress-fill"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${cardBrandColor}, oklch(0.65 0.12 30))`,
              }}
            />
          </div>
        </div>

        <div className="flex gap-1.5 my-4 flex-wrap">
          {Array.from({ length: batch.totalStamps }).map((_, i) => {
            const isRevealed = i < batch.currentProgress;
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isRevealed
                    ? "stamp-slot-filled text-white"
                    : "stamp-slot-empty"
                }`}
                style={isRevealed ? { background: cardBrandColor } : {}}
              >
                {isRevealed ? (
                  <Star className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-muted-foreground/30">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {batch.batchPending > 0 && (
          <button
            type="button"
            onClick={onCollect}
            disabled={collecting}
            className="clay-button w-full py-3 mt-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: cardBrandColor, color: "white" }}
          >
            {collecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MousePointerClick className="w-5 h-5" />
                Coletar {batch.batchPending} selo{batch.batchPending > 1 ? "s" : ""}
              </>
            )}
          </button>
        )}

        {!batch.completed && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Faltam {batch.totalStamps - batch.currentProgress} para completar o cartão e receber o prêmio!
          </p>
        )}

        {batch.completed && (
          <div className="text-center mt-2">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-bold mb-1">Cartão completo!</p>
            <p className="text-xs text-muted-foreground">
              Continue acumulando selos para o próximo prêmio!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
