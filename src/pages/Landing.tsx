import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Stamp,
  QrCode,
  Users,
  Gift,
  ArrowRight,
  Star,
  Heart,
  Zap,
  Sparkles,
  PartyPopper,
  Link2,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white clay-badge">
              <Stamp className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Fideliza</span>
          </div>
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            className="clay-button bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background blobs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-clay-peach rounded-full opacity-30 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-clay-blue rounded-full opacity-25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-clay-mint rounded-full opacity-15 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 clay-badge bg-clay-peach/50 px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-[oklch(0.55_0.18_15)]" />
              <span className="text-sm font-semibold text-[oklch(0.35_0.06_15)]">
                Fidelize seus clientes com surpresas a cada compra
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
          >
            Carimbos que{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--clay-orange), oklch(0.65 0.14 30), var(--clay-blue))",
              }}
            >
              surpreendem
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Cada compra vira uma surpresa. Seus clientes abrem o link, coletam
            carimbos e descobrem prêmios a cada toque. Sem papel, sem
            aplicativo — pelo celular.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="clay-button bg-primary text-primary-foreground px-8 py-4 text-lg font-bold flex items-center gap-2"
            >
              Criar meu cartão grátis
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Phone mockup — reveal experience */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative"
          >
            <div className="mx-auto max-w-sm">
              <div className="clay-float p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-clay-peach opacity-40 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-clay-blue opacity-30 blur-3xl" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-clay-orange/10 flex items-center justify-center text-4xl clay-badge">
                    ☕
                  </div>
                  <h3 className="text-xl font-bold mb-1">Café do Centro</h3>
                  <p className="text-xs text-muted-foreground mb-5">
                    Toque nos selos para descobrir seu prêmio!
                  </p>
                  <div className="grid grid-cols-5 gap-2.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <motion.div
                        key={n}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + n * 0.08, type: "spring" }}
                        className={`stamp-slot ${
                          n <= 2
                            ? "stamp-slot-filled text-white"
                            : n === 3
                            ? "stamp-slot-reward"
                            : "stamp-slot-empty"
                        } text-xs`}
                      >
                        {n <= 2 && <Star className="w-4 h-4" />}
                        {n === 3 && <span className="text-lg">?</span>}
                        {n > 3 && (
                          <span className="text-muted-foreground/30">{n}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-5 bg-clay-orange/10 rounded-2xl py-2.5 px-4 clay-badge">
                    <p className="text-xs text-muted-foreground">Próximo prêmio</p>
                    <p className="font-bold text-sm" style={{ color: "var(--clay-orange)" }}>
                      10% de desconto
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Simplifique a fidelização com surpresas a cada compra.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="clay-card p-6"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 clay-badge"
                  style={{ background: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground text-lg">
              Três passos simples para fidélizar com surpresa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 clay-card flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="clay-float p-10 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-clay-mint opacity-25 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-clay-lavender opacity-25 blur-3xl" />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Comece a surpreender hoje
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Crie seu cartão, configure os prêmios e envie o link. Seus
                clientes vão adorar.
              </p>
              <button
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                className="clay-button bg-primary text-primary-foreground px-10 py-4 text-lg font-bold flex items-center gap-2 mx-auto"
              >
                Criar agora
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
              <Stamp className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Fideliza</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cartão fidelidade digital com surpresas · Feito com ♥ para negócios
            que fazem a diferença
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Selo-surpresa a cada compra",
    description:
      "Cada carimbo é uma caixa de surpresa. Seus clientes tocam e revelam prêmios, descontos ou mensagens especiais.",
    color: "var(--clay-orange)",
  },
  {
    icon: <Link2 className="w-6 h-6" />,
    title: "Link ou QR Code",
    description:
      "Envie o link por WhatsApp ou mostre o QR Code. O cliente se cadastra pelo celular e começa a coletar.",
    color: "var(--clay-blue)",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Cadastro automático",
    description:
      "O cliente entra com nome e telefone. Sem cadastro complicado. Você vê tudo no painel de controle.",
    color: "oklch(0.72 0.1 160)",
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: "Prêmios configuráveis",
    description:
      "Defina prêmios reais ou mensagens de incentivo para cada carimbo. Você decide o que cada selo revela.",
    color: "oklch(0.7 0.1 260)",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Experiência instantânea",
    description:
      "Sem espera, sem papel. O carimbo é coletado na hora pelo celular com uma animação de revelação.",
    color: "oklch(0.7 0.12 340)",
  },
  {
    icon: <PartyPopper className="w-6 h-6" />,
    title: "Recompensa final",
    description:
      "Quando completa o cartão, o cliente desbloqueia a recompensa principal. Uma celebração automática!",
    color: "oklch(0.6 0.1 220)",
  },
];

const steps = [
  {
    title: "Crie seu cartão",
    description:
      "Configure o nome, cor, quantidade de carimbos e prêmios de cada selo.",
  },
  {
    title: "Envie o link",
    description:
      "Copie o link ou mostre o QR Code. O cliente se cadastra com nome e telefone.",
  },
  {
    title: "Cliente coleta e surpreende",
    description:
      "A cada compra, o cliente toca e revela o que tem dentro do carimbo!",
  },
];
