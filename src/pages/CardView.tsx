import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState, useCallback, useEffect } from "react";
import { Star, Gift, Loader2 } from "lucide-react";

/* ─── Helper: opacity via color-mix (works with any CSS color) ─── */
function c(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

/* ─── Native DOM Prize Overlay (outside React tree) ─────────────── */

let _cardPrizeEl: HTMLDivElement | null = null;

function ensureCardPrizeContainer(): HTMLDivElement {
  if (_cardPrizeEl && document.body.contains(_cardPrizeEl)) return _cardPrizeEl;
  _cardPrizeEl = document.createElement("div");
  _cardPrizeEl.id = "freebuff-card-prize-overlay";
  _cardPrizeEl.style.cssText = "position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);";
  _cardPrizeEl.addEventListener("click", (e) => {
    if (e.target === _cardPrizeEl) hideCardPrize();
  });
  document.body.appendChild(_cardPrizeEl);
  return _cardPrizeEl;
}

function showCardPrizeOverlay(data: any, brandColor: string, customerId?: string) {
  const el = ensureCardPrizeContainer();
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

  const cardBg = isCycleComplete
    ? `linear-gradient(135deg, #FFF8F0, #FFF5ED)`
    : isPrize
      ? `linear-gradient(135deg, #FFFAF5, #FFF8F0)`
      : `linear-gradient(135deg, #FFFCF8, #FFFAF5)`;
  const cardBorder = isCycleComplete ? c(brandColor, 40) : isPrize ? c(brandColor, 35) : c(brandColor, 25);

  const btnText = isCycleComplete ? "🎉 Incrível!" : isPrize ? "🎁 Obrigado!" : "Continuar";

  el.innerHTML = `
    <div style="width:100%;max-width:24rem;text-align:center;background:${cardBg};border:2px solid ${cardBorder};border-radius:1.5rem;padding:2rem 1.5rem;box-shadow:0 25px 50px rgba(0,0,0,0.25);position:relative;overflow:hidden;" onclick="event.stopPropagation()">
      ${isCycleComplete ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,${c(brandColor, 18)} 0%,transparent 70%);pointer-events:none;border-radius:1.5rem;"></div>` : ""}
      <div style="font-size:${isCycleComplete ? "4rem" : "3.5rem"};margin-bottom:0.75rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15));position:relative;">${icon}</div>
      <div style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 1rem;font-size:0.75rem;font-weight:700;border-radius:9999px;background:${c(brandColor, 15)};color:${brandColor};margin-bottom:0.75rem;position:relative;">${badgeText}</div>
      <p style="font-weight:700;font-size:${isCycleComplete ? "1.5rem" : "1.25rem"};margin-bottom:${isCycleComplete || isPrize ? "0.25rem" : "1rem"};color:oklch(0.2 0.02 60);position:relative;">${title}</p>
      ${isCycleComplete ? `\n        <div style="border-radius:1rem;padding:1.25rem;text-align:center;margin-bottom:1rem;background:linear-gradient(135deg, ${c(brandColor, 20)}, ${c(brandColor, 10)});border:2px solid ${c(brandColor, 35)};box-shadow:0 8px 24px ${c(brandColor, 20)};position:relative;">\n          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎁</div>\n          <p style="font-size:0.625rem;color:oklch(0.5 0.01 60);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.25rem;">Sua recompensa</p>\n          <p style="font-size:1.125rem;font-weight:700;color:${brandColor};">${data.rewardDescription}</p>\n        </div>\n      ` : ""}
      ${isPrize ? `\n        <div style="border-radius:1rem;padding:1.25rem;text-align:center;margin-bottom:1rem;background:linear-gradient(135deg, ${c(brandColor, 20)}, ${c(brandColor, 10)});border:2px solid ${c(brandColor, 35)};box-shadow:0 8px 24px ${c(brandColor, 20)};position:relative;">\n          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🌟</div>\n          <p style="font-size:0.625rem;color:oklch(0.5 0.01 60);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.25rem;">Prêmio deste selo</p>\n          <p style="font-size:1.125rem;font-weight:700;color:${brandColor};">${stampMessage}</p>\n        </div>\n      ` : ""}
      ${!isCycleComplete && !isPrize && remaining > 0 ? `<p style="font-size:0.75rem;color:oklch(0.5 0.01 60);margin-bottom:1rem;position:relative;">🎯 Faltam ${remaining} selo(s) para completar o cartão</p>` : ""}
      ${!isCycleComplete && !isPrize && remaining <= 0 ? `<p style="font-size:0.75rem;color:oklch(0.5 0.01 60);margin-bottom:1rem;position:relative;">🎉 Último selo coletado!</p>` : ""}
      ${isCycleComplete ? `\n        <div style="border-radius:0.75rem;padding:0.75rem;text-align:center;margin-bottom:1rem;background:${c(brandColor, 6)};border:1px solid ${c(brandColor, 12)};position:relative;">\n          <p style="font-size:0.75rem;font-weight:600;color:${brandColor};">Apresente este prêmio no estabelecimento para resgatar</p>\n        </div>\n      ` : ""}
      <button onclick="window.__freebuff_dismiss_card_prize()" style="width:100%;padding:0.75rem 1.5rem;font-size:0.875rem;font-weight:600;background:${brandColor};color:white;border:none;border-radius:0.75rem;cursor:pointer;position:relative;">${btnText}</button>
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

function hideCardPrize() {
  if (_cardPrizeEl) _cardPrizeEl.style.display = "none";
}

(window as any).__freebuff_dismiss_card_prize = hideCardPrize;

/* ─── Main Component ────────────────────────────── */

export default function CardView() {
  const { batchToken } = useParams<{ batchToken: string }>();

  const data = useQuery(
    api.publicCustomers.getByBatchToken,
    batchToken ? { batchToken } : "skip",
  );

  const revealNext = useMutation(api.publicCustomers.revealNextByBatchToken);

  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (_cardPrizeEl && document.body.contains(_cardPrizeEl)) {
        document.body.removeChild(_cardPrizeEl);
        _cardPrizeEl = null;
      }
    };
  }, []);

  const handleReveal = useCallback(async () => {
    if (!batchToken || revealing) return;
    setRevealing(true);
    setError(null);

    try {
      const result = await revealNext({ batchToken });
      const brandColor = data?.business?.brandColor || "var(--clay-orange)";
      const customerId = data?.customer?._id;
      requestAnimationFrame(() => {
        showCardPrizeOverlay(result, brandColor, customerId);
      });
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao coletar selo");
    }
    setRevealing(false);
  }, [batchToken, revealing, revealNext, data]);

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

  const displayProgress = data.currentProgress;
  const displayCyclesCompleted = cyclesCompleted;
  const displayBatchPending = data.batchPending;

  const allBatchDone = displayBatchPending === 0;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl clay-badge"
            style={{ background: c(brandColor, 10), boxShadow: `0 4px 12px ${c(brandColor, 10)}` }}
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
                  style={{ background: c(brandColor, 10), color: brandColor }}
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
                return (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      isRevealed
                        ? "stamp-slot-filled text-white scale-100"
                        : "stamp-slot-empty"
                    }`}
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

            <div style={{ display: allBatchDone ? "none" : "block" }}>
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

            <div className="text-center py-2" style={{ display: allBatchDone ? "block" : "none" }}>
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
              boxShadow: `0 3px 8px ${c(brandColor, 18)}`,
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
