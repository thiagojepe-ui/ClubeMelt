import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "react-router";
import { motion } from "framer-motion";
import { Star, Gift, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CustomerDashboard() {
  const { customerId } = useParams<{ customerId: string }>();

  const batches = useQuery(
    api.publicCustomers.getMyBatches,
    customerId ? { customerId: customerId as any } : "skip",
  );

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyLink = async (url: string, idx: number) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // silent
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

  if (!batches || batches.length === 0) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl bg-clay-peach" />
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-10 text-center max-w-sm relative z-10">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-xl font-bold mb-2">Nenhum carimbo ainda</h1>
          <p className="text-muted-foreground text-sm">
            Aguarde o estabelecimento enviar links para você coletar carimbos. Eles aparecerão aqui!
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl bg-clay-peach" />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <div className="max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Meus Carimbos</h1>
          <p className="text-muted-foreground text-sm">Acompanhe seus selos e prêmios</p>
        </motion.div>

        <div className="space-y-4">
          {batches.map((batch, idx) => {
            const brandColor = batch.brandColor || "var(--clay-orange)";
            const progress = batch.totalStamps > 0 ? (batch.totalRevealed / batch.totalStamps) * 100 : 0;

            return (
              <motion.div
                key={`${batch.loyaltyCardId}-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="clay-float p-6 relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 blur-3xl" style={{ background: brandColor }} />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl clay-badge" style={{ background: `${brandColor}18`, boxShadow: `0 3px 8px ${brandColor}15` }}>
                      {batch.logoEmoji || "🏪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{batch.businessName}</p>
                      <h3 className="font-bold text-base" style={{ color: brandColor }}>{batch.cardName}</h3>
                    </div>
                    {batch.completed && (
                      <div className="clay-badge px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700">
                        Completo!
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Progresso</span>
                      <span className="text-xs font-bold" style={{ color: brandColor }}>
                        {batch.totalRevealed}/{batch.totalStamps} selos
                      </span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${brandColor}, oklch(0.65 0.12 30))` }}
                      />
                    </div>
                  </div>

                  {/* Stamp slots */}
                  <div className="flex gap-1.5 my-4">
                    {Array.from({ length: Math.min(batch.totalStamps, 12) }).map((_, i) => {
                      const isRevealed = i < batch.totalRevealed;
                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            isRevealed
                              ? "stamp-slot-filled text-white"
                              : "stamp-slot-empty"
                          }`}
                          style={isRevealed ? { background: brandColor } : {}}
                        >
                          {isRevealed ? <Star className="w-3.5 h-3.5" /> : <span className="text-muted-foreground/30">{i + 1}</span>}
                        </div>
                      );
                    })}
                    {batch.totalStamps > 12 && (
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        +{batch.totalStamps - 12}
                      </span>
                    )}
                  </div>

                  {/* Reward info */}
                  {batch.rewardDescription && (
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-xl py-2 px-3 mb-3">
                      <Gift className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
                      <p className="text-xs font-semibold truncate">{batch.rewardDescription}</p>
                    </div>
                  )}

                  {/* Batch link */}
                  {batch.batchPending > 0 && (
                    <div className="bg-secondary/30 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-semibold">
                        Link para coletar ({batch.batchPending} restante{batch.batchPending > 1 ? 's' : ''})
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
                          {`${window.location.origin}/batch/${batch.batchToken}`}
                        </p>
                        <button
                          onClick={() => copyLink(`${window.location.origin}/batch/${batch.batchToken}`, idx)}
                          className="clay-button-secondary px-2 py-1 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                        >
                          {copiedIdx === idx ? <><Check className="w-2.5 h-2.5" /> OK</> : <><Copy className="w-2.5 h-2.5" /> Copiar</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {batch.batchPending === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Todos os carimbos deste lote foram coletados ✨
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
