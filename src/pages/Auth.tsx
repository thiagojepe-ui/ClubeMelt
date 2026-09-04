import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import CookieLogo from "@/components/CookieLogo";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { ArrowRight, Loader2, Mail, User, UserX } from "lucide-react";
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
  const setName = useMutation(api.users.setName);

  const [step, setStep] = useState<"register" | { email: string; name: string }>(
    "register",
  );
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const name = (formData.get("name") as string)?.trim();
      const email = formData.get("email") as string;

      if (!name) {
        setError("Por favor, informe seu nome.");
        setIsLoading(false);
        return;
      }

      // Send OTP
      await signIn("email-otp", formData);
      setStep({ email, name });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao enviar código. Tente novamente.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      // Save the admin name to their profile
      if (step !== "register" && step.name) {
        try {
          await setName({ name: step.name });
        } catch (e) {
          console.warn("Could not set user name:", e);
        }
      }

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Código incorreto. Verifique e tente novamente.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
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
          {step === "register" ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 clay-badge"
                    style={{ background: "oklch(0.93 0.05 60)" }}
                  >
                    <CookieLogo size={40} />
                  </div>
                </div>
                <CardTitle className="text-xl">Bem-vindo à MeltCookies</CardTitle>
                <CardDescription>
                  Crie sua conta para gerenciar seus cartões fidelidade
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterSubmit}>
                <CardContent>
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="name"
                        placeholder="Seu nome"
                        type="text"
                        className="clay-input pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="seu@email.com"
                          type="email"
                          className="clay-input pl-9"
                          disabled={isLoading}
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
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}

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
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <div className="flex justify-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 clay-badge"
                    style={{ background: "oklch(0.93 0.05 60)" }}
                  >
                    <CookieLogo size={32} />
                  </div>
                </div>
                <CardTitle>Verifique seu email</CardTitle>
                <CardDescription>
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="font-semibold text-foreground">{step.email}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Não recebeu o código?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setStep("register")}
                    >
                      Tentar novamente
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <button
                    type="submit"
                    className="clay-button bg-primary text-primary-foreground w-full py-3 font-semibold flex items-center justify-center gap-2"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Criar minha conta
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setStep("register")}
                    disabled={isLoading}
                  >
                    Usar outro email
                  </button>
                </CardFooter>
              </form>
            </>
          )}

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
