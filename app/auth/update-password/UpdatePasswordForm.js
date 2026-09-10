"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const inputClass = "min-h-12 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-neon";

export default function UpdatePasswordForm({ validRecovery }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updatePassword = async (event) => {
    event.preventDefault();
    if (busy || !validRecovery) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setBusy(false);
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "No se pudo actualizar la contraseña. Solicitá un enlace nuevo.");
      setBusy(false);
      return;
    }

    event.currentTarget.reset();
    await fetch("/auth/update-password/complete", { method: "POST" });
    await supabase.auth.signOut({ scope: "local" });
    setSuccess(true);
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6 shadow-glow sm:p-9">
        <Image src="/logo.png" alt="TERRA" width={82} height={82} className="mx-auto rounded-full" priority />
        {!validRecovery ? (
          <div className="mt-7 text-center">
            <ShieldAlert className="mx-auto text-red-300" size={40} />
            <h1 className="mt-4 text-2xl font-black uppercase tracking-[0.1em]">Enlace inválido</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">El enlace de recuperación venció, ya fue utilizado o no contiene una sesión válida.</p>
            <Link href="/admin" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-neon/35 bg-neon/10 px-5 py-3 text-sm font-bold text-neon">Solicitar otro enlace</Link>
          </div>
        ) : success ? (
          <div className="mt-7 text-center">
            <CheckCircle2 className="mx-auto text-emerald-300" size={40} />
            <h1 className="mt-4 text-2xl font-black uppercase tracking-[0.1em]">Contraseña actualizada</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">Ya podés iniciar sesión con tu nueva contraseña.</p>
            <Link href="/admin" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-neon px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black">Volver al login</Link>
          </div>
        ) : (
          <>
            <KeyRound className="mx-auto mt-7 text-neon" size={34} />
            <h1 className="mt-4 text-center text-2xl font-black uppercase tracking-[0.1em]">Nueva contraseña</h1>
            <p className="mt-3 text-center text-sm leading-6 text-white/60">Ingresá una contraseña de al menos 8 caracteres.</p>
            <form onSubmit={updatePassword} className="mt-7 grid gap-4">
              <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Nueva contraseña</span><input className={inputClass} name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
              <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Repetir contraseña</span><input className={inputClass} name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label>
              <button disabled={busy} className="mt-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-neon px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black disabled:opacity-50">
                {busy ? <Loader2 className="animate-spin" size={19} /> : <KeyRound size={19} />} {busy ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
            {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-200">{error}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
