import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "react-router";
import { Star, Gift, Loader2, MousePointerClick, Cookie, RotateCcw } from "lucide-react";

export default function CustomerDashboard() {
  const { customerId } = useParams<{ customerId: string }>();

  const batches = useQuery(
    api.publicCustomers.getMyBatches,
    customerId ? { customerId: customerId as any } : "skip",
  );

  const customerInfo = useQuery(
    api.publicCustomers.getCustomerPublic,
    customerId ? { customerId: customerId as any } : "skip",
  );

  if (!customerId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Link inválido.</p>
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

  // Total cycles completed across all cards
  const totalCyclesCompleted = batches.reduce((sum, b) => sum + b.cyclesCompleted, 0);

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
            Aguarde o estabelecimento enviar links para você coletar carimbos. Eles aparecerão aqui!
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
        </div>

        {/* Current card */}
        {currentBatch && (
          <CurrentCard batch={currentBatch} brandColor={brandColor} />
        )}
      </div>
    </main>
  );
}

/* ─── Current Card Component ────────────────────── */

function CurrentCard({
  batch,
  brandColor,
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

        {/* Reward info */}
        {batch.rewardDescription && (
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl py-2 px-3 mb-3">
            <Gift className="w-4 h-4 shrink-0" style={{ color: cardBrandColor }} />
            <p className="text-xs font-semibold truncate">{batch.rewardDescription}</p>
          </div>
        )}

        {/* Collect action */}
        {batch.batchPending > 0 && (
          <a
            href={`/batch/${batch.batchToken}`}
            className="clay-button w-full py-3 font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: cardBrandColor, color: "white" }}
          >
            <MousePointerClick className="w-4 h-4" />
            Coletar carimbo{batch.batchPending > 1 ? "s" : ""}{" "}
            ({batch.batchPending} restante{batch.batchPending > 1 ? "s" : ""})
          </a>
        )}

        {batch.batchPending === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {batch.cyclesCompleted > 0
              ? "Lote completo — aguarde novos links para continuar ✨"
              : "Todos os carimbos deste lote foram coletados ✨"
            }
          </p>
        )}
      </div>
    </div>
  );
}
