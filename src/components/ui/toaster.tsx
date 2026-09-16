"use client"

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 ${
            t.variant === "destructive"
              ? "bg-red-600 text-white border-red-500"
              : "bg-zinc-900/95 text-white border-zinc-800"
          }`}
        >
          <div className="space-y-1">
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            {t.description && <p className="text-xs opacity-90">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
