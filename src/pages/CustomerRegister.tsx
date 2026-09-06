import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { useState } from "react";
import { User, Phone, Loader2, ArrowRight, LogIn } from "lucide-react";

export default function CustomerRegister() {
  const { businessId } = useParams<{ businessId: string }>();
  const business = useQuery(
    api.publicCustomers.getBusinessPublic,
    businessId ? { businessId: businessId as any } : "skip",
  );
  const registerSelf = useMutation(api.publicCustomers.registerSelf);
  const loginCustomer = useMutation(api.publicCustomers.loginCustomer);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brandColor = business?.brandColor || "var(--clay-orange)";

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessId || !name.trim() || !phone.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const customer = await registerSelf({
        businessId: businessId as any,
        name: name.trim(),
        phone: phone.trim(),
      });
      // Auto-login: store session and redirect directly to the customer area.
      // Use setTimeout to defer navigation out of React's commit phase and
      // avoid the removeChild DOM error.
      localStorage.setItem(
        `freebuff_customer_${customer._id}`,
        JSON.stringify({ phone: phone.trim(), loggedAt: Date.now() }),
      );
      setTimeout(() => {
        window.location.replace(`/customer/${customer._id}`);
      }, 0);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao cadastrar");
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessId || !phone.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const customer = await loginCustomer({
        businessId: businessId as any,
        phone: phone.trim(),
      });
      if (!customer) {
        setError("Telefone não encontrado. Faça seu cadastro primeiro.");
        return;
      }

      localStorage.setItem(
        `freebuff_customer_${customer._id}`,
        JSON.stringify({ phone: phone.trim(), loggedAt: Date.now() }),
      );
      setTimeout(() => {
        window.location.replace(`/customer/${customer._id}`);
      }, 0);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao entrar");
      setLoading(false);
    }
  };

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

  const isRegister = mode === "register";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div
        className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: brandColor }}
      />
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
          <p className="text-muted-foreground mt-1 text-sm">
            {isRegister ? "Cadastre-se para acompanhar seus selos" : "Entre para ver seus selos e prêmios"}
          </p>
        </div>

        <div className="clay-float p-8 relative overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl"
            style={{ background: brandColor }}
          />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-clay-blue opacity-15 blur-3xl" />

          <div className="relative z-10">
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Seu nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Como podemos te chamar?"
                      className="clay-input w-full pl-10 pr-4 py-3"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block">Seu telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(11) 99999-9999"
                    className="clay-input w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !phone.trim() || (isRegister && !name.trim())}
                className="clay-button w-full py-3.5 font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: brandColor, color: "white" }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRegister ? (
                  <>
                    Cadastrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Entrar
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError(null);
              }}
              className="w-full mt-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister ? "Já tenho cadastro — entrar" : "Ainda não tenho cadastro — cadastrar"}
            </button>
          </div>
        </div>

        <div className="clay-card p-4 text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Use o mesmo telefone sempre que quiser acessar seus selos.
          </p>
        </div>
      </div>
    </main>
  );
}
