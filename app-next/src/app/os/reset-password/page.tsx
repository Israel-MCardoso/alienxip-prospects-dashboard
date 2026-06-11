"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockIcon, ArrowLeftIcon, ShieldAlertIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const isConfigured = isSupabaseConfigured();
  const supabase = isConfigured ? createSupabaseBrowserClient() : null;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidating, setIsValidating] = useState(isConfigured);
  const [hasSession, setHasSession] = useState(false);
  
  const [error, setError] = useState<string | null>(
    isConfigured ? null : "Supabase não configurado. Por favor, defina as variáveis de ambiente."
  );
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isConfigured || !supabase) return;

    if (code) {
      console.log("Exchanging recovery code for session...");
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error: exchangeError }) => {
          if (exchangeError) {
            console.error("Exchange error:", exchangeError);
            let userFriendlyMsg = "Link de recuperação expirado ou inválido (otp_expired).";
            if (exchangeError.message.includes("expired") || exchangeError.message.includes("otp_expired")) {
              userFriendlyMsg = "O link de recuperação de senha expirou. Por favor, solicite um novo link.";
            } else if (exchangeError.message.includes("access_denied")) {
              userFriendlyMsg = "Acesso negado. O token é inválido.";
            }
            setError(userFriendlyMsg);
          } else {
            console.log("Session established successfully via code exchange!");
            setHasSession(true);
          }
          setIsValidating(false);
        })
        .catch((err) => {
          console.error("Unexpected exchange error:", err);
          setError("Erro inesperado ao validar o token de recuperação.");
          setIsValidating(false);
        });
    } else {
      // Implicit flow: check if a session is already present (which Supabase sets from the hash fragment)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          console.log("Session found in client context!");
          setHasSession(true);
          setIsValidating(false);
        } else {
          // Check if hash fragment exists in URL
          const hash = window.location.hash;
          if (hash && (hash.includes("access_token") || hash.includes("error"))) {
            if (hash.includes("error_description")) {
              const match = hash.match(/error_description=([^&]+)/);
              const rawMsg = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
              let userFriendlyMsg = "Erro na validação do link.";
              if (rawMsg.includes("expired") || rawMsg.includes("otp_expired")) {
                userFriendlyMsg = "O link de recuperação de senha expirou. Por favor, solicite um novo link.";
              } else if (rawMsg.includes("access_denied")) {
                userFriendlyMsg = "Acesso negado. O token é inválido.";
              } else if (rawMsg) {
                userFriendlyMsg = rawMsg;
              }
              setError(userFriendlyMsg);
              setIsValidating(false);
            } else {
              setError("Processando token de recuperação...");
              // Small delay to let Supabase client process the hash fragment
              setTimeout(() => {
                supabase.auth.getSession().then(({ data: delayedData }) => {
                  if (delayedData.session) {
                    setHasSession(true);
                    setError(null);
                  } else {
                    setError("Link de recuperação expirado ou inválido.");
                  }
                  setIsValidating(false);
                });
              }, 800);
            }
          } else {
            // Run asynchronously to prevent ESLint warning
            Promise.resolve().then(() => {
              setError("Link de recuperação ausente ou inválido. Acesse a página de login para solicitar a recuperação.");
              setIsValidating(false);
            });
          }
        }
      });
    }
  }, [code, isConfigured, supabase]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!supabase) return;

    setIsPending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.trim()
      });

      if (updateError) {
        setError(`Erro ao atualizar a senha: ${updateError.message}`);
      } else {
        setSuccess(true);
        // Log out immediately so the user has to login with their new password
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push("/os/login?message=senha_alterada");
        }, 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-purple-500/10 bg-black/60 p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 text-white">
      {/* Subtle purple radial glow */}
      <div className="absolute -top-10 -left-10 size-40 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/motherxip-logo.png"
          alt="MOTHERXIP Logo"
          width={64}
          height={64}
          className="object-contain mb-4"
        />
        <h1 className="text-2xl font-extrabold tracking-wider text-white font-mono uppercase">
          MOTHERXIP
        </h1>
        <p className="mt-1 text-xs font-semibold text-purple-300 font-mono tracking-tight uppercase">
          OPERATIONAL SECURITY
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed max-w-sm">
          Redefinição de senha de segurança do usuário.
        </p>
      </div>

      {isValidating ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider animate-pulse">
            Validando link de segurança...
          </span>
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400 flex items-start gap-3">
            <ShieldAlertIcon className="size-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block uppercase tracking-wider mb-1 text-[10px] text-rose-500">Erro de Segurança</span>
              {error}
            </div>
          </div>
          
          <Link href="/os/login" className="w-full">
            <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-xs h-10 border border-white/10 flex items-center justify-center gap-2">
              <ArrowLeftIcon className="size-4" /> Voltar para o Login
            </Button>
          </Link>
        </div>
      ) : success ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400 flex items-start gap-3">
            <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block uppercase tracking-wider mb-1 text-[10px] text-emerald-500">Sucesso</span>
              Senha alterada com sucesso! Redirecionando para a tela de login...
            </div>
          </div>
        </div>
      ) : hasSession ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="relative">
            <LockIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Nova Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-xs h-10"
              required
              disabled={isPending}
            />
          </div>

          <div className="relative">
            <LockIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Confirmar Nova Senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-xs h-10"
              required
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 text-xs h-10"
            disabled={isPending}
          >
            {isPending ? "Alterando..." : "Redefinir Senha"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 flex flex-col gap-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nenhuma sessão de recuperação activa identificada. Por favor, solicite a alteração novamente.
          </p>
          <Link href="/os/login" className="w-full">
            <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-xs h-10 border border-white/10">
              Voltar ao Login
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-6 text-center">
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-mono">
          Security Protocol Enabled
        </span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-black to-black pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] size-80 bg-purple-900/5 blur-[100px] pointer-events-none rounded-full" />
      
      <Suspense fallback={
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider animate-pulse">
          Carregando...
        </div>
      }>
        <ResetPasswordFormContent />
      </Suspense>
    </main>
  );
}
