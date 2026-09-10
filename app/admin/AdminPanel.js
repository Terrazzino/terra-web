"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Disc3, ExternalLink, Home, Loader2, LogIn, LogOut, Menu, Music2, Package, Save, Share2, ShieldAlert, Ticket, X, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CollectionManager from "./CollectionManager";

const supabase = createClient();
const inputClass = "min-h-12 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-neon sm:text-sm";

const sections = [
  { id: "resumen", label: "Resumen", icon: Home },
  { id: "historia", label: "Historia", icon: BookOpen },
  { id: "redes", label: "Redes", icon: Share2 },
  { id: "discografia", label: "Discografía", icon: Disc3 },
  { id: "recitales", label: "Recitales", icon: Ticket },
  { id: "merch", label: "Merch", icon: Package },
  { id: "club", label: "El Club", icon: Music2 },
];

const collectionConfig = {
  discografia: {
    title: "Discografía",
    description: "Creá, editá o eliminá lanzamientos y reemplazá sus portadas.",
    fields: [
      { name: "nombre", label: "Nombre", required: true },
      { name: "tipo", label: "Tipo", placeholder: "Álbum, EP o Single", required: true },
      { name: "year", label: "Año", required: true, inputMode: "numeric" },
      { name: "spotify_url", label: "Spotify URL", type: "url", placeholder: "https://...", wide: true },
      { name: "youtube_url", label: "YouTube URL", type: "url", placeholder: "https://...", wide: true },
    ],
    image: { bucket: "discografia", pathField: "cover_path", urlField: "cover_url", label: "Elegir portada" },
  },
  recitales: {
    title: "Recitales",
    description: "Administrá fechas, datos del show, enlace de Instagram y flyer.",
    fields: [
      { name: "ciudad", label: "Ciudad", required: true },
      { name: "fecha", label: "Fecha", required: true },
      { name: "hora", label: "Hora", required: true },
      { name: "direccion", label: "Dirección", required: true },
      { name: "instagram_url", label: "Instagram URL", type: "url", placeholder: "https://...", wide: true },
    ],
    image: { bucket: "flyers", pathField: "flyer_path", urlField: "flyer_url", label: "Elegir flyer" },
  },
  merch: {
    title: "Merch",
    description: "Administrá los productos que aparecen en la landing.",
    fields: [{ name: "nombre", label: "Nombre", required: true, wide: true }],
    image: { bucket: "merch", pathField: "image_path", urlField: "image_url", label: "Elegir imagen" },
  },
};

function assertOptionalUrl(value, label) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error(`${label} debe ser una URL válida que comience con http:// o https://.`);
  }
}

function validateCollection(fields, values, file) {
  fields.forEach((field) => {
    if (field.required && !values[field.name]) throw new Error(`${field.label} es obligatorio.`);
    if (field.type === "url") assertOptionalUrl(values[field.name], field.label);
  });
  if (file && !file.type.startsWith("image/")) throw new Error("El archivo seleccionado debe ser una imagen.");
  if (file && file.size > 15 * 1024 * 1024) throw new Error("La imagen supera el máximo permitido de 15 MB.");
}

function messageForAuthError(error) {
  if (error?.message?.toLowerCase().includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (error?.message?.toLowerCase().includes("email not confirmed")) return "El correo todavía no fue confirmado en Supabase.";
  return error?.message || "No se pudo iniciar sesión.";
}

function getPublicUrl(bucket, path) {
  if (!path) return "";
  return supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl || "";
}

function Feedback({ feedback, onClose }) {
  if (!feedback) return null;
  const success = feedback.type === "success";
  return (
    <div role="status" className={`fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border p-4 shadow-2xl ${success ? "border-emerald-400/30 bg-emerald-950 text-emerald-100" : "border-red-400/30 bg-red-950 text-red-100"}`}>
      {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <XCircle className="mt-0.5 shrink-0" size={20} />}
      <p className="min-w-0 flex-1 text-sm leading-6">{feedback.message}</p>
      <button onClick={onClose} aria-label="Cerrar mensaje" className="shrink-0"><X size={18} /></button>
    </div>
  );
}

function Login({ authorizationError }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(authorizationError ? "Falta aplicar la migración de seguridad de Supabase." : "");

  const signIn = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    });
    if (authError) {
      setError(messageForAuthError(authError));
      setBusy(false);
      return;
    }
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6 shadow-glow sm:p-9">
        <Image src="/logo.png" alt="TERRA" width={82} height={82} className="mx-auto rounded-full" priority />
        <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.35em] text-neon">Panel privado</p>
        <h1 className="mt-3 text-center text-3xl font-black uppercase tracking-[0.12em]">Administración</h1>
        <p className="mt-3 text-center text-sm leading-6 text-white/55">Ingresá con una cuenta administradora autorizada en Supabase.</p>
        <form onSubmit={signIn} className="mt-7 grid gap-4">
          <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Correo</span><input className={inputClass} name="email" type="email" autoComplete="email" required /></label>
          <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Contraseña</span><input className={inputClass} name="password" type="password" autoComplete="current-password" required /></label>
          <button disabled={busy} className="mt-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-neon px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black disabled:opacity-50">
            {busy ? <Loader2 className="animate-spin" size={19} /> : <LogIn size={19} />} {busy ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
      </div>
    </main>
  );
}

