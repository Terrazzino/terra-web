"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Zap, LogIn, LogOut, Upload, Trash2, Loader2 } from "lucide-react";

const AUTHORIZED_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@terra.com";

const uploadFile = async (bucket, file, path) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return data;
};

const getPublicUrl = (bucket, path) => {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
};

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [allowed, setAllowed] = useState(false);
  
  const [redes, setRedes] = useState([]);
  const [historia, setHistoria] = useState(null);
  const [discografia, setDiscografia] = useState([]);
  const [recitales, setRecitales] = useState([]);
  const [elClub, setElClub] = useState(null);
  const [merch, setMerch] = useState([]);
  
  const [form, setForm] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = session?.user?.email === AUTHORIZED_EMAIL;

  // Escuchar sesión y cambios de autenticación
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUserEmail(data.session?.user?.email || "");
      setAllowed(data.session?.user?.email === AUTHORIZED_EMAIL);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUserEmail(currentSession?.user?.email || "");
      setAllowed(currentSession?.user?.email === AUTHORIZED_EMAIL);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Carga unificada de todos los contenidos
  const fetchContent = useCallback(async () => {
    try {
      const [redesRes, historiaRes, discografiaRes, recitalesRes, elClubRes, merchRes] = await Promise.all([
        supabase.from("redes").select("*"),
        supabase.from("historia").select("*").limit(1).maybeSingle(),
        supabase.from("discografia").select("*").order("created_at", { ascending: false }),
        supabase.from("recitales").select("*").order("created_at", { ascending: false }),
        supabase.from("el_club").select("*").limit(1).maybeSingle(),
        supabase.from("merch").select("*").order("created_at", { ascending: false }),
      ]);

      setRedes(redesRes.data || []);
      setHistoria(historiaRes.data || null);
      setDiscografia(
        (discografiaRes.data || []).map((item) => ({
          ...item,
          cover_url: item.cover_url || getPublicUrl("discografia", item.cover_path),
        }))
      );
      setRecitales(
        (recitalesRes.data || []).map((item) => ({
          ...item,
          flyer_url: item.flyer_url || getPublicUrl("flyers", item.flyer_path),
        }))
      );
      setElClub(elClubRes.data || null);
      setMerch(
        (merchRes.data || []).map((item) => ({
          ...item,
          image_url: item.image_url || getPublicUrl("merch", item.image_path),
        }))
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin, fetchContent]);

const signIn = async () => {
  setErrorMessage("");
  const { error } = await supabase.auth.signInWithOtp({
    email: AUTHORIZED_EMAIL,
    options: {
      // Apunta a la ruta que acabamos de crear
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) setErrorMessage(error.message);
  else alert("¡Mail de acceso enviado! Revisa tu casilla.");
};

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleInputChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const saveHistoria = async () => {
    setSaving(true);
    setErrorMessage("");
    const textoGuardar = form.historia?.texto ?? historia?.texto ?? "";
    const { error } = await supabase.from("historia").upsert({ id: historia?.id || 1, texto: textoGuardar });
    if (error) setErrorMessage(error.message);
    else await fetchContent();
    setSaving(false);
  };

  const saveRedes = async () => {
    setSaving(true);
    setErrorMessage("");
    const updates = redes.map((item) => ({
      ...item,
      ...(form.redes?.[item.id] || {}),
    }));
    for (const update of updates) {
      const { error } = await supabase.from("redes").upsert(update);
      if (error) setErrorMessage(error.message);
    }
    await fetchContent();
    setSaving(false);
  };

  const saveElClub = async () => {
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("el_club").upsert({
      id: elClub?.id || 1,
      descripcion: form.elClub?.descripcion ?? elClub?.descripcion ?? "",
      playlist_url: form.elClub?.playlist_url ?? elClub?.playlist_url ?? "",
    });
    if (error) setErrorMessage(error.message);
    else await fetchContent();
    setSaving(false);
  };

  const addDiscografia = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formEl = event.target;
    const cover = formEl.cover.files?.[0];
    const tipo = formEl.tipo.value;
    const nombre = formEl.nombre.value;
    const year = formEl.year.value;
    const spotify_url = formEl.spotify_url.value;
    const youtube_url = formEl.youtube_url.value;

    let coverPath = null;
    if (cover) {
      const cleanFileName = cover.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      coverPath = `discografia/${Date.now()}_${cleanFileName}`;
      try {
        await uploadFile("discografia", cover, coverPath);
      } catch (err) {
        setErrorMessage("Error subiendo portada: " + err.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("discografia").insert([
      { tipo, nombre, year, spotify_url, youtube_url, cover_path: coverPath },
    ]);

    if (error) {
      setErrorMessage(error.message);
    } else {
      formEl.reset();
      await fetchContent();
    }
    setSaving(false);
  };

  const addRecital = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formEl = event.target;
    const flyer = formEl.flyer.files?.[0];
    const ciudad = formEl.ciudad.value;
    const fecha = formEl.fecha.value;
    const hora = formEl.hora.value;
    const direccion = formEl.direccion.value;
    const instagram_url = formEl.instagram_url.value;

    let flyerPath = null;
    if (flyer) {
      const cleanFileName = flyer.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      flyerPath = `flyers/${Date.now()}_${cleanFileName}`;
      try {
        await uploadFile("flyers", flyer, flyerPath);
      } catch (err) {
        setErrorMessage("Error subiendo flyer: " + err.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("recitales").insert([
      { ciudad, fecha, hora, direccion, instagram_url, flyer_path: flyerPath },
    ]);

    if (error) {
      setErrorMessage(error.message);
    } else {
      formEl.reset();
      await fetchContent();
    }
    setSaving(false);
  };

  const addMerch = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formEl = event.target;
    const image = formEl.image.files?.[0];
    const nombre = formEl.nombre.value;

    let imagePath = null;
    if (image) {
      const cleanFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      imagePath = `merch/${Date.now()}_${cleanFileName}`;
      try {
        await uploadFile("merch", image, imagePath);
      } catch (err) {
        setErrorMessage("Error subiendo imagen: " + err.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("merch").insert([{ nombre, image_path: imagePath }]);

    if (error) {
      setErrorMessage(error.message);
    } else {
      formEl.reset();
      await fetchContent();
    }
    setSaving(false);
  };

  const deleteRecord = async (table, id) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setErrorMessage(error.message);
    else await fetchContent();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="rounded-3xl border border-neon/30 bg-black/90 px-8 py-6 text-center shadow-glow">
          <Zap className="mx-auto mb-4 text-neon animate-pulse" size={30} />
          <p className="text-sm uppercase tracking-[0.35em] text-neon">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!session || !allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-5 py-12 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-10 shadow-glow text-center">
          <Image src="/logo.png" alt="TERRA" width={84} height={84} className="mx-auto mb-6 rounded-full bg-white/5 p-3" />
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Panel de Admin</h1>
          <p className="mt-4 text-sm leading-7 text-white/70">
            Iniciá sesión con el correo autorizado para administrar TERRA.
          </p>
          <button
            onClick={signIn}
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-8 py-4 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20"
          >
            <LogIn size={18} /> Iniciar sesión
          </button>
          {errorMessage ? <p className="mt-4 text-sm text-red-400">{errorMessage}</p> : null}
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">Cuenta autorizada: {AUTHORIZED_EMAIL}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-5 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#090909] p-8 shadow-glow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-neon/80">Panel privado</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.2em] text-white">Administración TERRA</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Bienvenido, {userEmail}. Aquí podés editar la historia, redes, merch, discografía, recitales y El Club.
            </p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </header>

        {errorMessage ? (
          <div className="rounded-[1.75rem] border border-red-500/20 bg-[#2a0b0b] p-6 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-2">
          {/* SECCIÓN HISTORIA Y REDES */}
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Historia & Redes</h2>
            <div className="mt-8 space-y-8">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Historia</p>
                <textarea
                  rows={6}
                  value={form.historia?.texto ?? historia?.texto ?? ""}
                  onChange={(e) => handleInputChange("historia", "texto", e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-black/80 px-5 py-4 text-sm text-white outline-none transition focus:border-neon"
                />
                <button
                  disabled={saving}
                  onClick={saveHistoria}
                  className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  Guardar historia
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Redes Sociales</p>
                <div className="grid gap-4">
                  {redes.map((item) => (
                    <div key={item.id} className="grid gap-2 rounded-3xl border border-white/10 bg-black/80 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{item.name}</p>
                      <input
                        type="text"
                        placeholder="Url oficial"
                        value={form.redes?.[item.id]?.url ?? item.url ?? ""}
                        onChange={(e) => handleInputChange("redes", item.id, { url: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-neon"
                      />
                    </div>
                  ))}
                </div>
                <button
                  disabled={saving}
                  onClick={saveRedes}
                  className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  Guardar redes
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN EL CLUB */}
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">El Club</h2>
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Descripción</p>
                <textarea
                  rows={5}
                  value={form.elClub?.descripcion ?? elClub?.descripcion ?? ""}
                  onChange={(e) => handleInputChange("elClub", "descripcion", e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-black/80 px-5 py-4 text-sm text-white outline-none transition focus:border-neon"
                />
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Playlist URL</p>
                <input
                  type="url"
                  placeholder="https://"
                  value={form.elClub?.playlist_url ?? elClub?.playlist_url ?? ""}
                  onChange={(e) => handleInputChange("elClub", "playlist_url", e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon"
                />
              </div>
              <button
                disabled={saving}
                onClick={saveElClub}
                className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                Guardar El Club
              </button>
            </div>
          </div>
        </section>

        {/* SUBIR DISCOGRAFÍA Y RECITALES */}
        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Discografía</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white">Subir lanzamiento</h2>
              </div>
              <Upload className="text-neon" size={24} />
            </div>
            <form onSubmit={addDiscografia} className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="nombre" required placeholder="Nombre" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
                <input name="tipo" required placeholder="Tipo (Álbum, EP, Single)" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="year" required placeholder="Año" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
                <input name="spotify_url" placeholder="Spotify URL" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              </div>
              <input name="youtube_url" placeholder="YouTube URL" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white transition hover:border-neon">
                <input type="file" name="cover" accept="image/*" className="hidden" />
                <span>Elegir portada</span>
                <span className="rounded-full bg-neon/10 px-3 py-1 text-neon">+ Foto</span>
              </label>
              <button disabled={saving} type="submit" className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Subir Discografía
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Recitales</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white">Agregar show</h2>
              </div>
              <Zap className="text-neon" size={24} />
            </div>
            <form onSubmit={addRecital} className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="ciudad" required placeholder="Ciudad" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
                <input name="fecha" required placeholder="Fecha" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="hora" required placeholder="Hora" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
                <input name="direccion" required placeholder="Dirección" className="rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              </div>
              <input name="instagram_url" placeholder="Link Instagram" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
              <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white transition hover:border-neon">
                <input type="file" name="flyer" accept="image/*" className="hidden" />
                <span>Elegir flyer</span>
                <span className="rounded-full bg-neon/10 px-3 py-1 text-neon">+ Foto</span>
              </label>
              <button disabled={saving} type="submit" className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Subir Recital
              </button>
            </form>
          </div>
        </section>

        {/* SUBIR MERCH */}
        <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-neon/80">Merch</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white">Subir producto</h2>
            </div>
            <Upload className="text-neon" size={24} />
          </div>
          <form onSubmit={addMerch} className="mt-8 space-y-5">
            <input name="nombre" required placeholder="Nombre del producto" className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white outline-none focus:border-neon" />
            <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-white transition hover:border-neon">
              <input type="file" name="image" accept="image/*" className="hidden" />
              <span>Elegir imagen de producto</span>
              <span className="rounded-full bg-neon/10 px-3 py-1 text-neon">+ Foto</span>
            </label>
            <button disabled={saving} type="submit" className="inline-flex items-center gap-3 rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20 disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Subir Merch
            </button>
          </form>
        </section>

        {/* REGISTROS EXISTENTES */}
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Discografía cargada</h2>
            <div className="mt-6 space-y-4">
              {discografia.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/80 p-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">{item.tipo}</p>
                    <p className="text-base font-semibold text-white">{item.nombre}</p>
                  </div>
                  <button disabled={saving} onClick={() => deleteRecord("discografia", item.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-red-300 transition hover:bg-red-500/15 disabled:opacity-50">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Recitales cargados</h2>
            <div className="mt-6 space-y-4">
              {recitales.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/80 p-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">{item.ciudad}</p>
                    <p className="text-base font-semibold text-white">{item.fecha}</p>
                  </div>
                  <button disabled={saving} onClick={() => deleteRecord("recitales", item.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-red-300 transition hover:bg-red-500/15 disabled:opacity-50">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Merch cargado</h2>
            <div className="mt-6 space-y-4">
              {merch.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/80 p-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">{item.nombre}</p>
                  </div>
                  <button disabled={saving} onClick={() => deleteRecord("merch", item.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-red-300 transition hover:bg-red-500/15 disabled:opacity-50">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-glow">
            <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Redes & Club</h2>
            <div className="mt-6 space-y-4">
              <p className="text-sm uppercase tracking-[0.25em] text-neon/80">Redes registradas</p>
              <div className="space-y-3">
                {redes.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-black/80 p-4 text-sm text-white/70">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="break-all">{item.url}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.35em] text-neon/80">El Club</p>
              <div className="rounded-3xl border border-white/10 bg-black/80 p-4 text-sm text-white/70">
                <p className="font-semibold text-white">Playlist</p>
                <p className="break-all">{elClub?.playlist_url || "Sin URL"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}