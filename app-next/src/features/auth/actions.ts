"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPublicUrl } from "@/lib/site-url";

export type AuthActionResult = {
  ok: boolean;
  message?: string;
};

export async function loginWithPasswordAction(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase nao configurado."
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    return {
      ok: false,
      message: "Nao foi possivel autenticar. Verifique seus dados e tente novamente."
    };
  }

  return { ok: true };
}

export async function requestPasswordResetAction(email: string): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase nao configurado."
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: buildPublicUrl("/os/reset-password")
  });

  if (error) {
    if (error.message.includes("User not found")) {
      return { ok: false, message: "Usuario nao cadastrado no sistema." };
    }

    if (error.message.includes("rate limit")) {
      return { ok: false, message: "Muitas solicitacoes seguidas. Aguarde alguns minutos antes de tentar novamente." };
    }

    return { ok: false, message: `Erro ao enviar e-mail: ${error.message}` };
  }

  return { ok: true };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/os/login");
}
