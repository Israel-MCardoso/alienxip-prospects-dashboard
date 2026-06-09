"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ isConfigured }: { isConfigured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/os");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao autenticar.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Entrar na ALIENXIP OS</CardTitle>
        <CardDescription>
          Acesso inicial com Supabase Auth em ambiente de desenvolvimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local` para habilitar login real.
          </div>
        ) : null}

        <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
          <Input
            type="email"
            placeholder="email@alienxip.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={!isConfigured || isPending}
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={!isConfigured || isPending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={!isConfigured || isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
