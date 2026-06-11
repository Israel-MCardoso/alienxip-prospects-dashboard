import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 py-10 overflow-hidden">
      {/* Background soft gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-black to-black pointer-events-none" />
      <div className="absolute top-[20%] left-[10%] size-96 bg-purple-900/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[10%] size-96 bg-indigo-900/10 blur-[120px] pointer-events-none rounded-full" />
      
      <LoginForm isConfigured={isSupabaseConfigured()} />
    </main>
  );
}