function AccessDenied({ email, authorizationError }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const leave = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    router.refresh();
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-400/20 bg-[#100909] p-7 text-center">
        <ShieldAlert className="mx-auto text-red-300" size={42} />
        <h1 className="mt-5 text-2xl font-black uppercase tracking-[0.12em]">Acceso no autorizado</h1>
        <p className="mt-3 break-words text-sm leading-6 text-white/60">La cuenta {email} inició sesión, pero no figura en <code>admin_users</code>.</p>
        {authorizationError ? <p className="mt-3 text-sm text-red-300">Detalle: {authorizationError}</p> : null}
        <button disabled={busy} onClick={leave} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm disabled:opacity-50"><LogOut size={18} /> Volver al login</button>
      </div>
    </main>
  );
}

export default function AdminPanel({ initialUser, authorized, authorizationError }) {
  const router = useRouter();
  const [active, setActive] = useState("resumen");
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialUser && authorized));
  const [feedback, setFeedback] = useState(null);
  const [content, setContent] = useState({ redes: [], historia: null, discografia: [], recitales: [], elClub: null, merch: [] });
  const [historiaText, setHistoriaText] = useState("");
  const [clubForm, setClubForm] = useState({ descripcion: "", playlist_url: "" });
  const [redesDraft, setRedesDraft] = useState({});

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        supabase.from("redes").select("*").order("orden", { ascending: true }),
        supabase.from("historia").select("*").order("id", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("discografia").select("*").order("created_at", { ascending: false }),
        supabase.from("recitales").select("*").order("created_at", { ascending: false }),
        supabase.from("el_club").select("*").order("id", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("merch").select("*").order("created_at", { ascending: false }),
      ]);
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
      const [redes, historia, discografia, recitales, club, merch] = results.map((result) => result.data);
      const next = {
        redes: redes || [],
        historia: historia || null,
        discografia: (discografia || []).map((item) => ({ ...item, cover_url: item.cover_url || getPublicUrl("discografia", item.cover_path) })),
        recitales: (recitales || []).map((item) => ({ ...item, flyer_url: item.flyer_url || getPublicUrl("flyers", item.flyer_path) })),
        elClub: club || null,
        merch: (merch || []).map((item) => ({ ...item, image_url: item.image_url || getPublicUrl("merch", item.image_path) })),
      };
      setContent(next);
      setHistoriaText(next.historia?.texto || "");
      setClubForm({ descripcion: next.elClub?.descripcion || "", playlist_url: next.elClub?.playlist_url || "" });
      setRedesDraft(Object.fromEntries(next.redes.map((item) => [item.id, { nombre: item.nombre || item.name || "", url: item.url || "", orden: item.orden ?? 0 }])));
    } catch (error) {
      setFeedback({ type: "error", message: `No se pudo cargar el contenido: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser && authorized) loadContent();
  }, [initialUser, authorized, loadContent]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  if (!initialUser) return <Login authorizationError={authorizationError} />;
  if (!authorized) return <AccessDenied email={initialUser.email} authorizationError={authorizationError} />;

  const run = async (action, successMessage) => {
    if (busy) return false;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await action();
      await loadContent();
      setFeedback({ type: result?.warning ? "error" : "success", message: result?.warning || successMessage });
      return true;
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "La operación no pudo completarse." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveSingleton = (table, current, values, label) => run(async () => {
    Object.entries(values).forEach(([key, value]) => {
      if (key.endsWith("_url")) assertOptionalUrl(value, key === "playlist_url" ? "Playlist URL" : key);
    });
    const query = current?.id
      ? supabase.from(table).update(values).eq("id", current.id).select("id").single()
      : supabase.from(table).insert(values).select("id").single();
    const { error } = await query;
    if (error) throw error;
  }, `${label} se guardó correctamente.`);

  const saveRedes = () => run(async () => {
    content.redes.forEach((item) => {
      const draft = redesDraft[item.id];
      if (!draft?.nombre?.trim()) throw new Error("El nombre de cada red es obligatorio.");
      assertOptionalUrl(draft.url, `URL de ${draft.nombre}`);
    });
    const results = await Promise.all(content.redes.map((item) => supabase.from("redes").update(redesDraft[item.id]).eq("id", item.id).select("id").single()));
    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;
  }, "Las redes se guardaron correctamente.");

  const safeRemoveAsset = async (config, oldPath, recordId) => {
    if (!oldPath) return;
    const { count, error } = await supabase.from(config.table).select("id", { count: "exact", head: true }).eq(config.image.pathField, oldPath).neq("id", recordId);
    if (error) throw error;
    if (!count) {
      const { error: removeError } = await supabase.storage.from(config.image.bucket).remove([oldPath]);
      if (removeError) return `Los datos se guardaron, pero no se pudo limpiar la imagen anterior: ${removeError.message}`;
    }
    return "";
  };

  const saveCollection = (table, item, values, file) => {
    const base = collectionConfig[table];
    const config = { ...base, table };
    return run(async () => {
      validateCollection(base.fields, values, file);
      let newPath = "";
      if (file) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        newPath = `admin/${crypto.randomUUID()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from(config.image.bucket).upload(newPath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
      }
      const payload = { ...values };
      if (newPath) {
        payload[config.image.pathField] = newPath;
        payload[config.image.urlField] = null;
      }
      const query = item
        ? supabase.from(table).update(payload).eq("id", item.id).select("id").single()
        : supabase.from(table).insert(payload).select("id").single();
      const { error } = await query;
      if (error) {
        if (newPath) await supabase.storage.from(config.image.bucket).remove([newPath]);
        throw error;
      }
      if (item && newPath && item[config.image.pathField] && item[config.image.pathField] !== newPath) {
        const warning = await safeRemoveAsset(config, item[config.image.pathField], item.id);
        if (warning) return { warning };
      }
      return null;
    }, item ? `${base.title}: cambios guardados.` : `${base.title}: registro creado.`);
  };

  const deleteCollection = (table, item) => {
    if (!window.confirm("¿Seguro que querés eliminar este registro? Esta acción no se puede deshacer.")) return;
    const base = collectionConfig[table];
    const config = { ...base, table };
    run(async () => {
      const { error } = await supabase.from(table).delete().eq("id", item.id).select("id").single();
      if (error) throw error;
      const warning = await safeRemoveAsset(config, item[config.image.pathField], item.id);
      return warning ? { warning } : null;
    }, `${base.title}: registro eliminado.`);
  };

  const signOut = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) setFeedback({ type: "error", message: error.message });
    else router.refresh();
  };

  const navigate = (id) => { setActive(id); setMenuOpen(false); };
  const currentTitle = sections.find((section) => section.id === active)?.label;

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[min(17rem,86vw)] border-r border-white/10 bg-[#080808] p-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Image src="/logo.png" alt="TERRA" width={44} height={44} className="rounded-full" /><div><p className="font-black tracking-[0.2em]">TERRA</p><p className="text-xs text-neon">CMS</p></div></div><button onClick={() => setMenuOpen(false)} className="p-3 lg:hidden" aria-label="Cerrar menú"><X /></button></div>
        <nav className="mt-8 grid gap-2">{sections.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition ${active === id ? "bg-neon text-black" : "text-white/65 hover:bg-white/5 hover:text-white"}`}><Icon size={18} />{label}</button>)}</nav>
        <a href="/" target="_blank" className="mt-7 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 px-4 text-sm text-white/60"><ExternalLink size={17} /> Ver sitio público</a>
        <button disabled={busy} onClick={signOut} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-400/20 px-4 text-sm text-red-300 disabled:opacity-50"><LogOut size={17} /> Cerrar sesión</button>
      </aside>
      {menuOpen ? <button aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/75 lg:hidden" /> : null}

      <main className="min-w-0 px-4 pb-16 pt-4 sm:px-7 lg:px-10 lg:py-8">
        <header className="sticky top-0 z-20 -mx-4 mb-7 flex items-center gap-3 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
          <button onClick={() => setMenuOpen(true)} className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-white/10 lg:hidden" aria-label="Abrir menú"><Menu /></button>
          <div className="min-w-0"><p className="truncate text-xs uppercase tracking-[0.25em] text-neon">Panel privado</p><h1 className="truncate text-xl font-black uppercase tracking-[0.1em] sm:text-3xl">{currentTitle}</h1></div>
        </header>

        <div className="mx-auto max-w-5xl min-w-0">
          {loading ? <div className="flex min-h-[40vh] items-center justify-center gap-3 text-neon"><Loader2 className="animate-spin" /> Cargando contenido...</div> : null}
          {!loading && active === "resumen" ? <section><h2 className="text-3xl font-black uppercase tracking-[0.1em]">Hola, {initialUser.email}</h2><p className="mt-3 text-white/55">Elegí una sección para administrar el contenido publicado.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sections.slice(1).map(({ id, label, icon: Icon }) => { const count = id === "club" ? (content.elClub ? 1 : 0) : id === "historia" ? (content.historia ? 1 : 0) : content[id]?.length || 0; return <button key={id} onClick={() => navigate(id)} className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 text-left transition hover:border-neon/35"><Icon className="text-neon" /><p className="mt-6 font-bold">{label}</p><p className="mt-1 text-sm text-white/45">{count} registro{count === 1 ? "" : "s"}</p></button>; })}</div></section> : null}

          {!loading && active === "historia" ? <section><h2 className="text-2xl font-black uppercase tracking-[0.12em]">Historia</h2><p className="mt-2 text-sm text-white/55">Este texto se muestra en la sección Historia de la landing.</p><textarea rows={14} value={historiaText} onChange={(event) => setHistoriaText(event.target.value)} className={`${inputClass} mt-6 resize-y`} /><button disabled={busy || !historiaText.trim()} onClick={() => saveSingleton("historia", content.historia, { texto: historiaText.trim() }, "La historia")} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-neon px-5 font-bold text-black disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar historia</button></section> : null}

          {!loading && active === "redes" ? <section><h2 className="text-2xl font-black uppercase tracking-[0.12em]">Redes sociales</h2><p className="mt-2 text-sm text-white/55">Editá el nombre, enlace y orden de las redes existentes.</p><div className="mt-6 grid gap-4">{content.redes.map((item) => <div key={item.id} className="grid gap-3 rounded-3xl border border-white/10 bg-[#0b0b0b] p-4 sm:grid-cols-[1fr_2fr_7rem]"><input aria-label="Nombre" className={inputClass} value={redesDraft[item.id]?.nombre || ""} onChange={(event) => setRedesDraft((draft) => ({ ...draft, [item.id]: { ...draft[item.id], nombre: event.target.value } }))} /><input aria-label="URL" type="url" className={inputClass} value={redesDraft[item.id]?.url || ""} onChange={(event) => setRedesDraft((draft) => ({ ...draft, [item.id]: { ...draft[item.id], url: event.target.value } }))} /><input aria-label="Orden" type="number" className={inputClass} value={redesDraft[item.id]?.orden ?? 0} onChange={(event) => setRedesDraft((draft) => ({ ...draft, [item.id]: { ...draft[item.id], orden: Number(event.target.value) } }))} /></div>)}</div><button disabled={busy || !content.redes.length} onClick={saveRedes} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-neon px-5 font-bold text-black disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar redes</button></section> : null}

          {!loading && ["discografia", "recitales", "merch"].includes(active) ? <CollectionManager {...collectionConfig[active]} items={content[active]} busy={busy} onSave={(item, values, file) => saveCollection(active, item, values, file)} onDelete={(item) => deleteCollection(active, item)} /> : null}

          {!loading && active === "club" ? <section><h2 className="text-2xl font-black uppercase tracking-[0.12em]">El Club</h2><p className="mt-2 text-sm text-white/55">Editá la descripción y el enlace a la playlist oficial.</p><div className="mt-6 grid gap-4"><label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Descripción</span><textarea rows={9} className={inputClass} value={clubForm.descripcion} onChange={(event) => setClubForm((form) => ({ ...form, descripcion: event.target.value }))} /></label><label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Playlist URL</span><input type="url" className={inputClass} value={clubForm.playlist_url} onChange={(event) => setClubForm((form) => ({ ...form, playlist_url: event.target.value }))} /></label></div><button disabled={busy} onClick={() => saveSingleton("el_club", content.elClub, { descripcion: clubForm.descripcion.trim(), playlist_url: clubForm.playlist_url.trim() }, "El Club")} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-neon px-5 font-bold text-black disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar El Club</button></section> : null}
        </div>
      </main>
      <Feedback feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
