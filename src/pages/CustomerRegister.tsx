import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Loader2, CheckCircle, ArrowRight } from "lucide-react";

export default function CustomerRegister() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const business = useQuery(
    api.publicCustomers.getBusinessPublic,
    businessId ? { businessId: businessId as any } : "skip",
  );

  const registerSelf = useMutation(api.publicCustomers.registerSelf);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await registerSelf({
        businessId: businessId as any,
        name: name.trim(),
        phone: phone.trim(),
      });
      if (result) setCustomerId(result._id);
      setRegistered(true);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao cadastrar");
    }
    setLoading(false);
  };

  const brandColor = business?.brandColor || "var(--clay-orange)";

  if (!businessId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Link inválido.</p>
        </div>
      </main>
    );
  }

  if (business === undefined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <p className="text-muted-foreground">Negócio não encontrado.</p>
        </div>
      </main>
    );
  }

  if (registered && customerId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-10 text-center max-w-sm relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: brandColor }} />
          </motion.div>
          <h1 className="text-xl font-bold mb-2">Cadastro realizado!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Bem-vindo, {name}! Seu cadastro foi concluído com sucesso.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Aguarde o {business.name} enviar os links para coletar seus carimbos.
          </p>
          <button
            onClick={() => navigate(`/customer/${customerId}`)}
            className="clay-button px-6 py-3 font-semibold text-sm flex items-center gap-2 mx-auto"
            style={{ background: brandColor, color: "white" }}
          >
            Ver meus carimbos
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: brandColor }} />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-15 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl clay-badge" style={{ background: `${brandColor}18`, boxShadow: `0 4px 12px ${brandColor}15` }}>
            {business.logoEmoji || "🏪"}
          </motion.div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre-se para começar a acumular carimbos
          </p>
        </div>

        <div className="clay-float p-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: brandColor }} />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />

          <div className="relative z-10">
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Seu nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    className="clay-input w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Seu telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="clay-input w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={!name.trim() || !phone.trim() || loading}
                className="clay-button w-full py-3.5 font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: brandColor, color: "white" }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Cadastrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="clay-card p-4 text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Seus dados são usados apenas para fins de fidelidade e não serão compartilhados.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
