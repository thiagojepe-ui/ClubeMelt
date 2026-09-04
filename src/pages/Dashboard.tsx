import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  CreditCard,
  Users,
  Stamp,
  LogOut,
  Plus,
  Search,
  ChevronRight,
  Gift,
  Settings,
  QrCode,
  Link,
  Copy,
  Check,
  Trash2,
  Edit3,
  UserPlus,
  Zap,
  Star,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

type DashboardView = "overview" | "setup" | "cards" | "customers" | "stamps";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<DashboardView>("overview");

  const business = useQuery(api.businesses.getByUser);
  const createBusiness = useMutation(api.businesses.create);
  const updateBusiness = useMutation(api.businesses.update);

  const [showSetup, setShowSetup] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizColor, setBizColor] = useState("#F28B50");
  const [bizEmoji, setBizEmoji] = useState("☕");
  const [saving, setSaving] = useState(false);

  const handleSaveBusiness = async () => {
    if (!bizName.trim()) return;
    setSaving(true);
    try {
      await createBusiness({ name: bizName, brandColor: bizColor, logoEmoji: bizEmoji });
      toast.success("Negócio criado com sucesso!");
      setShowSetup(false);
    } catch {
      toast.error("Erro ao salvar negócio");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (business === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
      </main>
    );
  }

  if (!business && !showSetup) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-lg flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="clay-card p-10 text-center"
          >
            <div className="text-5xl mb-4">🏪</div>
            <h1 className="text-2xl font-bold mb-2">Bem-vindo!</h1>
            <p className="text-muted-foreground mb-6">
              Configure seu negócio para começar a criar cartões fidelidade.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="clay-button bg-primary text-primary-foreground px-8 py-3 font-semibold text-base"
            >
              <Store className="w-5 h-5 inline mr-2" />
              Configurar meu negócio
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{business?.logoEmoji || "🏪"}</span>
            <span className="font-bold text-lg hidden sm:inline">{business?.name || "Carregando..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <NavButton
              icon={<Settings className="w-4 h-4" />}
              label="Negócio"
              active={showSetup}
              onClick={() => {
                if (business) {
                  setBizName(business.name);
                  setBizColor(business.brandColor || "#F28B50");
                  setBizEmoji(business.logoEmoji || "☕");
                }
                setShowSetup(true);
                setView("overview");
              }}
            />
            <button
              onClick={handleSignOut}
              className="clay-button-secondary p-2.5"
              title="Sair"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {showSetup ? (
            <BusinessSetup
              key="setup"
              name={bizName}
              color={bizColor}
              emoji={bizEmoji}
              onNameChange={setBizName}
              onColorChange={setBizColor}
              onEmojiChange={setBizEmoji}
              onSave={handleSaveBusiness}
              saving={saving}
              existing={!!business}
              onClose={() => setShowSetup(false)}
              onUpdate={async () => {
                if (!business) return;
                setSaving(true);
                try {
                  await updateBusiness({ name: bizName, brandColor: bizColor, logoEmoji: bizEmoji });
                  toast.success("Negócio atualizado!");
                  setShowSetup(false);
                } catch {
                  toast.error("Erro ao atualizar");
                }
                setSaving(false);
              }}
            />
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Quick Stats */}
              <QuickStats businessId={business!._id} />

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <ActionCard
                  icon={<CreditCard className="w-6 h-6" />}
                  title="Cartões Fidelidade"
                  description="Criar e gerenciar seus cartões"
                  color="bg-[oklch(0.82_0.08_240)]"
                  onClick={() => setView("cards")}
                />
                <ActionCard
                  icon={<Users className="w-6 h-6" />}
                  title="Clientes"
                  description="Cadastrar e buscar clientes"
                  color="bg-[oklch(0.85_0.07_160)]"
                  onClick={() => setView("customers")}
                />
                <ActionCard
                  icon={<Stamp className="w-6 h-6" />}
                  title="Carimbos"
                  description="Dar carimbos e acompanhar progresso"
                  color="bg-[oklch(0.88_0.06_50)]"
                  onClick={() => setView("stamps")}
                />
              </div>

              {/* Sub-views */}
              <AnimatePresence mode="wait">
                {view === "cards" && (
                  <CardsView key="cards" businessId={business!._id} brandColor={bizColor} />
                )}
                {view === "customers" && (
                  <CustomersView key="customers" businessId={business!._id} />
                )}
                {view === "stamps" && (
                  <StampsView key="stamps" businessId={business!._id} />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ─── Nav Button ─────────────────────────────────── */

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`clay-button-secondary p-2.5 ${active ? "ring-2 ring-primary/30" : ""}`}
      title={label}
    >
      {icon}
    </button>
  );
}

/* ─── Quick Stats ────────────────────────────────── */

function QuickStats({ businessId }: { businessId: string }) {
  const cards = useQuery(api.loyaltyCards.getByBusiness, { businessId: businessId as any });
  const customers = useQuery(api.customers.getAll, { businessId: businessId as any });
  const stamps = useQuery(api.stamps.getAllForBusiness, { businessId: businessId as any });

  const totalStampsGiven = stamps?.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={<CreditCard className="w-5 h-5 text-clay-blue" />}
        label="Cartões"
        value={cards?.length ?? "—"}
      />
      <StatCard
        icon={<Users className="w-5 h-5 text-[oklch(0.6_0.1_160)]" />}
        label="Clientes"
        value={customers?.length ?? "—"}
      />
      <StatCard
        icon={<Zap className="w-5 h-5 text-clay-orange" />}
        label="Carimbos"
        value={totalStampsGiven}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="clay-card p-4 flex flex-col items-center gap-1">
      {icon}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/* ─── Action Card ────────────────────────────────── */

function ActionCard({
  icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="clay-card p-6 text-left w-full"
    >
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white mb-3 clay-badge`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.button>
  );
}

/* ─── Business Setup ─────────────────────────────── */

function BusinessSetup({
  name,
  color,
  emoji,
  onNameChange,
  onColorChange,
  onEmojiChange,
  onSave,
  saving,
  existing,
  onClose,
  onUpdate,
}: {
  name: string;
  color: string;
  emoji: string;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onEmojiChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  existing: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const emojis = ["☕", "🍕", "🧁", "🌮", "💈", "💅", "🏋️", "🐕", "📚", "🎨", "🌸", "🎸"];
  const colors = ["#F28B50", "#E88D67", "#D4A574", "#7CB69D", "#6BAED6", "#9B8EC4", "#C77DBA", "#E8A87C"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="clay-card p-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {existing ? "Editar negócio" : "Configure seu negócio"}
          </h2>
          {existing && (
            <button onClick={onClose} className="clay-button-secondary p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Emoji picker */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Ícone do negócio</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => onEmojiChange(e)}
                  className={`stamp-slot text-xl ${
                    emoji === e ? "stamp-slot-filled" : "stamp-slot-empty"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Nome do negócio</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Padaria do João"
              className="clay-input w-full px-4 py-3 text-base"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Cor da marca</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                  }`}
                  style={{ background: c }}
                />
              ))}
              <label className="w-10 h-10 rounded-xl clay-input flex items-center justify-center cursor-pointer overflow-hidden">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </label>
            </div>
          </div>

          <button
            onClick={existing ? onUpdate : onSave}
            disabled={!name.trim() || saving}
            className="clay-button bg-primary text-primary-foreground px-8 py-3 font-semibold w-full text-base disabled:opacity-50"
          >
            {saving ? "Salvando..." : existing ? "Salvar alterações" : "Começar"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Cards View ─────────────────────────────────── */

function CardsView({ businessId }: { businessId: string; brandColor: string }) {
  const cards = useQuery(api.loyaltyCards.getByBusiness, { businessId: businessId as any });
  const createCard = useMutation(api.loyaltyCards.create);
  const removeCard = useMutation(api.loyaltyCards.remove);

  const [showCreate, setShowCreate] = useState(false);
  const [cardName, setCardName] = useState("");
  const [totalStamps, setTotalStamps] = useState(8);
  const [rewardDesc, setRewardDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [stampPrizes, setStampPrizes] = useState<
    { message: string; isPrize: boolean }[]
  >([]);

  const handleCreate = async () => {
    if (!cardName.trim() || !rewardDesc.trim()) return;
    setCreating(true);
    try {
      // Auto-generate prizes if empty
      const prizes =
        stampPrizes.length === totalStamps
          ? stampPrizes
          : Array.from({ length: totalStamps }, (_, i) => {
              const existing = stampPrizes[i];
              if (existing) return existing;
              return {
                message: i === totalStamps - 1 ? "Recompensa desbloqueada!" : "Continue juntando!",
                isPrize: i === totalStamps - 1,
              };
            });
      await createCard({
        businessId: businessId as any,
        cardName,
        totalStamps,
        rewardDescription: rewardDesc,
        stampPrizes: prizes,
      });
      toast.success("Cartão criado!");
      setShowCreate(false);
      setCardName("");
      setRewardDesc("");
      setTotalStamps(8);
      setStampPrizes([]);
    } catch {
      toast.error("Erro ao criar cartão");
    }
    setCreating(false);
  };

  const updatePrize = (index: number, message: string, isPrize: boolean) => {
    const newPrizes = [...stampPrizes];
    newPrizes[index] = { message, isPrize };
    setStampPrizes(newPrizes);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Cartões Fidelidade</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="clay-button bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo cartão
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="clay-card p-6 mb-4"
          >
            <h3 className="font-bold mb-4">Criar novo cartão</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Nome do cartão</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Ex: Cartão Café"
                  className="clay-input w-full px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">
                  Quantidade de carimbos
                </label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={totalStamps}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 8;
                    setTotalStamps(val);
                    // Reset prizes when stamp count changes
                    setStampPrizes([]);
                  }}
                  className="clay-input w-full px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Recompensa final</label>
                <input
                  type="text"
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  placeholder="Ex: 1 café grátis"
                  className="clay-input w-full px-4 py-3"
                />
              </div>

              {/* Prize configuration */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Prêmios de cada carimbo (opcional)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Configure o que cada carimbo revela quando o cliente coleta. Se deixar vazio, será um carimbo padrão.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from({ length: totalStamps }).map((_, i) => {
                    const prize = stampPrizes[i];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground w-6 text-center shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={prize?.message ?? ""}
                          onChange={(e) =>
                            updatePrize(i, e.target.value, prize?.isPrize ?? i === totalStamps - 1)
                          }
                          placeholder={
                            i === totalStamps - 1
                              ? "Mensagem da recompensa"
                              : "Ex: 10% de desconto, Continue..."
                          }
                          className="clay-input flex-1 px-3 py-2 text-sm"
                        />
                        <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prize?.isPrize ?? (i === totalStamps - 1)}
                            onChange={(e) => {
                              const newPrizes = [...stampPrizes];
                              newPrizes[i] = {
                                message: prize?.message ?? "",
                                isPrize: e.target.checked,
                              };
                              setStampPrizes(newPrizes);
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-[10px] text-muted-foreground">Premio</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!cardName.trim() || !rewardDesc.trim() || creating}
                  className="clay-button bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex-1"
                >
                  {creating ? "Criando..." : "Criar cartão"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="clay-button-secondary px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!cards || cards.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Crie seu primeiro cartão fidelidade para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <LoyaltyCardItem
              key={card._id}
              card={card}
              onDelete={async () => {
                await removeCard({ loyaltyCardId: card._id });
                toast.success("Cartão removido");
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LoyaltyCardItem({
  card,
  onDelete,
  onEdit,
}: {
  card: {
    _id: string;
    cardName: string;
    totalStamps: number;
    rewardDescription: string;
    isActive: boolean;
    stampPrizes?: { message: string; isPrize: boolean }[];
  };
  onDelete: () => void;
  onEdit: () => void;
}) {
  const hasPrizes = card.stampPrizes && card.stampPrizes.length > 0;
  const prizeCount = card.stampPrizes?.filter((p) => p.isPrize).length ?? 0;

  return (
    <div className="clay-card p-5 relative">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-base">{card.cardName}</h3>
          <p className="text-sm text-muted-foreground">
            {card.totalStamps} carimbos · {card.rewardDescription}
          </p>
        </div>
        <span
          className={`clay-badge px-2 py-0.5 text-xs font-semibold ${
            card.isActive
              ? "bg-[oklch(0.85_0.07_160)] text-[oklch(0.3_0.05_160)]"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {card.isActive ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* Stamp preview with prizes */}
      <div className="flex gap-1.5 my-3">
        {Array.from({ length: Math.min(card.totalStamps, 12) }).map((_, i) => {
          const prize = card.stampPrizes?.[i];
          return (
            <div
              key={i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                prize?.isPrize ? "stamp-slot-reward" : "stamp-slot-empty"
              }`}
              title={prize?.message || `Carimbo ${i + 1}`}
            >
              {!prize?.isPrize && <span className="text-muted-foreground/30">{i + 1}</span>}
              {prize?.isPrize && <Star className="w-3 h-3" />}
            </div>
          );
        })}
        {card.totalStamps > 12 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            +{card.totalStamps - 12}
          </span>
        )}
      </div>

      {hasPrizes && (
        <p className="text-xs text-muted-foreground mb-3">
          {prizeCount} prêmio(s) configurado(s) · Cliente revela a cada coleta
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onEdit}
          className="clay-button-secondary px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="ml-auto clay-button-secondary p-2 text-destructive"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Customers View ─────────────────────────────── */

function CustomersView({ businessId }: { businessId: string }) {
  const allCustomers = useQuery(api.customers.getAll, { businessId: businessId as any });
  const searchCustomers = useQuery(api.customers.search, {
    businessId: businessId as any,
    searchTerm: "",
  });
  const upsertCustomer = useMutation(api.customers.upsert);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  // Local search filter
  const filteredCustomers = useMemo(() => {
    const list = allCustomers ?? [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term.replace(/\D/g, ""))),
    );
  }, [allCustomers, searchTerm]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await upsertCustomer({
        businessId: businessId as any,
        name: newName,
        phone: newPhone || undefined,
      });
      toast.success("Cliente cadastrado!");
      setShowAdd(false);
      setNewName("");
      setNewPhone("");
    } catch {
      toast.error("Erro ao cadastrar cliente");
    }
    setAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Clientes</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="clay-button bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="clay-input w-full pl-10 pr-4 py-3"
        />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="clay-card p-6 mb-4"
          >
            <h3 className="font-bold mb-4">Cadastrar cliente</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Nome</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="clay-input w-full px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Telefone (opcional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="clay-input w-full px-4 py-3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || adding}
                  className="clay-button bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex-1"
                >
                  {adding ? "Cadastrando..." : "Cadastrar"}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="clay-button-secondary px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredCustomers.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchTerm
              ? "Nenhum cliente encontrado com essa busca."
              : "Cadastre seu primeiro cliente para começar."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="clay-card p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "var(--clay-orange)" }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{customer.name}</p>
                {customer.phone && (
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Stamps View ────────────────────────────────── */

function StampsView({ businessId }: { businessId: string }) {
  const cards = useQuery(api.loyaltyCards.getByBusiness, { businessId: businessId as any });
  const customers = useQuery(api.customers.getAll, { businessId: businessId as any });
  const stampData = useQuery(api.stampGrants.getStampsByCustomer, { businessId: businessId as any });
  const createStamps = useMutation(api.stampGrants.createStamps);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [stampCount, setStampCount] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const filteredCustomers = useMemo(() => {
    const list = customers ?? [];
    if (!customerSearch.trim()) return list;
    const term = customerSearch.toLowerCase().trim();
    return list.filter(
      (c) => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term.replace(/\D/g, ""))),
    );
  }, [customers, customerSearch]);

  const handleCreate = async () => {
    if (!selectedCard || !selectedCustomer || stampCount < 1) return;
    setCreating(true);
    try {
      const result = await createStamps({
        loyaltyCardId: selectedCard as any,
        customerId: selectedCustomer as any,
        count: stampCount,
      });
      const url = `${window.location.origin}/batch/${result.batchToken}`;
      setGeneratedLink(url);
      toast.success(`Link para ${stampCount} carimbo(s) gerado!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Erro ao gerar link");
    }
    setCreating(false);
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedLink);
      } else {
        const ta = document.createElement("textarea");
        ta.value = generatedLink;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setStampCount(1);
    setGeneratedLink(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-6">
      <h2 className="text-lg font-bold mb-4">Gerar Links de Carimbo</h2>

      {/* Step 1: Select card */}
      <div className="clay-card p-5 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">1 · Escolha o cartão</p>
        {!cards || cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie um cartão fidelidade primeiro.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cards.filter((c) => c.isActive).map((card) => (
              <button key={card._id} onClick={() => { setSelectedCard(card._id); resetForm(); }} className={`clay-badge px-4 py-2.5 text-sm font-semibold transition-all ${selectedCard === card._id ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {card.cardName} <span className="ml-1 text-xs opacity-70">({card.totalStamps} selos)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Search and select customer */}
      {selectedCard && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">2 · Busque o cliente</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="clay-input w-full pl-10 pr-4 py-3" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {filteredCustomers.map((customer) => (
              <button key={customer._id} onClick={() => { setSelectedCustomer(customer._id); setGeneratedLinks([]); }} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedCustomer === customer._id ? "bg-primary/10 ring-2 ring-primary/30" : "hover:bg-secondary/50"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--clay-orange)" }}>{customer.name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0"><p className="font-semibold text-sm truncate">{customer.name}</p>{customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}</div>
                {selectedCustomer === customer._id && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </button>
            ))}
            {filteredCustomers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{customerSearch ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>}
          </div>
        </motion.div>
      )}

      {/* Step 3: Set count and generate */}
      {selectedCard && selectedCustomer && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">3 · Quantos carimbos?</p>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setStampCount(Math.max(1, stampCount - 1)); setGeneratedLinks([]); }} className="clay-button-secondary w-10 h-10 text-lg font-bold flex items-center justify-center">−</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold">{stampCount} <span className="text-sm font-normal text-muted-foreground">carimbo(s)</span></p>
            </div>
            <button onClick={() => { setStampCount(stampCount + 1); setGeneratedLinks([]); }} className="clay-button-secondary w-10 h-10 text-lg font-bold flex items-center justify-center">+</button>
          </div>
          <button onClick={handleCreate} disabled={creating} className="clay-button bg-primary text-primary-foreground w-full py-3 font-semibold text-base flex items-center justify-center gap-2">
            {creating ? "Gerando..." : <><Link className="w-5 h-5" /> Gerar link ({stampCount} carimbo{stampCount > 1 ? 's' : ''})</>}
          </button>
        </motion.div>
      )}

      {/* Generated link */}
      {generatedLink && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Link gerado — cliente coleta 1 por vez</p>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{generatedLink}</p>
            <button onClick={copyLink} className="clay-button-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shrink-0">
              {copiedLink ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Envie este link ao cliente. Ele clica uma vez para cada carimbo.</p>
        </motion.div>
      )}

      {/* Existing stamps overview */}
      {stampData && stampData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-muted-foreground mb-3">Carimbos já gerados</h3>
          <div className="space-y-2">
            {stampData.map((entry) => (
              <div key={entry.customer._id} className="clay-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--clay-orange)" }}>{entry.customer.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1"><p className="font-semibold text-sm">{entry.customer.name}</p><p className="text-xs text-muted-foreground">{entry.cardName}</p></div>
                  <div className="text-right"><p className="text-sm font-bold" style={{ color: "var(--clay-orange)" }}>{entry.revealedCount}/{entry.totalStamps}</p><p className="text-[10px] text-muted-foreground">coletados</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.unrevealedCount > 0 && <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">{entry.unrevealedCount} link(s) pendente(s)</span>}
                  {entry.revealedCount >= entry.totalStamps && <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700">Completo!</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
