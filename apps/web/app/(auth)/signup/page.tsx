import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </main>
  );
}
