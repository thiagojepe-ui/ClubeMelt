import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import CookieLogo from "@/components/CookieLogo";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { ArrowRight, Loader2, Lock, User, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const registerAdmin = useMutation(api.admins.register);
  const loginAdmin = useMutation(api.admins.login);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !name.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerAdmin({
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
      });
      // Auto-login after registration
      await signIn("admin", { adminId: result.adminId });
      navigate(redirect);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao criar conta");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginAdmin({
        username: username.trim(),
        password: password.trim(),
      });
      await signIn("admin", { adminId: result.adminId });
      navigate(redirect);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Erro ao entrar");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch {
      setError("Erro ao entrar como visitante.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-clay-peach rounded-full opacity-25 blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-clay-blue rounded-full opacity-20 blur-3xl" />

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="flex items-center justify-center h-full flex-col">
          <Card className="min-w-[350px] pb-0 border-none clay-float">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 clay-badge"
                  style={{ background: "oklch(0.93 0.05 60)" }}
                >
                  <CookieLogo size={40} />
                </div>
              </div>
              <CardTitle className="text-xl">
                {mode === "register" ? "Criar conta" : "Entrar"}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "Cadastre-se para gerenciar seus cartões fidelidade"
                  : "Entre com suas credenciais para acessar o painel"}
              </CardDescription>
            </CardHeader>

            <form onSubmit={mode === "register" ? handleRegister : handleLogin}>
              <CardContent>
                <div className="space-y-3">
                  {mode === "register" && (
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        type="text"
                        className="clay-input pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  )}
                  <div className="relative">
                    <UserX className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nome de usuário"
                      type="text"
                      className="clay-input pl-9"
                      disabled={isLoading}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha"
                        type="password"
                        className="clay-input pl-9"
                        disabled={isLoading}
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="clay-button bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
                )}

                <p className="text-sm text-muted-foreground text-center mt-4">
                  {mode === "register" ? (
                    <>
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        className="text-primary font-semibold hover:underline"
                        onClick={() => {
                          setMode("login");
                          setError(null);
                        }}
                      >
                        Entrar
                      </button>
                    </>
                  ) : (
                    <>
                      Não tem conta?{" "}
                      <button
                        type="button"
                        className="text-primary font-semibold hover:underline"
                        onClick={() => {
                          setMode("register");
                          setError(null);
                        }}
                      >
                        Criar conta
                      </button>
                    </>
                  )}
                </p>

                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="clay-button-secondary w-full mt-4 py-3 font-semibold flex items-center justify-center gap-2"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="h-4 w-4" />
                    Entrar como Visitante
                  </button>
                </div>
              </CardContent>
            </form>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted/50 border-t rounded-b-xl">
              Feito com ♥ por{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors font-medium"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
