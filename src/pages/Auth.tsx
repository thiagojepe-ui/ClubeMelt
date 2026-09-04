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
import { Loader2, Lock, User, UserX } from "lucide-react";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center clay-badge"
            style={{ background: "oklch(0.93 0.05 60)" }}
          >
            <CookieLogo size={40} />
          </div>
        </div>

        {/* Card */}
        <Card className="border-none clay-float">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">{mode === "register" ? "Criar conta" : "Entrar"}</CardTitle>
            <CardDescription>
              {mode === "register"
                ? "Cadastre-se para gerenciar seus cartões fidelidade"
                : "Entre com suas credenciais para acessar o painel"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={mode === "register" ? handleRegister : handleLogin}>
            <CardContent className="space-y-3">
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

              <div className="relative">
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

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="clay-button bg-primary text-primary-foreground w-full py-2.5 font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "register" ? (
                  "Criar conta"
                ) : (
                  "Entrar"
                )}
              </button>

              <p className="text-sm text-muted-foreground text-center pt-1">
                {mode === "register" ? (
                  <>
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      className="text-primary font-semibold hover:underline"
                      onClick={() => { setMode("login"); setError(null); }}
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
                      onClick={() => { setMode("register"); setError(null); }}
                    >
                      Criar conta
                    </button>
                  </>
                )}
              </p>
            </CardContent>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Feito com ♥ por{" "}
          <a
            href="https://freebuff.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors font-medium"
          >
            freebuff.com
          </a>
        </p>
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
