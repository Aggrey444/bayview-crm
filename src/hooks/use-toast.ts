"use client"

import * as React from "react"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type Listener = (toasts: ToastData[]) => void
let memoryToasts: ToastData[] = []
const listeners: Listener[] = []

function notify() {
  listeners.forEach((l) => l([...memoryToasts]))
}

export function toast(opts: {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}) {
  const id = Math.random().toString(36).slice(2)
  const item: ToastData = { id, ...opts }
  memoryToasts = [item, ...memoryToasts].slice(0, 3)
  notify()

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id)
    notify()
  }, 4500)
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>(memoryToasts)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id)
      notify()
    },
  }
}
