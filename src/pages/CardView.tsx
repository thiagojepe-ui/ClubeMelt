import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Gift,
  PartyPopper,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  Trophy,
  ChevronRight,
} from "lucide-react";

type CardPhase = "loading" | "register" | "card";

export default function CardView() {
  const { cardId } = useParams<{ cardId: string }>();

  const data = useQuery(
    api.loyaltyCards.getPublic,
    cardId ? { loyaltyCardId: cardId as any } : "skip",
  );

  const [phase, setPhase] = useState<CardPhase>("loading");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Set business ID when data loads
  useEffect(() => {
    if (data?.business) {
      setBusinessId(data.business._id);
    }
  }, [data?.business]);

  // Check if customer already registered via localStorage
  useEffect(() => {
    if (!businessId || !cardId) return;
    const key = `fideliza_customer_${businessId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCustomerId(parsed.customerId);
      setCustomerName(parsed.name);
      setPhase("card");
    } else {
      setPhase("register");
    }
  }, [businessId, cardId]);

  const registerCustomer = useMutation(api.publicCustomers.register);

  const handleRegister = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !businessId) return;
    try {
      const customer = await registerCustomer({
        businessId: businessId as any,
        name: customerName.trim(),
        phone: customerPhone.trim(),
      });
      if (customer && customer._id) {
        setCustomerId(customer._id);
        localStorage.setItem(
          `fideliza_customer_${businessId}`,
          JSON.stringify({
            customerId: customer._id,
            name: customerName,
          }),
        );
        setPhase("card");
      }
    } catch {
      // Registration failed — silently retry
    }
  };

  const brandColor = data?.business?.brandColor || "var(--clay-orange)";

  // ─── Loading ───
  if (!cardId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Cartão não encontrado.</p>
        </div>
      </main>
    );
  }

  if (!data || phase === "loading") {
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
          <p className="text-muted-foreground">
            Este cartão não existe ou foi desativado.
          </p>
        </div>
      </main>
    );
  }

  // ─── Register Phase ───
  if (phase === "register") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        {/* Decorative blobs */}
        <div
          className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: brandColor }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Business branding */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl clay-badge"
              style={{
                background: `${brandColor}18`,
                boxShadow: `0 4px 12px ${brandColor}15`,
              }}
            >
              {business.logoEmoji || "🏪"}
            </motion.div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-muted-foreground mt-1">
              Cadastre-se para coletar seus carimbos
            </p>
          </div>

          {/* Registration form */}
          <div className="clay-card p-8">
            <h2 className="text-lg font-bold mb-1">Bem-vindo!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Informe seus dados para começar a coletar carimbos e ganhar
              recompensas.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  Seu nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    className="clay-input w-full pl-10 pr-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  Seu telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="clay-input w-full pl-10 pr-4 py-3"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        customerName.trim() &&
                        customerPhone.trim()
                      ) {
                        handleRegister();
                      }
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={!customerName.trim() || !customerPhone.trim()}
                className="clay-button w-full py-3.5 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: brandColor,
                  color: "white",
                }}
              >
                Começar a coletar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  // ─── Card Phase (revealed & registered) ───
  return (
    <CardPhase
      cardId={cardId}
      customerId={customerId!}
      card={card}
      business={business}
      brandColor={brandColor}
      customerName={customerName}
    />
  );
}

/* ─── Card Phase Component ─────────────────────────── */

function CardPhase({
  cardId,
  customerId,
  card,
  business,
  brandColor,
  customerName,
}: {
  cardId: string;
  customerId: string;
  card: any;
  business: any;
  brandColor: string;
  customerName: string;
}) {
  const stampData = useQuery(
    api.publicCustomers.getMyStamps,
    customerId
      ? {
          customerId: customerId as any,
          loyaltyCardId: cardId as any,
        }
      : "skip",
  );

  const revealStamp = useMutation(api.publicCustomers.revealStamp);

  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);
  const [lastReveal, setLastReveal] = useState<any>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const handleReveal = useCallback(
    async (index: number) => {
      if (revealingIndex !== null || !customerId) return;
      setRevealingIndex(index);

      // Short delay for animation
      await new Promise((r) => setTimeout(r, 300));

      try {
        const result = await revealStamp({
          customerId: customerId as any,
          loyaltyCardId: cardId as any,
        });
        setLastReveal(result);
        setShowPrizeModal(true);

        if (result.completed) {
          setCelebrating(true);
        }
      } catch {
        setRevealingIndex(null);
      }
    },
    [customerId, cardId, revealingIndex],
  );

  const totalRevealed = stampData?.totalRevealed ?? 0;
  const totalStamps = stampData?.totalStamps ?? card.totalStamps;
  const completed = stampData?.completed ?? false;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-md mx-auto">
        {/* Business header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl clay-badge"
            style={{
              background: `${brandColor}18`,
              boxShadow: `0 3px 10px ${brandColor}12`,
            }}
          >
            {business.logoEmoji || "🏪"}
          </div>
          <h1 className="text-xl font-bold">{business.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Olá, {customerName}!
          </p>
        </motion.div>

        {/* Card body */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="clay-float p-7 mb-6 relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl"
            style={{ background: brandColor }}
          />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />

          <div className="relative z-10">
            {/* Card title */}
            <div className="text-center mb-5">
              <h2
                className="text-lg font-bold"
                style={{ color: brandColor }}
              >
                {card.cardName}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Toque nos selos para descobrir seu prêmio!
              </p>
            </div>

            {/* Stamp grid */}
            <div className="grid grid-cols-5 gap-3 mb-5">
              {Array.from({ length: totalStamps }).map((_, i) => {
                const isRevealed = i < totalRevealed;
                const isCurrent = i === totalRevealed && !completed;
                const isRevealing = revealingIndex === i;

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.04, type: "spring" }}
                    whileTap={!isRevealed && isCurrent && !completed ? { scale: 0.9 } : {}}
                    onClick={() => {
                      if (!isRevealed && isCurrent && !completed) {
                        handleReveal(i);
                      }
                    }}
                    disabled={isRevealed || !isCurrent || completed || isRevealing}
                    className="relative w-full aspect-square"
                  >
                    {/* Unrevealed stamp — always mounted, hidden when revealed */}
                    <div
                      className={`stamp-slot w-full h-full absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
                        isCurrent && !completed
                          ? "stamp-slot-empty cursor-pointer hover:scale-105"
                          : "stamp-slot-empty opacity-40"
                      } ${isRevealing ? "animate-pulse" : ""}`}
                      style={
                        isCurrent && !completed
                          ? {
                              borderColor: `${brandColor}40`,
                              boxShadow: `0 0 0 2px ${brandColor}15, inset 0 2px 4px oklch(0.7 0.01 90 / 0.1)`,
                            }
                          : {}
                      }
                      hidden={isRevealed}
                    >
                      {isRevealing ? (
                        <Sparkles
                          className="w-4 h-4 animate-spin"
                          style={{ color: brandColor }}
                        />
                      ) : isCurrent && !completed ? (
                        <>
                          <span className="text-lg font-bold" style={{ color: brandColor }}>
                            ?
                          </span>
                          <span className="text-[8px] text-muted-foreground mt-0.5">
                            toque
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/30 text-sm font-bold">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Revealed stamp — always mounted, hidden when unrevealed */}
                    <div
                      className="stamp-slot stamp-slot-filled w-full h-full absolute inset-0 flex flex-col items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`,
                        boxShadow: `0 2px 0 0 oklch(0.6 0.1 30 / 0.8), 0 4px 8px -1px ${brandColor}30`,
                        borderColor: "transparent",
                      }}
                      hidden={!isRevealed}
                    >
                      <Star className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Progresso
                </span>
                <span className="text-xs font-bold" style={{ color: brandColor }}>
                  {totalRevealed}/{totalStamps}
                </span>
              </div>
              <div className="clay-progress-track h-3 w-full">
                <motion.div
                  className="clay-progress-fill h-full"
                  style={{
                    background: `linear-gradient(90deg, ${brandColor}, oklch(0.72 0.14 30))`,
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(totalRevealed / totalStamps) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward target */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="clay-card p-6 text-center"
        >
          {completed ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <h3 className="font-bold text-lg mb-1">Parabéns!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Você completou todos os carimbos!
              </p>
              <div
                className="clay-badge px-5 py-3 inline-flex items-center gap-2"
                style={{
                  background: `${brandColor}15`,
                  color: brandColor,
                }}
              >
                <Trophy className="w-5 h-5" />
                <span className="font-bold">{card.rewardDescription}</span>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white clay-badge"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, oklch(0.65 0.12 30))`,
                  boxShadow: `0 3px 10px ${brandColor}30`,
                }}
              >
                <Gift className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Sua recompensa
              </p>
              <p className="text-lg font-bold">{card.rewardDescription}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Complete {totalStamps} carimbos para desbloquear
              </p>
            </>
          )}
        </motion.div>

        {/* Prize reveal modal */}
        <AnimatePresence>
          {showPrizeModal && lastReveal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={() => {
                setShowPrizeModal(false);
                setRevealingIndex(null);
                setLastReveal(null);
              }}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

              {/* Modal */}
              <motion.div
                initial={{ scale: 0.5, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="clay-float p-8 text-center relative z-10 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative */}
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl"
                  style={{ background: brandColor }}
                />

                <div className="relative z-10">
                  {lastReveal.prize?.isPrize ? (
                    <>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.1,
                        }}
                        className="text-5xl mb-3"
                      >
                        🎁
                      </motion.div>
                      <div
                        className="clay-badge px-3 py-1 text-xs font-semibold mb-3"
                        style={{
                          background: `${brandColor}15`,
                          color: brandColor,
                        }}
                      >
                        Prêmio!
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                        className="text-5xl mb-3"
                      >
                        ⭐
                      </motion.div>
                    </>
                  )}

                  <h3 className="text-xl font-bold mb-2">
                    {lastReveal.prize?.isPrize
                      ? "Parabéns!"
                      : "Selo coletado!"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                    {lastReveal.prize?.message || "Carimbo coletado!"}
                  </p>

                  {lastReveal.completed ? (
                    <div className="space-y-3">
                      <div className="clay-badge px-4 py-2.5 inline-flex items-center gap-2 bg-primary text-primary-foreground">
                        <PartyPopper className="w-4 h-4" />
                        <span className="font-bold text-sm">
                          Recompensa desbloqueada!
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: brandColor }}>
                        {lastReveal.rewardDescription}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Faltam {lastReveal.totalStamps - lastReveal.totalRevealed}{" "}
                      carimbo(s)
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setShowPrizeModal(false);
                      setRevealingIndex(null);
                      setLastReveal(null);
                    }}
                    className="clay-button px-6 py-2.5 text-sm font-semibold mt-5"
                    style={{
                      background: brandColor,
                      color: "white",
                    }}
                  >
                    {lastReveal.completed ? "Ver recompensa" : "Continuar"}
                    <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
