"use client";

import { FormEvent, useState } from "react";

const services = [
  {
    id: "door",
    icon: "🚪",
    title: "Abrir una puerta",
    description: "Me he dejado las llaves dentro",
  },
  {
    id: "lost",
    icon: "🔑",
    title: "He perdido las llaves",
    description: "Necesito acceder a mi vivienda",
  },
  {
    id: "broken",
    icon: "🛠️",
    title: "Cerradura averiada",
    description: "La llave no gira o está partida",
  },
  {
    id: "change",
    icon: "🔐",
    title: "Cambiar cerradura",
    description: "Quiero sustituir la cerradura",
  },
];

export default function Home() {
  const [selectedService, setSelectedService] = useState("door");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!location.trim()) {
      setMessage("Introduce tu localidad o código postal.");
      return;
    }

    setMessage(
      "Perfecto. En el siguiente paso conectaremos esta búsqueda con cerrajeros reales."
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#141816]">
      {/* HEADER */}
      <header className="absolute left-0 top-0 z-20 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5ff63] text-xl">
              🔑
            </div>

            <span className="text-xl font-black tracking-[-0.04em] text-white">
              AbreYa
            </span>
          </a>

          <a
            href="#profesionales"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Soy cerrajero
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#111713] pb-20 pt-32 text-white md:pb-28 md:pt-40">
        <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-[#dfff54]/10 blur-3xl" />
        <div className="absolute -bottom-64 -left-40 h-[500px] w-[500px] rounded-full bg-[#dfff54]/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-[1fr_520px] lg:items-center">
          {/* LEFT */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
              <span className="h-2 w-2 rounded-full bg-[#b9f23d]" />
              Cerrajeros disponibles cerca de ti
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl md:text-7xl">
              ¿Te has quedado
              <span className="text-[#dfff54]"> fuera?</span>
              <br />
              AbreYa.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
              Encuentra cerrajeros disponibles en tu zona, compara opciones y
              contacta directamente con el profesional que mejor encaje contigo.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/70">
              <div className="flex items-center gap-2">
                <span className="text-[#dfff54]">✓</span>
                Profesionales verificados
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#dfff54]">✓</span>
                Disponibilidad real
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#dfff54]">✓</span>
                Sin intermediarios
              </div>
            </div>
          </div>

          {/* SEARCH CARD */}
          <form
            onSubmit={handleSearch}
            className="rounded-[28px] bg-white p-5 text-[#161a18] shadow-2xl shadow-black/30 sm:p-7"
          >
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#718078]">
                Paso 1
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                ¿Qué necesitas?
              </h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => {
                const active = selectedService === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(service.id);
                      setMessage("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#1e261f] bg-[#eefbb8]"
                        : "border-[#e3e7e4] bg-[#fafbfa] hover:border-[#b8c1bb]"
                    }`}
                  >
                    <div className="mb-3 text-2xl">{service.icon}</div>

                    <div className="text-sm font-black">{service.title}</div>

                    <div className="mt-1 text-xs leading-5 text-[#758078]">
                      {service.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-7">
              <label
                htmlFor="location"
                className="text-xs font-black uppercase tracking-[0.16em] text-[#718078]"
              >
                Paso 2
              </label>

              <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">
                ¿Dónde estás?
              </h2>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#dfe5e1] bg-[#fafbfa] px-4 focus-within:border-[#1f2922]">
                <span>📍</span>

                <input
                  id="location"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Localidad o código postal"
                  className="h-14 w-full bg-transparent text-sm font-medium outline-none placeholder:text-[#9ca49f]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1b231d] font-black text-white transition hover:bg-[#273029]"
            >
              Buscar cerrajeros
              <span>→</span>
            </button>

            {message && (
              <div className="mt-4 rounded-xl bg-[#f2f4f2] px-4 py-3 text-sm text-[#59635d]">
                {message}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-[#8a938d]">
              No necesitas crear una cuenta para buscar.
            </p>
          </form>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#718078]">
              Así de fácil
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] md:text-5xl">
              Un cerrajero cuando realmente lo necesitas.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Step
              number="01"
              title="Cuéntanos qué ocurre"
              text="Selecciona el problema y dinos dónde necesitas ayuda."
            />

            <Step
              number="02"
              title="Encuentra profesionales"
              text="Te mostramos cerrajeros disponibles y cercanos a tu ubicación."
            />

            <Step
              number="03"
              title="Contacta directamente"
              text="Elige al profesional y ponte en contacto sin complicaciones."
            />
          </div>
        </div>
      </section>

      {/* VALUE */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#718078]">
              Sin sorpresas
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] md:text-5xl">
              Saber quién viene también importa.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#68726b]">
              Queremos que puedas comparar profesionales por cercanía,
              disponibilidad, valoraciones y servicios antes de contactar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Feature icon="✓" title="Identidad verificada" />
            <Feature icon="★" title="Valoraciones reales" />
            <Feature icon="📍" title="Distancia visible" />
            <Feature icon="🟢" title="Disponible ahora" />
          </div>
        </div>
      </section>

      {/* PROFESSIONAL CTA */}
      <section
        id="profesionales"
        className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"
      >
        <div className="overflow-hidden rounded-[32px] bg-[#dfff54] p-8 sm:p-10 md:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#57621f]">
                Para profesionales
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.05em] text-[#182018] md:text-5xl">
                ¿Eres cerrajero?
                <br />
                Empieza gratis.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-[#56604d]">
                Crea tu perfil, marca cuándo estás disponible y empieza a recibir
                oportunidades de clientes de tu zona.
              </p>
            </div>

            <button className="h-14 rounded-2xl bg-[#19211b] px-7 font-black text-white transition hover:bg-[#29322b]">
              Crear perfil gratis
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e2e6e3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#707972] md:flex-row md:items-center md:justify-between md:px-8">
          <div className="font-black text-[#1b211d]">AbreYa</div>

          <div>
            © {new Date().getFullYear()} AbreYa. Encuentra tu cerrajero.
          </div>
        </div>
      </footer>
    </main>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#e1e6e2] bg-white p-7">
      <div className="mb-12 text-sm font-black text-[#8a948d]">{number}</div>

      <h3 className="text-xl font-black tracking-[-0.025em]">{title}</h3>

      <p className="mt-3 leading-7 text-[#737d76]">{text}</p>
    </article>
  );
}

function Feature({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-[22px] bg-[#f4f6f4] p-6">
      <div className="text-2xl">{icon}</div>
      <div className="font-black">{title}</div>
    </div>
  );
}