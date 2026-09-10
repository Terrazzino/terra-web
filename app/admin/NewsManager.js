"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Star, Trash2, X, Zap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const EMPTY_FORM = {
  titulo: "",
  descripcion: "",
  fecha: "",
  url: "",
  texto_boton: "",
  orden: 0,
  visible: true,
  destacada: false,
};

const cleanFileName = (name) => name.replace(/[^a-zA-Z0-9.-]/g, "_");

export default function NewsManager({ novedades, onRefresh }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setImageFile(null);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const startEditing = (item) => {
    setEditing(item);
    setForm({
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      fecha: item.fecha || "",
      url: item.url || "",
      texto_boton: item.texto_boton || "",
      orden: item.orden ?? 0,
      visible: item.visible ?? true,
      destacada: item.destacada ?? false,
    });
    setImageFile(null);
    setPreviewUrl(item.imagen_url || null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setMessage(null);
    document.getElementById("novedades-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : editing?.imagen_url || null);
  };

  const saveNews = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    let uploadedPath = null;
    try {
      if (imageFile) {
        uploadedPath = `news/${Date.now()}_${cleanFileName(imageFile.name)}`;
        const { error: uploadError } = await supabase.storage.from("novedades").upload(uploadedPath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;
      }

      const imagePath = uploadedPath || editing?.imagen_path || null;
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha: form.fecha || null,
        imagen_path: imagePath,
        imagen_url: imagePath ? null : editing?.imagen_url || null,
        url: form.url.trim() || null,
        texto_boton: form.texto_boton.trim() || null,
        orden: Number(form.orden) || 0,
        visible: form.visible,
        destacada: form.destacada,
      };

      const query = editing
        ? supabase.from("novedades").update(payload).eq("id", editing.id)
        : supabase.from("novedades").insert([payload]);
      const { error } = await query;
      if (error) throw error;

      let cleanupWarning = null;
      if (uploadedPath && editing?.imagen_path && editing.imagen_path !== uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from("novedades").remove([editing.imagen_path]);
        if (cleanupError) cleanupWarning = cleanupError.message;
      }

      await onRefresh();
      resetForm();
      setMessage(cleanupWarning
        ? { type: "error", text: `La novedad se guardó, pero no se pudo limpiar la imagen anterior: ${cleanupWarning}` }
        : { type: "success", text: editing ? "Novedad actualizada correctamente." : "Novedad creada correctamente." });
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("novedades").remove([uploadedPath]);
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (item, field) => {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("novedades").update({ [field]: !item[field] }).eq("id", item.id);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      await onRefresh();
      setMessage({ type: "success", text: field === "visible" ? "Visibilidad actualizada." : "Jerarquía actualizada." });
    }
    setBusy(false);
  };

  const deleteNews = async (item) => {
    if (!window.confirm(`¿Eliminar la novedad “${item.titulo}”?`)) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("novedades").delete().eq("id", item.id);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      let cleanupError = null;
      if (item.imagen_path) {
        const result = await supabase.storage.from("novedades").remove([item.imagen_path]);
        cleanupError = result.error;
      }
      await onRefresh();
      if (editing?.id === item.id) resetForm();
      setMessage(cleanupError
        ? { type: "error", text: `La novedad se eliminó, pero no se pudo limpiar su imagen: ${cleanupError.message}` }
        : { type: "success", text: "Novedad eliminada correctamente." });
    }
    setBusy(false);
  };

  return (
    <section id="admin-novedades" className="rounded-[2rem] border border-neon/20 bg-[#0d0d0d] p-5 shadow-glow sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Novedades</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white">{editing ? "Editar noticia" : "Crear noticia"}</h2>
        </div>
        {editing ? (
          <button type="button" onClick={resetForm} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-white/70 transition hover:text-white disabled:opacity-50">
            <X size={15} /> Cancelar edición
          </button>
        ) : null}
      </div>

      {message ? (
        <div role="status" className={`mt-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>
          {message.text}
        </div>
      ) : null}

      <form id="novedades-form" onSubmit={saveNews} className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <input required value={form.titulo} onChange={(event) => updateField("titulo", event.target.value)} placeholder="Título" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
          <textarea rows={5} value={form.descripcion} onChange={(event) => updateField("descripcion", event.target.value)} placeholder="Descripción" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-white/50">Fecha editorial<input type="date" value={form.fecha} onChange={(event) => updateField("fecha", event.target.value)} className="block w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm normal-case tracking-normal text-white outline-none focus:border-neon" /></label>
            <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-white/50">Orden<input type="number" value={form.orden} onChange={(event) => updateField("orden", event.target.value)} className="block w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm normal-case tracking-normal text-white outline-none focus:border-neon" /></label>
          </div>
          <input type="url" value={form.url} onChange={(event) => updateField("url", event.target.value)} placeholder="URL opcional (https://...)" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
          <input value={form.texto_boton} onChange={(event) => updateField("texto_boton", event.target.value)} placeholder="Texto del botón (ej. ESCUCHAR)" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
        </div>

        <div className="space-y-5">
          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/20 bg-black/60 text-center transition hover:border-neon">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={selectImage} className="sr-only" />
            {previewUrl ? <img src={previewUrl} alt="Vista previa de la novedad" className="h-64 w-full object-contain" /> : <span className="flex flex-col items-center gap-3 px-4 text-sm text-white/60"><ImagePlus className="text-neon" /> Elegir imagen</span>}
          </label>
          <p className="text-xs leading-5 text-white/40">Al editar, la imagen actual se conserva si no elegís otra. Una imagen reemplazada se elimina del bucket.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white/75"><input type="checkbox" checked={form.visible} onChange={(event) => updateField("visible", event.target.checked)} className="h-4 w-4 accent-[#ff0033]" /> Visible</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white/75"><input type="checkbox" checked={form.destacada} onChange={(event) => updateField("destacada", event.target.checked)} className="h-4 w-4 accent-[#ff0033]" /> Destacada</label>
          </div>
          <button disabled={busy} type="submit" className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.3em] text-neon transition hover:bg-neon/20 disabled:opacity-50">
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} {editing ? "Guardar cambios" : "Crear novedad"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h3 className="text-lg font-black uppercase tracking-[0.18em] text-white">Noticias cargadas</h3>
        <div className="mt-5 grid gap-4">
          {novedades.map((item) => (
            <article key={item.id} className="grid gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 md:grid-cols-[88px_1fr_auto] md:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white/5">{item.imagen_url ? <img src={item.imagen_url} alt="" className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em]">
                  <span className={item.visible ? "text-emerald-300" : "text-white/35"}>{item.visible ? "Visible" : "Oculta"}</span>
                  {item.destacada ? <span className="text-neon">Destacada</span> : null}
                  <span className="text-white/35">Orden {item.orden ?? 0}</span>
                </div>
                <p className="mt-2 truncate font-semibold text-white">{item.titulo}</p>
                <p className="mt-1 text-xs text-white/45">{item.fecha || "Sin fecha editorial"}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button title="Editar" aria-label={`Editar ${item.titulo}`} disabled={busy} onClick={() => startEditing(item)} className="rounded-full border border-white/10 p-2.5 text-white/65 transition hover:border-neon hover:text-neon disabled:opacity-50"><Pencil size={16} /></button>
                <button title={item.visible ? "Ocultar" : "Mostrar"} aria-label={`${item.visible ? "Ocultar" : "Mostrar"} ${item.titulo}`} disabled={busy} onClick={() => updateStatus(item, "visible")} className="rounded-full border border-white/10 p-2.5 text-white/65 transition hover:border-neon hover:text-neon disabled:opacity-50">{item.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button title={item.destacada ? "Quitar destacada" : "Destacar"} aria-label={`${item.destacada ? "Quitar de destacadas" : "Destacar"} ${item.titulo}`} disabled={busy} onClick={() => updateStatus(item, "destacada")} className={`rounded-full border p-2.5 transition disabled:opacity-50 ${item.destacada ? "border-neon/40 text-neon" : "border-white/10 text-white/65 hover:border-neon hover:text-neon"}`}><Star size={16} /></button>
                <button title="Eliminar" aria-label={`Eliminar ${item.titulo}`} disabled={busy} onClick={() => deleteNews(item)} className="rounded-full border border-red-400/20 p-2.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
          {!novedades.length ? <p className="rounded-3xl border border-white/10 p-6 text-sm text-white/45">Todavía no hay novedades cargadas.</p> : null}
        </div>
      </div>
    </section>
  );
}
