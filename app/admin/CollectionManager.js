"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-neon sm:text-sm";

function readFieldValue(field, formData) {
  if (field.kind === "checkbox") return formData.has(field.name);
  const value = String(formData.get(field.name) || "").trim();
  if (field.type === "number") return Number(value) || 0;
  if (field.emptyAsNull && !value) return null;
  return value;
}

function RecordForm({ fields, image, initialValues, submitLabel, busy, onCancel, onSubmit }) {
  const id = useId();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialValues?.[image?.urlField] || "");

  useEffect(() => {
    if (!file) {
      setPreview(initialValues?.[image?.urlField] || "");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, image?.urlField, initialValues]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map((field) => [field.name, readFieldValue(field, formData)]));
    await onSubmit(values, file);
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.wide ? "grid gap-2 sm:col-span-2" : "grid gap-2"}>
            {field.kind === "checkbox" ? (
              <span className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-semibold text-white/75">
                <input
                  className="h-4 w-4 accent-[#00d8ff]"
                  name={field.name}
                  type="checkbox"
                  defaultChecked={initialValues?.[field.name] ?? field.defaultValue ?? false}
                />
                {field.label}
              </span>
            ) : (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{field.label}</span>
                {field.kind === "textarea" ? (
                  <textarea
                    className={`${inputClass} min-h-32 resize-y`}
                    name={field.name}
                    defaultValue={initialValues?.[field.name] ?? ""}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                  />
                ) : (
                  <input
                    className={inputClass}
                    name={field.name}
                    type={field.type || "text"}
                    defaultValue={initialValues?.[field.name] ?? ""}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    inputMode={field.inputMode}
                  />
                )}
              </>
            )}
          </label>
        ))}
      </div>

      {image ? (
        <div className="grid gap-3 sm:grid-cols-[7rem_1fr] sm:items-center">
          <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/70">
            {preview ? (
              <img src={preview} alt="Vista previa" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/25"><ImagePlus size={28} /></div>
            )}
          </div>
          <label htmlFor={`${id}-asset`} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-neon/35 bg-neon/5 px-4 py-3 text-sm font-semibold text-neon">
            <ImagePlus size={18} /> {file ? file.name : image.label}
          </label>
          <input
            id={`${id}-asset`}
            className="sr-only"
            name="asset"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button disabled={busy} type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-neon px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-black disabled:opacity-50">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {submitLabel}
        </button>
        {onCancel ? (
          <button disabled={busy} type="button" onClick={onCancel} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-50">
            <X size={18} /> Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function CollectionManager({ title, description, items, fields, image, statusFields = [], busy, onSave, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const saveCreate = async (values, file) => {
    const ok = await onSave(null, values, file);
    if (ok) setShowCreate(false);
  };

  const saveEdit = async (item, values, file) => {
    const ok = await onSave(item, values, file);
    if (ok) setEditingId(null);
  };

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black uppercase tracking-[0.12em]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
        </div>
        <button disabled={busy} onClick={() => setShowCreate((value) => !value)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-neon/35 bg-neon/10 px-5 py-3 text-sm font-bold text-neon disabled:opacity-50">
          {showCreate ? <X size={18} /> : <Plus size={18} />} {showCreate ? "Cerrar" : "Agregar"}
        </button>
      </div>

      {showCreate ? (
        <div className="rounded-3xl border border-neon/25 bg-[#0b0b0b] p-4 sm:p-6">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-neon">Nuevo registro</h3>
          <RecordForm fields={fields} image={image} initialValues={{}} submitLabel="Crear" busy={busy} onCancel={() => setShowCreate(false)} onSubmit={saveCreate} />
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.length ? items.map((item) => (
          <article key={item.id} className="min-w-0 rounded-3xl border border-white/10 bg-[#0b0b0b] p-4 sm:p-6">
            {editingId === item.id ? (
              <RecordForm fields={fields} image={image} initialValues={item} submitLabel="Guardar cambios" busy={busy} onCancel={() => setEditingId(null)} onSubmit={(values, file) => saveEdit(item, values, file)} />
            ) : (
              <div className="grid min-w-0 gap-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                {image ? (
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/70">
                    {item[image.urlField] ? <img src={item[image.urlField]} alt="" className="h-full w-full object-contain" /> : null}
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="break-words text-lg font-bold text-white">{item[fields[0].name] || "Sin nombre"}</p>
                  <p className="mt-1 break-words text-sm text-white/50">{fields.slice(1, 3).map((field) => item[field.name]).filter(Boolean).join(" · ")}</p>
                  {statusFields.length ? <div className="mt-2 flex flex-wrap gap-2">{statusFields.map((status) => <span key={status.name} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${item[status.name] ? "border-neon/30 bg-neon/10 text-neon" : "border-white/10 text-white/35"}`}>{item[status.name] ? status.trueLabel : status.falseLabel}</span>)}</div> : null}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button disabled={busy} onClick={() => setEditingId(item.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white/80 disabled:opacity-50"><Pencil size={16} /> Editar</button>
                  <button disabled={busy} onClick={() => onDelete(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 text-sm text-red-300 disabled:opacity-50"><Trash2 size={16} /> Eliminar</button>
                </div>
              </div>
            )}
          </article>
        )) : <p className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">Todavía no hay registros.</p>}
      </div>
    </section>
  );
}
