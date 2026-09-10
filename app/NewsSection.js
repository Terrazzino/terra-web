"use client";

/* eslint-disable @next/next/no-img-element */

const formatNewsDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const NewsLink = ({ item, featured = false }) => {
  if (!item.url) return null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-full border border-neon/40 bg-neon/10 font-bold uppercase text-neon transition hover:bg-neon/20 hover:shadow-[0_0_25px_rgba(255,0,51,0.25)] ${
        featured ? "px-7 py-3 text-xs tracking-[0.3em]" : "px-5 py-2.5 text-[11px] tracking-[0.24em]"
      }`}
    >
      {item.texto_boton || "MÁS INFORMACIÓN"}
    </a>
  );
};

export default function NewsSection({ novedades }) {
  const featured = novedades.find((item) => item.destacada);
  const remaining = featured ? novedades.filter((item) => item.id !== featured.id) : novedades;

  return (
    <section id="novedades" className="order-3 border-t border-white/10 bg-[#060606] px-5 py-24 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-white/50">Últimas noticias</p>
          <h2 className="text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl">Novedades</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-white/70">
            Lanzamientos, estrenos y anuncios importantes de TERRA y La Manada.
          </p>
        </div>

        {featured ? (
          <article className="group grid overflow-hidden rounded-[2rem] border border-neon/30 bg-[#0d0d0d] shadow-[0_0_45px_rgba(255,0,51,0.12)] md:grid-cols-2">
            <div className="relative min-h-72 overflow-hidden bg-white/5 md:min-h-[420px]">
              {featured.imagen_url ? (
                <img
                  src={featured.imagen_url}
                  alt={featured.titulo}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,0,51,0.2),transparent_65%)] text-sm font-bold uppercase tracking-[0.4em] text-white/40">
                  TERRA
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-neon">Noticia destacada</p>
              {featured.fecha ? <time className="mt-5 text-xs uppercase tracking-[0.25em] text-white/50" dateTime={featured.fecha}>{formatNewsDate(featured.fecha)}</time> : null}
              <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.1em] text-white sm:text-4xl">{featured.titulo}</h3>
              {featured.descripcion ? <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/70 sm:text-base">{featured.descripcion}</p> : null}
              <div className="mt-7"><NewsLink item={featured} featured /></div>
            </div>
          </article>
        ) : null}

        {remaining.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remaining.map((item) => (
              <article key={item.id} className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-glow transition hover:-translate-y-1 hover:border-neon/30">
                {item.imagen_url ? (
                  <div className="h-64 overflow-hidden bg-white/5">
                    <img src={item.imagen_url} alt={item.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  {item.fecha ? <time className="text-xs uppercase tracking-[0.28em] text-neon/80" dateTime={item.fecha}>{formatNewsDate(item.fecha)}</time> : null}
                  <h3 className="mt-3 text-xl font-bold uppercase tracking-[0.08em] text-white">{item.titulo}</h3>
                  {item.descripcion ? <p className="mt-4 flex-1 whitespace-pre-line text-sm leading-7 text-white/65">{item.descripcion}</p> : <div className="flex-1" />}
                  <div className="mt-6"><NewsLink item={item} /></div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!featured && !remaining.length ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] px-6 py-12 text-center text-sm uppercase tracking-[0.3em] text-white/40">
            Muy pronto habrá nuevas noticias de La Manada.
          </div>
        ) : null}
      </div>
    </section>
  );
}
