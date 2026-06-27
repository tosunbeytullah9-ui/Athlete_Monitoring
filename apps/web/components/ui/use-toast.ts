"use client";

import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
}

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

interface State {
  toasts: Toast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, open: false } : t
        ),
      };
    case "REMOVE":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    default:
      return state;
  }
}

let dispatch: React.Dispatch<Action> = () => {};
let state: State = { toasts: [] };
const listeners: Array<(s: State) => void> = [];

function dispatchAndNotify(action: Action) {
  state = reducer(state, action);
  listeners.forEach((l) => l(state));
}

function scheduleRemove(id: string) {
  if (toastTimeouts.has(id)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(id);
    dispatchAndNotify({ type: "REMOVE", id });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(id, timeout);
}

export function toast({
  title,
  description,
  variant = "default",
}: {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}) {
  const id = Math.random().toString(36).slice(2);
  dispatchAndNotify({ type: "ADD", toast: { id, title, description, variant, open: true } });
  scheduleRemove(id);
  return id;
}

export function useToast() {
  const [localState, setLocalState] = React.useState<State>(state);

  React.useEffect(() => {
    listeners.push(setLocalState);
    return () => {
      const idx = listeners.indexOf(setLocalState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    dispatchAndNotify({ type: "DISMISS", id });
    scheduleRemove(id);
  }, []);

  return { toasts: localState.toasts, dismiss };
}
