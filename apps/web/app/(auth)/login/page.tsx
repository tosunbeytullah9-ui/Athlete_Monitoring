import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="h-8 w-32 mx-auto rounded bg-muted animate-pulse" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
