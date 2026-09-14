import { api } from "@/convex/_generated/api";
import CookieLogo from "@/components/CookieLogo";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Users,
  Stamp,
  LogOut,
  Plus,
  Search,
  Link,
  Copy,
  Check,
  Trash2,
  Edit3,
  UserPlus,
  Zap,
  Star,
  Loader2,
  Gift,
  Package,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type DashboardView = "overview" | "setup" | "cards" | "customers" | "stamps" | "prizes";

/* Shared clipboard helper — uses execCommand fallback for iframe contexts */
async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy fallback
  }
  try {
    // Use a detached container to avoid touching document.body
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-9999px;opacity:0;pointer-events:none";
    const container = document.createDocumentFragment();
    container.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    // Fragment children are cleaned up automatically when collected
    return ok;
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const { signOut, admin } = useAuth();
  const [view, setView] = useState<DashboardView>("overview");

  const business = useQuery(api.businesses.getByUser);
  const syncUser = useMutation(api.admins.syncUser);

  // Re-link business on mount: fixes data loss after logout/login when the
  // anonymous Convex user changes. syncUser migrates the business to the new
  // user and creates one if it doesn't exist.
  useEffect(() => {
    if (admin && (business === null || business === undefined)) {
      syncUser({ adminId: admin.adminId }).catch((err) => {
        console.error("syncUser failed:", err);
      });
    }
  }, [admin, business, syncUser]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  if (business === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
      </main>
    );
  }

  if (business === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse text-muted-foreground text-sm">Configurando sua conta...</div>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-2xl flex items-center justify-center clay-badge"
              style={{ background: "oklch(0.93 0.05 60)" }}
            >
              <CookieLogo size={26} />
            </span>
            <span className="font-bold text-lg hidden sm:inline">
              {business.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              {/* Quick Stats */}
              <QuickStats businessId={business._id} />

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
                <ActionCard
                  icon={<Gift className="w-6 h-6" />}
                  title="Prêmios"
                  description="Controlar envio de prêmios"
                  color="bg-[oklch(0.85_0.1_340)]"
                  onClick={() => setView("prizes")}
                />
              </div>

              {/* Sub-views */}
              {view === "cards" && (
                <CardsView businessId={business._id} brandColor={business.brandColor || "#B5651D"} />
              )}
              {view === "customers" && (
                <CustomersView businessId={business._id} />
              )}
              {view === "stamps" && (
                <StampsView businessId={business._id} />
              )}
              {view === "prizes" && (
                <PrizeRedemptionsView businessId={business._id} />
              )}
      </div>
    </main>
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

/* ─── Cards View ─────────────────────────────────── */

function CardsView({ businessId }: { businessId: string; brandColor: string }) {
  const cards = useQuery(api.loyaltyCards.getByBusiness, { businessId: businessId as any });
  const createCard = useMutation(api.loyaltyCards.create);
  const removeCard = useMutation(api.loyaltyCards.remove);
  const updateCard = useMutation(api.loyaltyCards.update);

  const [showCreate, setShowCreate] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
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
      resetForm();
    } catch {
      toast.error("Erro ao criar cartão");
    }
    setCreating(false);
  };

  const resetForm = () => {
    setCardName("");
    setRewardDesc("");
    setTotalStamps(8);
    setStampPrizes([]);
    setEditingCard(null);
    setShowCreate(false);
  };

  const handleEdit = (card: any) => {
    setEditingCard(card._id);
    setCardName(card.cardName);
    setTotalStamps(card.totalStamps);
    setRewardDesc(card.rewardDescription);
    setStampPrizes(card.stampPrizes || []);
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!editingCard || !cardName.trim() || !rewardDesc.trim()) return;
    setCreating(true);
    try {
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
      await updateCard({
        loyaltyCardId: editingCard as any,
        cardName,
        totalStamps,
        rewardDescription: rewardDesc,
        isActive: true,
        stampPrizes: prizes,
      });
      toast.success("Cartão atualizado!");
      resetForm();
    } catch {
      toast.error("Erro ao atualizar cartão");
    }
    setCreating(false);
  };

  const updatePrize = (index: number, message: string, isPrize: boolean) => {
    const newPrizes = [...stampPrizes];
    newPrizes[index] = { message, isPrize };
    setStampPrizes(newPrizes);
  };

  const formTitle = editingCard ? "Editar cartão" : "Criar novo cartão";

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
          onClick={() => { setEditingCard(null); setShowCreate(!showCreate); }}
          className="clay-button bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo cartão
        </button>
      </div>

      {(showCreate || editingCard) && (
          <div
            className="clay-card p-6 mb-4"
          >
            <h3 className="font-bold mb-4">{formTitle}</h3>
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
                  onClick={editingCard ? handleUpdate : handleCreate}
                  disabled={!cardName.trim() || !rewardDesc.trim() || creating}
                  className="clay-button bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex-1"
                >
                  {creating ? (editingCard ? "Salvando..." : "Criando...") : (editingCard ? "Salvar alterações" : "Criar cartão")}
                </button>
                <button
                  onClick={resetForm}
                  className="clay-button-secondary px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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
              onEdit={() => handleEdit(card)}
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
  const upsertCustomer = useMutation(api.customers.upsert);
  const updateCustomer = useMutation(api.customers.update);
  const removeCustomer = useMutation(api.customers.remove);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedReg, setCopiedReg] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const registerUrl = `${window.location.origin}/clube`;

  const handleCopyRegister = async () => {
    const ok = await copyTextToClipboard(registerUrl);
    if (ok) {
      setCopiedReg(true);
      toast.success("Link de cadastro copiado!");
      setTimeout(() => setCopiedReg(false), 2000);
    } else {
      toast.error("Erro ao copiar link");
    }
  };

  // Local search filter
  const filteredCustomers = useMemo(() => {
    const list = allCustomers ?? [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    const digitsOnly = term.replace(/\D/g, "");
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (digitsOnly.length > 0 && c.phone && c.phone.includes(digitsOnly)),
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

  const startEdit = (customer: { _id: string; name: string; phone?: string }) => {
    setEditingId(customer._id);
    setEditName(customer.name);
    setEditPhone(customer.phone ?? "");
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setSavingId(editingId);
    try {
      await updateCustomer({
        customerId: editingId as any,
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      toast.success("Cliente atualizado!");
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Erro ao atualizar cliente");
    }
    setSavingId(null);
  };

  const handleDelete = async (customerId: string) => {
    if (confirmDeleteId !== customerId) {
      setConfirmDeleteId(customerId);
      return;
    }
    setSavingId(customerId);
    try {
      await removeCustomer({ customerId: customerId as any });
      toast.success("Cliente removido");
      setConfirmDeleteId(null);
      if (editingId === customerId) cancelEdit();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Erro ao remover cliente");
    }
    setSavingId(null);
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

      {/* Registration link */}
      <div className="clay-card p-5 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Cliente se cadastra sozinho
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Este é o único link do cliente: cadastro, login, selos e prêmios.
        </p>
        <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
          <p className="text-[11px] text-muted-foreground break-all flex-1 font-mono leading-relaxed">{registerUrl}</p>
          <button
            onClick={handleCopyRegister}
            className="clay-button-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            {copiedReg ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
          </button>
        </div>
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

      {showAdd && (
          <div
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
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Cadastrar"
                  )}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="clay-button-secondary px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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
          {filteredCustomers.map((customer) => {
            const isNew = Date.now() - customer.createdAt < 24 * 60 * 60 * 1000;
            return (
            <div key={customer._id} className={`clay-card p-4 ${isNew ? "ring-2 ring-[oklch(0.85_0.1_50)] bg-[oklch(0.97_0.04_50)]" : ""}`}>
              {editingId === customer._id ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Editar cliente</h3>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="clay-input w-full px-4 py-2.5 text-sm"
                  />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Telefone (opcional)"
                    className="clay-input w-full px-4 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ao alterar o telefone, o cliente deverá entrar novamente com o novo número.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={!editName.trim() || savingId === customer._id}
                      className="clay-button bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold flex-1"
                    >
                      {savingId === customer._id ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="clay-button-secondary px-4 py-2 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "var(--clay-orange)" }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{customer.name}</p>
                      {isNew && (
                        <span className="clay-badge px-1.5 py-0.5 text-[9px] font-bold inline-flex items-center gap-0.5 bg-[oklch(0.88_0.12_50)] text-[oklch(0.35_0.12_50)]">
                          NOVO
                        </span>
                      )}
                    </div>
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    )}
                  </div>
                  {confirmDeleteId === customer._id ? (
                    <span className="text-[11px] text-destructive font-semibold shrink-0">
                      Clique de novo para confirmar
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                      Usa o link único acima
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(customer)}
                      className="clay-button-secondary p-2"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      disabled={savingId === customer._id}
                      className={`clay-button-secondary p-2 ${
                        confirmDeleteId === customer._id
                          ? "bg-destructive/10 ring-1 ring-destructive/30"
                          : ""
                      } text-destructive`}
                      title={confirmDeleteId === customer._id ? "Confirmar exclusão" : "Excluir"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
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
      await createStamps({
        loyaltyCardId: selectedCard as any,
        customerId: selectedCustomer as any,
        count: stampCount,
      });
      const url = `${window.location.origin}/clube`;
      setGeneratedLink(url);
      toast.success(`${stampCount} carimbo(s) adicionado(s) ao cliente!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Erro ao gerar link");
    }
    setCreating(false);
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    const ok = await copyTextToClipboard(generatedLink);
    if (ok) {
      setCopiedLink(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
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
      <h2 className="text-lg font-bold mb-4">Adicionar selos</h2>

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
              <button key={customer._id} onClick={() => { setSelectedCustomer(customer._id); setGeneratedLink(null); }} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedCustomer === customer._id ? "bg-primary/10 ring-2 ring-primary/30" : "hover:bg-secondary/50"}`}>
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
            <button onClick={() => { setStampCount(Math.max(1, stampCount - 1)); setGeneratedLink(null); }} className="clay-button-secondary w-10 h-10 text-lg font-bold flex items-center justify-center">−</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold">{stampCount} <span className="text-sm font-normal text-muted-foreground">carimbo(s)</span></p>
            </div>
            <button onClick={() => { setStampCount(stampCount + 1); setGeneratedLink(null); }} className="clay-button-secondary w-10 h-10 text-lg font-bold flex items-center justify-center">+</button>
          </div>
          <button onClick={handleCreate} disabled={creating} className="clay-button bg-primary text-primary-foreground w-full py-3 font-semibold text-base flex items-center justify-center gap-2">
            {creating ? "Adicionando..." : <><Link className="w-5 h-5" /> Adicionar {stampCount} selo{stampCount > 1 ? 's' : ''}</>}
          </button>
        </motion.div>
      )}

      {/* Generated link */}
      {generatedLink && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Selo(s) adicionado(s)! Envie o link único do cliente</p>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{generatedLink}</p>
            <button onClick={copyLink} className="clay-button-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shrink-0">
              {copiedLink ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">O cliente usa este mesmo link para se cadastrar, entrar e coletar os selos.</p>
        </motion.div>
      )}

      {/* Existing stamps overview */}
      {stampData && stampData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-muted-foreground mb-3">Carimbos já gerados</h3>
          <div className="space-y-2">
            {stampData.map((entry) => {
              const hasCompleted = entry.cyclesCompleted > 0;
              const progress = entry.totalStamps > 0 ? (entry.currentProgress / entry.totalStamps) * 100 : 0;

              return (
                <div key={entry.customer._id} className="clay-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--clay-orange)" }}>{entry.customer.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{entry.customer.name}</p>
                        {hasCompleted && (
                          <span className="clay-badge px-1.5 py-0.5 text-[9px] font-bold inline-flex items-center gap-0.5" style={{ background: "oklch(0.92 0.08 145)", color: "oklch(0.35 0.12 145)" }}>
                            🏆 {entry.cyclesCompleted}x
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.cardName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "var(--clay-orange)" }}>{entry.currentProgress}/{entry.totalStamps}</p>
                      <p className="text-[10px] text-muted-foreground">ciclo atual</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: "var(--clay-orange)" }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.unrevealedCount > 0 && (
                      <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">
                        {entry.unrevealedCount} selo(s) aguardando coleta
                      </span>
                    )}
                    {entry.justCompleted && (
                      <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700">
                        🎁 Cartão preenchido! Enviar: {entry.rewardDescription}
                      </span>
                    )}
                    {!entry.justCompleted && entry.cyclesCompleted > 0 && entry.currentProgress === 0 && entry.revealedCount > 0 && (
                      <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">
                        Novo ciclo — {entry.revealedCount} selos totais
                      </span>
                    )}
                    {entry.currentProgress > 0 && !entry.justCompleted && (
                      <span className="clay-badge px-2 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground">
                        {entry.totalStamps - entry.currentProgress} selo(s) para próximo prêmio
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Prize Redemptions View ────────────────────────── */

function PrizeRedemptionsView({ businessId }: { businessId: string }) {
  const redemptions = useQuery(api.prizeRedemptions.list, { businessId: businessId as any });
  const counts = useQuery(api.prizeRedemptions.counts, { businessId: businessId as any });
  const updateStatus = useMutation(api.prizeRedemptions.updateStatus);

  const [filter, setFilter] = useState<"all" | "pending" | "delivered">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = redemptions ?? [];
    if (filter === "all") return list;
    return list.filter((r) => r.status === filter);
  }, [redemptions, filter]);

  const handleStatusChange = async (
    redemptionId: string,
    status: "pending" | "delivered",
  ) => {
    setUpdatingId(redemptionId);
    try {
      await updateStatus({
        redemptionId: redemptionId as any,
        status,
      });
      toast.success(
        status === "delivered"
          ? "Marcado como entregue!"
          : "Prêmio reaberto",
      );
    } catch {
      toast.error("Erro ao atualizar status");
    }
    setUpdatingId(null);
  };

  const statusConfig = {
    pending: {
      label: "Pendente",
      color: "bg-amber-100 text-amber-700",
      icon: <Package className="w-3.5 h-3.5" />,
    },
    delivered: {
      label: "Entregue",
      color: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-6"
    >
      <h2 className="text-lg font-bold mb-4">Prêmios</h2>

      {/* Summary cards */}
      {counts && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`clay-card p-4 text-center transition-all ${filter === "all" ? "ring-2 ring-primary/30" : ""}`}
          >
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`clay-card p-4 text-center transition-all ${filter === "pending" ? "ring-2 ring-amber-400/50" : ""}`}
          >
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
            <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`clay-card p-4 text-center transition-all ${filter === "delivered" ? "ring-2 ring-green-400/50" : ""}`}
          >
            <p className="text-2xl font-bold text-green-600">{counts.delivered}</p>
            <p className="text-xs text-muted-foreground font-medium">Entregues</p>
          </button>
        </div>
      )}

      {/* List */}
      {!redemptions ? (
        <div className="clay-card p-12 text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Nenhum prêmio registrado ainda. Prêmios são criados automaticamente quando um cliente completa o ciclo."
              : `Nenhum prêmio ${filter === "pending" ? "pendente" : "entregue"}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((redemption) => {
            const sc = statusConfig[redemption.status as keyof typeof statusConfig] ?? statusConfig.pending;
            return (
              <div key={redemption._id} className="clay-card p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "var(--clay-orange)" }}
                  >
                    {redemption.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">
                        {redemption.customerName}
                      </p>
                      <span
                        className={`clay-badge px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 ${sc.color}`}
                      >
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      🎁 {redemption.rewardDescription}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>Ciclo #{redemption.cycleNumber}</span>
                      {redemption.customerPhone && <span>📱 {redemption.customerPhone}</span>}
                      <span>
                        {new Date(redemption.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {redemption.deliveredAt && (
                        <span>Entregue: {new Date(redemption.deliveredAt).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {redemption.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange(redemption._id, "delivered")}
                        disabled={updatingId === redemption._id}
                        className="clay-button-secondary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 text-green-600"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Entregue
                      </button>
                    )}
                    {redemption.status === "delivered" && (
                      <button
                        onClick={() => handleStatusChange(redemption._id, "pending")}
                        disabled={updatingId === redemption._id}
                        className="clay-button-secondary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 text-amber-600"
                      >
                        <Package className="w-3 h-3" /> Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
