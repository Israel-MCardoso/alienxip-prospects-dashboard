import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SplineScene } from "@/components/visual/spline-scene";

const MOTHERXIP_LOGIN_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white lg:grid lg:grid-cols-[1.15fr_0.85fr] overflow-hidden">
      {/* Coluna Esquerda: Spline Robot (57.5% de largura) */}
      <section className="relative hidden lg:block overflow-hidden border-r border-white/10 bg-black">
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,46,255,0.18),transparent_55%)] pointer-events-none" />
        
        {/* Grid de fundo */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.012)_1px,_transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

        {/* Robô 3D Spline */}
        <div className="absolute inset-0">
          <SplineScene
            scene={MOTHERXIP_LOGIN_SCENE}
            className="h-full w-full"
          />
        </div>

        {/* Overlays de gradiente para suavizar bordas */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/50" />
      </section>

      {/* Coluna Direita: Formulário de Login (42.5% de largura) */}
      <section className="flex min-h-screen items-center justify-center bg-[#050508] px-6 py-10 relative">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-black to-black pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] size-80 bg-purple-900/5 blur-[100px] pointer-events-none rounded-full" />
        
        <LoginForm isConfigured={isSupabaseConfigured()} />
      </section>
    </main>
  );
}
