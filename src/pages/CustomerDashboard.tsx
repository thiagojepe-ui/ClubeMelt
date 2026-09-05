import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { Star, Gift, Loader2, MousePointerClick, Cookie, RotateCcw, LogOut } from "lucide-react";

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
  const [collectMessage, setCollectMessage] = useState<string | null>(null);
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
      window.location.replace(`/register/${customerInfo.businessId}`);
    }
  }, [customerInfo, customerPhone]);

  const handleCollect = async (loyaltyCardId: string) => {
    if (!customerId || !customerPhone || collectingCardId) return;
    setCollectingCardId(loyaltyCardId);
    setCollectMessage(null);
    try {
      const result = await revealNext({
        customerId: customerId as any,
        loyaltyCardId: loyaltyCardId as any,
        phone: customerPhone,
      });
      setCollectMessage(
        result.justCompleted
          ? `🎉 Cartão completo! Prêmio: ${result.rewardDescription}`
          : result.prize?.message || "Selo coletado!",
      );
    } catch (err: any) {
      setCollectMessage(err?.data?.message || err?.message || "Não foi possível coletar o selo");
    } finally {
      setCollectingCardId(null);
    }
  };

  const handleLogout = () => {
    if (customerId) localStorage.removeItem(`freebuff_customer_${customerId}`);
    if (customerInfo?.businessId) {
      window.location.replace(`/register/${customerInfo.businessId}`);
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

  // Pick the current batch: prefer one with pending stamps, otherwise most recent
  const currentBatch = batches.length > 0
    ? batches.find((b) => b.batchPending > 0) ?? batches[0]
    : null;

  // Total cycles completed — deduplicate by loyaltyCardId to avoid double-counting
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl clay-badge" style={{ background: `${brandColor}18` }}>
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
            style={{ background: `${brandColor}18`, boxShadow: `0 4px 12px ${brandColor}15` }}
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

          {/* Total cycles completed badge */}
          {totalCyclesCompleted > 0 && (
            <div className="mt-3">
              <div
                className="clay-badge px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
                style={{ background: `${brandColor}15`, color: brandColor }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {totalCyclesCompleted} cartão(ões) completo(s) — continue acumulando!
              </div>
            </div>
          )}

          {/* Reward card */}
          {currentBatch?.rewardDescription && (
            <div
              className="rounded-2xl p-5 text-center mt-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${brandColor}12, ${brandColor}06)`,
                border: `2px solid ${brandColor}25`,
              }}
            >
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white clay-badge"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`,
                  boxShadow: `0 4px 12px ${brandColor}30`,
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

        {/* Current card */}
        {currentBatch && (
          <CurrentCard
            batch={currentBatch}
            brandColor={brandColor}
            collecting={collectingCardId === currentBatch.loyaltyCardId}
            onCollect={() => handleCollect(currentBatch.loyaltyCardId)}
          />
        )}

        {collectMessage && (
          <div className="clay-badge mt-4 px-4 py-3 text-sm text-center font-semibold" style={{ color: brandColor, background: `${brandColor}15` }}>
            {collectMessage}
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl clay-badge"
            style={{
              background: `${cardBrandColor}18`,
              boxShadow: `0 3px 8px ${cardBrandColor}15`,
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
            <div className="clay-badge px-2 py-1 text-[10px] font-bold inline-flex items-center gap-1" style={{ background: `${cardBrandColor}15`, color: cardBrandColor }}>
              <RotateCcw className="w-3 h-3" />
              Ciclo {batch.cyclesCompleted + 1}
            </div>
          )}
        </div>

        {/* Progress bar */}
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

        {/* Stamp slots */}
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

        {/* Progress info */}
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
