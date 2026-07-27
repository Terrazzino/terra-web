"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const sectionLinks = [
  { id: "hero", label: "INICIO" },
  { id: "historia", label: "HISTORIA" },
  { id: "discografia", label: "DISCOGRAFÍA" },
  { id: "novedades", label: "NOVEDADES" },
  { id: "el-club", label: "EL CLUB" },
  { id: "merch", label: "MERCH" },
];

// Mapeo de logos personalizados de la carpeta /public
const socialLogos = {
  spotify: "/spotify_bg.png",
  youtube: "/youtube_bg.png",
  instagram: "/instagram_bg.png",
  tiktok: "/tiktok_bg.png",
};

const getPublicUrl = (bucket, path) => {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFlash, setIsFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redes, setRedes] = useState([]);
  const [historia, setHistoria] = useState(null);
  const [discografia, setDiscografia] = useState([]);
  const [recitales, setRecitales] = useState([]);
  const [elClub, setElClub] = useState(null);
  const [merch, setMerch] = useState([]);

  const instagramUrl = redes.find((item) => (item.name || "").toLowerCase().includes("instagram"))?.url || "https://www.instagram.com/terra_okey/";

  const albums = useMemo(
    () => discografia.filter((item) => ["álbum", "album"].includes((item.tipo || "").toLowerCase())),
    [discografia],
  );
  const eps = useMemo(
    () => discografia.filter((item) => (item.tipo || "").toLowerCase() === "ep"),
    [discografia],
  );
  const singles = useMemo(
    () => discografia.filter((item) => (item.tipo || "").toLowerCase() === "single"),
    [discografia],
  );

  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [redesRes, historiaRes, discografiaRes, recitalesRes, elClubRes, merchRes] = await Promise.all([
        supabase.from("redes").select("*").order("orden", { ascending: true }),
        supabase.from("historia").select("*").limit(1).maybeSingle(),
        supabase.from("discografia").select("*").order("year", { ascending: false }),
        supabase.from("recitales").select("*").order("fecha", { ascending: true }),
        supabase.from("el_club").select("*").limit(1).maybeSingle(),
        supabase.from("merch").select("*").order("created_at", { ascending: false }),
      ]);

      setRedes(redesRes.data || []);
      setHistoria(historiaRes.data || null);
      setDiscografia(
        (discografiaRes.data || []).map((item) => ({
          ...item,
          cover_url: item.cover_url || getPublicUrl("discografia", item.cover_path),
        })),
      );
      setRecitales(
        (recitalesRes.data || []).map((item) => ({
          ...item,
          flyer_url: item.flyer_url || getPublicUrl("flyers", item.flyer_path),
        })),
      );
      setElClub(elClubRes.data || null);
      setMerch(
        (merchRes.data || []).map((item) => ({
          ...item,
          image_url: item.image_url || getPublicUrl("merch", item.image_path),
        })),
      );
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleScrollTo = (id) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
    setIsFlash(true);
    window.setTimeout(() => setIsFlash(false), 280);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER / NAVBAR */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button onClick={() => handleScrollTo("hero")} className="flex items-center gap-3 text-sm sm:text-base font-semibold uppercase tracking-[0.3em] text-white/90">
            <Image src="/logo.png" alt="TERRA" width={38} height={38} className="rounded-full bg-white/5 p-1" />
            TERRA
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            {sectionLinks.map((link) => (
              <button key={link.id} onClick={() => handleScrollTo(link.id)} className="text-xs tracking-[0.3em] text-white/70 transition hover:text-neon">
                {link.label}
              </button>
            ))}
          </nav>

          <button className="lg:hidden text-white/80" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Abrir menú">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-white/10 bg-black/95 px-5 py-5 lg:hidden"
          >
            <div className="flex flex-col gap-4">
              {sectionLinks.map((link) => (
                <button key={link.id} onClick={() => handleScrollTo(link.id)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm uppercase tracking-[0.25em] text-white/80 transition hover:border-neon hover:text-neon">
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* EFECTO DE DESTELLO AL NAVEGAR */}
      <AnimatePresence>
        {isFlash ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 bg-neon/10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,51,0.35),transparent_40%)]"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="relative overflow-hidden">
        {/* HERO SECTION */}
        <section id="hero" className="relative grid min-h-screen place-items-center px-5 py-28 sm:px-8 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,0,51,0.15),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.02),transparent)]" />
          
          <div className="relative z-10 flex max-w-6xl flex-col items-center gap-10 text-center">
            
            {/* LOGO LA MANADA TERRA AGRANDADO Y COMPLETO EN EL CÍRCULO */}
            <div className="relative flex h-56 w-56 sm:h-64 sm:w-64 items-center justify-center overflow-hidden rounded-full border-2 border-neon/40 bg-black shadow-[0_0_80px_rgba(255,0,51,0.3)] transition-transform duration-300 hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="Logo TERRA" 
                fill 
                className="object-cover" 
                priority 
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-white sm:text-6xl lg:text-7xl">TERRA Y LA MANADA</h1>
              <p className="mx-auto max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                Bienvenido a La Manada Rockeros y Rockeras, un sitio lleno de Distorpower.
              </p>
            </div>

            {/* REDES SOCIALES CON SUS RESPECTIVOS LOGOS PERSONALIZADOS */}
            <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(redes.length ? redes : [
                { name: "Spotify", label: "Spotify", url: "https://open.spotify.com/artist/30AlFx9r0tWbL9V6c38lva" },
                { name: "YouTube", label: "YouTube", url: "https://www.youtube.com/@terraok" },
                { name: "Instagram", label: "Instagram", url: "https://www.instagram.com/terra_okey/" },
                { name: "TikTok", label: "TikTok", url: "https://www.tiktok.com/@terra_okey" },
              ]).map((item) => {
                const nameKey = (item.name || item.label || "").toLowerCase();
                const matchedLogo = Object.keys(socialLogos).find((key) => nameKey.includes(key));
                const logoImg = matchedLogo ? socialLogos[matchedLogo] : "/logo.png";

                return (
                  <a
                    key={`${item.name}-${item.url}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-neon hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,0,51,0.25)]"
                  >
                    {/* LOGO PERSONALIZADO CIRCULAR DE CADA RED */}
                    <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border border-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:border-neon">
                      <Image 
                        src={logoImg} 
                        alt={item.label || item.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-[0.2em] text-white group-hover:text-neon">
                        {item.label || item.name}
                      </span>
                      <span className="text-xs text-white/60">Abrir enlace oficial</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* HISTORIA */}
        <section id="historia" className="relative border-t border-white/10 bg-[#090909] px-5 py-24 sm:px-8 lg:px-14">
          
          {/* CONTENEDOR DEL LOGO DE FONDO: COMPLETO Y MÁXIMO TAMAÑO SIN RECORTAR */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 opacity-15">
            <div className="relative h-full w-full max-w-5xl">
              <Image 
                src="/logo.png" 
                alt="Fondo historia TERRA" 
                fill 
                className="object-contain object-center" 
                priority 
              />
            </div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-4xl space-y-8">
            
            {/* CABECERA: TÍTULO Y LÍNEA NEÓN */}
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.5em] text-white/50">La leyenda</p>
              <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl">Historia</h2>
              <div className="h-1 w-24 rounded-full bg-neon" />
            </div>

            {/* RELATO COMPLETO DE LA HISTORIA */}
            <div className="space-y-6 text-base leading-8 text-white/80 sm:text-lg sm:leading-9">
              <p>
                Terra nació en plena pandemia, después del final de otro proyecto de rock. En ese momento la búsqueda era distinta: bajar un cambio, explorar sonidos más cercanos al folk y empezar de nuevo. Pero con el tiempo quedó claro que había algo imposible de dejar atrás: el rock and roll.
              </p>

              <p className="font-medium text-white/90">
                Así fue como el proyecto volvió a sus raíces y empezó a convertirse en lo que es hoy.
              </p>

              <p>
                Desde el primer día fue un camino independiente. Empezó con una sola persona y una idea, pero poco a poco fue encontrando músicos, amigos y, sobre todo, personas que decidieron hacer suyo el proyecto. Así nació <strong className="font-bold text-white">La Manada</strong>, una comunidad que no está formada solamente por quienes suben al escenario, sino también por cada rockero y rockera que acompaña este camino.
              </p>

              <p>
                Con esa misma necesidad de defender la identidad del rock nació una palabra propia: <strong className="font-bold text-neon">DistorPower</strong>. La inventamos para definir el estilo que hacemos. En una época donde a casi cualquier cosa se la llama rock, sentimos que necesitábamos un nombre para representar un sonido con guitarras al frente, actitud, melodías, emoción y la esencia del rock and roll que nos inspira.
              </p>

              <p>
                Terra tampoco funciona como una banda tradicional. Es un proyecto vivo, con un formato de trabajo flexible donde distintos músicos forman parte según cada etapa o cada show. Como un equipo, siempre hay alguien listo para salir a la cancha y mantener vivo el espíritu de La Manada.
              </p>

              <p>
                Ese camino ya nos permitió compartir escenario con grandes artistas de la escena independiente, tocar en lugares emblemáticos como Makena y llevar nuestras canciones a distintas ciudades, siempre con el mismo objetivo: demostrar que el rock sigue más vivo que nunca.
              </p>

              <div className="pt-4 border-l-2 border-neon pl-6">
                <p className="text-xl font-bold uppercase tracking-wider text-white">
                  Porque más que una banda, Terra es una forma de entender el rock.
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-neon">
                  Y esto recién empieza.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* DISCOGRAFÍA */}
        <section id="discografia" className="px-5 py-24 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-6xl space-y-10">
            
            {/* CABECERA */}
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-[0.5em] text-white/50">Sonidos de la manada</p>
              <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl">Discografía</h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-white/70">
                Explorá todos los lanzamientos oficiales de TERRA.
              </p>
            </div>

            {/* PESTAÑAS DE FILTRADO (TABS) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { id: "todos", label: "TODOS" },
                { id: "álbum", label: "ÁLBUMES" },
                { id: "ep", label: "EPS" },
                { id: "single", label: "SINGLES" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.25em] transition-all duration-300 ${
                      isActive
                        ? "border border-neon bg-neon/20 text-white shadow-[0_0_20px_rgba(255,0,51,0.4)]"
                        : "border border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* GRILLA UNIFORME DE LANZAMIENTOS */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discografia
                .filter((item) => {
                  if (activeTab === "todos") return true;
                  const tipoLower = (item.tipo || "").toLowerCase();
                  if (activeTab === "álbum") return tipoLower.includes("álbum") || tipoLower.includes("album");
                  return tipoLower === activeTab;
                })
                .map((release, index) => {
                  const spotifyLink = release.spotify_url || release.spotify || "";
                  const youtubeLink = release.youtube_url || release.youtube || "";

                  return (
                    <div
                      key={`${release.id || index}-${release.nombre || release.title}`}
                      className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5 shadow-glow transition-all duration-300 hover:border-neon/40 hover:-translate-y-1"
                    >
                      <div>
                        {/* PORTADA DEL ÁLBUM / SINGLE */}
                        <div className="relative mb-5 aspect-square w-full overflow-hidden rounded-2xl bg-white/5">
                          {release.cover_url ? (
                            <img
                              src={release.cover_url}
                              alt={release.nombre || release.title}
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
                              TERRA
                            </div>
                          )}
                          <span className="absolute top-3 left-3 rounded-full border border-black/40 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neon backdrop-blur-md">
                            {release.tipo || "SINGLE"}
                          </span>
                        </div>

                        {/* DATOS DEL LANZAMIENTO */}
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-white group-hover:text-neon transition-colors">
                            {release.nombre || release.title}
                          </h4>
                          <p className="text-xs text-white/50">
                            Lanzamiento: {release.year || release.año || "2026"}
                          </p>
                        </div>
                      </div>

                      {/* BOTONES DE SPOTIFY Y YOUTUBE */}
                      <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                        {spotifyLink ? (
                          <a
                            href={spotifyLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 rounded-full border border-neon/40 bg-neon/10 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-neon transition hover:bg-neon/20"
                          >
                            Spotify
                          </a>
                        ) : null}
                        {youtubeLink ? (
                          <a
                            href={youtubeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 rounded-full border border-white/10 bg-white/5 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/80 transition hover:border-white/30 hover:text-white"
                          >
                            YouTube
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </section>

        {/* NOVEDADES */}
        <section id="novedades" className="border-t border-white/10 bg-[#060606] px-5 py-24 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-[0.5em] text-white/50">Próximos shows</p>
              <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl">Novedades</h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-white/70">
                Estos son los próximos recitales de la manada. Para entradas, escribinos directamente por Instagram.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(recitales.length ? recitales : [
                {
                  ciudad: "Próximamente",
                  fecha: "---",
                  hora: "---",
                  direccion: "---",
                  flyer_url: null,
                },
              ]).map((item) => (
                <div key={item.id || item.direccion} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-glow transition hover:-translate-y-1">
                  <div className="relative h-[320px] overflow-hidden bg-white/5">
                    {item.flyer_url ? (
                      <img src={item.flyer_url} alt={item.ciudad} className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-white/5 text-sm uppercase tracking-[0.3em] text-white/40">Flyer no disponible</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />
                  </div>
                  <div className="space-y-3 p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-neon/80">{item.ciudad}</p>
                    <h3 className="text-2xl font-bold uppercase tracking-[0.1em] text-white">{item.fecha}</h3>
                    <div className="grid gap-2 text-sm text-white/60">
                      <p>Hora: {item.hora}</p>
                      <p>Dirección: {item.direccion}</p>
                    </div>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-neon/30 bg-neon/10 px-4 py-3 text-center text-xs uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20"
                    >
                      MANDAR MP A INSTAGRAM PARA ENTRADAS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EL CLUB DE LAS OVEJAS NEGRAS */}
        <section id="el-club" className="px-5 py-24 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] p-8 text-center shadow-glow sm:p-12">
              
              {/* LOGO EN CÍRCULO - MISMO TAMAÑO QUE EL LOGO PRINCIPAL DE LA MANADA */}
              <div className="relative mb-8 flex h-56 w-56 sm:h-64 sm:w-64 items-center justify-center overflow-hidden rounded-full border-2 border-neon/40 bg-black shadow-[0_0_80px_rgba(255,0,51,0.3)] transition-transform duration-300 hover:scale-105">
                <Image 
                  src="/logo-club.png" 
                  alt="El Club de las Ovejas Negras" 
                  fill 
                  className="object-cover" 
                />
              </div>

              {/* TÍTULO PRINCIPAL */}
              <h2 className="text-3xl font-black uppercase tracking-[0.18em] text-white sm:text-5xl">
                EL CLUB DE LAS OVEJAS NEGRAS
              </h2>

              {/* DESCRIPCIÓN (DESDE LA BASE DE DATOS / ADMIN) */}
              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/70 sm:text-base">
                {elClub?.descripcion ||
                  "Bienvenidos al Club de las Ovejas Negras! Un puente entre el under y los músicos consagrados. Un espacio para músicos, aficionados y rockeros donde buscamos aprender entre todos de la experiencia de cada uno."}
              </p>

              {/* BOTÓN VER PLAYLIST OFICIAL */}
              <a
                href={elClub?.playlist_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center justify-center rounded-full border border-neon/40 bg-neon/10 px-8 py-4 text-xs font-bold uppercase tracking-[0.35em] text-neon transition-all duration-300 hover:bg-neon/20 hover:shadow-[0_0_25px_rgba(255,0,51,0.4)] sm:text-sm"
              >
                VER PLAYLIST OFICIAL
              </a>

            </div>
          </div>
        </section>

        {/* MERCH */}
        <section id="merch" className="border-t border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-[0.5em] text-white/50">Merchandising</p>
              <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl">Merch</h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-white/70">
                Productos oficiales TERRA con DISTORPOWER. No hay carrito online: para adquirir merchandising, escribinos por Instagram.
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(merch.length ? merch : [{ nombre: "Próximamente", image_url: null }]).map((item) => (
                <div key={item.id || item.nombre} className="group rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6 shadow-glow transition-all duration-300 hover:border-neon/40">
                  
                  {/* CONTENEDOR DE LA IMAGEN CON HOVER Y SIN RECORTES */}
                  <div className="relative mb-6 h-80 overflow-hidden rounded-3xl bg-black/50 p-2">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.nombre} 
                        className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">Imagen no disponible</div>
                    )}
                  </div>

                  <h3 className="text-center text-xl font-semibold uppercase tracking-[0.1em] text-white group-hover:text-neon">
                    {item.nombre}
                  </h3>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-neon/20 bg-black/80 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.45em] text-neon/70">Atención</p>
              <p className="mt-4 text-base leading-7 text-white/70">
                PARA ADQUIRIR MERCHANDISING OFICIAL, ENVIANOS UN MENSAJE PRIVADO A NUESTRO INSTAGRAM.
              </p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-neon/30 bg-neon/10 px-8 py-4 text-sm uppercase tracking-[0.35em] text-neon transition hover:bg-neon/20"
              >
                ENVIAR MENSAJE A INSTAGRAM
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* OVERLAY CARGANDO */}
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
          <div className="flex items-center gap-3 rounded-3xl border border-neon/30 bg-black/90 px-8 py-5 text-sm uppercase tracking-[0.35em] text-neon">
            <Zap size={18} /> Cargando manada...
          </div>
        </div>
      ) : null}
    </div>
  );
}