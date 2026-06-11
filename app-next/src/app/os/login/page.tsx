import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SplineScene } from "@/components/visual/spline-scene";
import Image from "next/image";

const MOTHERXIP_LOGIN_SCENE = "COLOCAR_URL_DA_CENA_SPLINE_AQUI";

export default function LoginPage() {
  const hasSplineUrl = MOTHERXIP_LOGIN_SCENE && MOTHERXIP_LOGIN_SCENE !== "COLOCAR_URL_DA_CENA_SPLINE_AQUI";

  return (
    <main className="min-h-screen bg-[#050508] flex flex-col md:flex-row overflow-hidden relative">
      {/* Coluna Esquerda: Animação ou Fallback visual (55% de largura) */}
      <div className="hidden md:flex w-full md:w-[55%] relative items-center justify-center bg-black overflow-hidden border-r border-purple-500/10">
        {hasSplineUrl ? (
          <SplineScene scene={MOTHERXIP_LOGIN_SCENE} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Grid sutil */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:30px_30px] opacity-60" />
            
            {/* Glow / Orb Roxo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />

            {/* Texto Institucional */}
            <div className="relative z-10 text-center flex flex-col items-center max-w-sm gap-4 animate-in fade-in duration-1000">
              <Image
                src="/brand/motherxip-logo.png"
                alt="MOTHERXIP Logo"
                width={80}
                height={80}
                className="object-contain mb-2"
              />
              <h2 className="text-2xl font-extrabold tracking-widest text-white font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-300 to-white">
                MOTHERXIP
              </h2>
              <div className="h-0.5 w-12 bg-purple-500/50 rounded-full" />
              <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans text-center">
                Segurança integrada, otimização operacional e governança para todo o ecossistema corporativo da ALIENXIP.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Coluna Direita: Card de login (45% de largura) */}
      <div className="w-full md:w-[45%] min-h-screen flex items-center justify-center p-6 bg-[#050508] relative">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-black to-black pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] size-80 bg-purple-900/5 blur-[100px] pointer-events-none rounded-full" />
        
        <LoginForm isConfigured={isSupabaseConfigured()} />
      </div>
    </main>
  );
}
