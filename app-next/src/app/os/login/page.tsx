import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <LoginForm isConfigured={isSupabaseConfigured()} />
    </main>
  );
}
