"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { useToast } from "./use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => { if (!open) dismiss(t.id); }}
          className={[
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-2",
            t.variant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border bg-background text-foreground",
          ].join(" ")}
        >
          <div className="flex-1 space-y-0.5">
            {t.title && (
              <ToastPrimitive.Title className="text-sm font-semibold">
                {t.title}
              </ToastPrimitive.Title>
            )}
            {t.description && (
              <ToastPrimitive.Description className="text-sm opacity-80">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[380px]" />
    </ToastPrimitive.Provider>
  );
}
