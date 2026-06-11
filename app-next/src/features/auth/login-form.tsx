"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Image from "next/image";

export function LoginForm({ isConfigured, initialMessage }: { isConfigured: boolean; initialMessage?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    initialMessage === "senha_alterada" ? "Senha redefinida com sucesso! Faça login com suas novas credenciais." : null
  );
  const [isPending, setIsPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setForgotPasswordMsg(null);
    setSuccessMsg(null);
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError("Não foi possível autenticar. Verifique seus dados e tente novamente.");
        return;
      }

      router.push("/os");
      router.refresh();
    } catch {
      setError("Não foi possível autenticar. Verifique seus dados e tente novamente.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleForgotPassword() {
    if (cooldown > 0) return;
    if (!email || !email.trim()) {
      setError("Preencha o campo de e-mail acima para solicitar a recuperação de senha.");
      setForgotPasswordMsg(null);
      setSuccessMsg(null);
      return;
    }
    setError(null);
    setForgotPasswordMsg(null);
    setSuccessMsg(null);
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://alienxip-prospects-dashboard.vercel.app/os/reset-password",
      });

      if (resetError) {
        let errorMsg = resetError.message;
        if (errorMsg.includes("User not found")) {
          errorMsg = "Usuário não cadastrado no sistema.";
        } else if (errorMsg.includes("rate limit")) {
          errorMsg = "Muitas solicitações seguidas. Aguarde alguns minutos antes de tentar novamente.";
        } else {
          errorMsg = `Erro ao enviar e-mail: ${resetError.message}`;
        }
        setError(errorMsg);
      } else {
        setForgotPasswordMsg("Link enviado. Verifique Caixa de Entrada, Spam e Promoções.");
        setCooldown(60);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-purple-500/10 bg-black/60 p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
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
          Centro operacional da ALIENXIP
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed max-w-sm">
          Acesse prospects, projetos, tarefas, conhecimento e operação em um único ambiente.
        </p>
      </div>

      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
          Configure <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em{" "}
          <code className="font-mono">.env.local</code> para habilitar login real.
        </div>
      ) : null}

      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="relative">
          <MailIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="email@alienxip.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-xs h-10"
            required
            disabled={!isConfigured || isPending}
          />
        </div>

        <div className="relative">
          <LockIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-xs h-10"
            required
            disabled={!isConfigured || isPending}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={!isConfigured || isPending || cooldown > 0}
            className="text-[10px] text-purple-400 hover:text-purple-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors font-mono cursor-pointer uppercase tracking-wider"
          >
            {cooldown > 0 ? `Aguarde ${cooldown}s` : "Esqueci minha senha"}
          </button>
        </div>

        {successMsg ? (
          <p className="text-xs text-emerald-400 font-medium bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 leading-normal">
            {successMsg}
          </p>
        ) : null}

        {forgotPasswordMsg ? (
          <p className="text-[10px] text-amber-400 bg-amber-500/5 border border-yellow-500/10 rounded-lg p-2.5 leading-normal">
            {forgotPasswordMsg}
          </p>
        ) : null}

        {error ? (
          <p className="text-xs text-rose-500 font-medium bg-rose-500/5 border border-rose-500/10 rounded-lg p-2.5 leading-normal">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full mt-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 text-xs h-10"
          disabled={!isConfigured || isPending}
        >
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-mono">
          Security Protocol Enabled
        </span>
      </div>
    </div>
  );
}
