"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "amigo_oculto_emails";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  // Carrega histórico do localStorage ao montar
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedEmails(parsed);
      }
    } catch {
      // ignora erros de parse
    }
  }, []);

  function saveEmailToHistory(newEmail: string) {
    if (typeof window === "undefined") return;

    try {
      const normalized = newEmail.trim().toLowerCase();
      if (!normalized) return;

      const current = new Set(
        savedEmails.map((e) => e.trim().toLowerCase())
      );
      current.add(normalized);

      const updated = Array.from(current).slice(0, 5); // no máximo 5 emails
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedEmails(updated);
    } catch {
      // ignora erro de localStorage
    }
  }

  async function sendMagicLink(targetEmail: string) {
    setLoading(true);
    setError(null);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : undefined);

    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: siteUrl
          ? `${siteUrl}/auth/callback`
          : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
      setLastSentEmail(targetEmail);
      saveEmailToHistory(targetEmail);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await sendMagicLink(email);
  }

  async function handleQuickLogin(targetEmail: string) {
    if (loading) return;
    await sendMagicLink(targetEmail);
  }

  if (sent) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm text-neutral-200">
          Te enviei um link de acesso para{" "}
          <span className="font-semibold">
            {lastSentEmail ?? "seu email"}
          </span>
          😊
        </p>
        <p className="text-xs text-neutral-500">
          Abra o email no mesmo celular/computador e clique no botão para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulário principal */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-500 py-2 text-sm font-semibold text-neutral-900 hover:bg-orange-400 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Entrar com email"}
        </button>
        <p className="text-[11px] text-neutral-500 text-center">
          Nenhuma senha — só um link mágico enviado pro seu email.
        </p>
      </form>

      {/* Lista de emails já usados no dispositivo */}
      {savedEmails.length > 0 && (
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          <p className="text-[11px] text-neutral-400 text-center uppercase tracking-[0.16em]">
            Entrar com email já usado
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {savedEmails.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleQuickLogin(e)}
                className="px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-[11px] text-neutral-200 hover:border-orange-400 hover:text-orange-300"
                disabled={loading}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
