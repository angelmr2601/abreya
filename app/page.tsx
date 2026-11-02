"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  DoorOpen,
  KeyRound,
  Lock,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

const services = [
  {
    id: "door",
    icon: DoorOpen,
    title: "Me he quedado fuera",
    description: "Tengo las llaves dentro",
  },
  {
    id: "lost",
    icon: KeyRound,
    title: "He perdido las llaves",
    description: "Necesito acceder ahora",
  },
  {
    id: "broken",
    icon: Wrench,
    title: "Cerradura averiada",
    description: "No gira, está bloqueada o partida",
  },
  {
    id: "change",
    icon: Lock,
    title: "Cambiar cerradura",
    description: "Quiero sustituirla",
  },
];

export default function Home() {
  const [selectedService, setSelectedService] = useState("door");
  const [manualLocation, setManualLocation] = useState("");
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [message, setMessage] = useState("");

  const selectedServiceLabel = useMemo(
    () => services.find((service) => service.id === selectedService)?.title ?? "",
    [selectedService]
  );

  function useCurrentLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setShowManualLocation(true);
      setMessage("Tu navegador no permite usar la ubicación. Escríbela manualmente.");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setLocationStatus("ready");
        setShowManualLocation(false);
        setMessage("");
      },
      () => {
        setCoordinates(null);
        setLocationStatus("error");
        setShowManualLocation(true);
        setMessage(
          "No hemos podido obtener tu ubicación. Puedes escribirla manualmente."
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasLocation = coordinates || manualLocation.trim();

    if (!hasLocation) {
      setMessage("Necesitamos tu ubicación para buscar cerrajeros cercanos.");
      return;
    }

    setMessage(
      `Buscaremos cerrajeros para “${selectedServiceLabel}”. En el siguiente paso conectaremos esta búsqueda con profesionales reales.`
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f4] pb-24 text-[#151a17] md:pb-0">
      <section className="relative overflow-hidden bg-[#101512] text-white">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,_rgba(223,255,84,0.18),_transparent_55%)]" />

        <header className="relative z-10">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfff54] text-[#111713]">
                <KeyRound size={19} strokeWidth={2.4} />
              </div>

              <span className="text-lg font-black tracking-[-0.04em]">
                AbreYa
              </span>
            </a>

            <a
              href="#profesionales"
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur"
            >
              Soy cerrajero
            </a>
          </div>
        </header>

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 md:grid md:grid-cols-[1fr_460px] md:items-center md:gap-12 md:pb-16 md:pt-12">
          <div className="md:pb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#dfff54]" />
              Ayuda cerca de ti, cuando la necesitas
            </div>

            <h1 className="max-w-2xl text-[42px] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl md:text-6xl">
              ¿Te has quedado fuera?
              <span className="block text-[#dfff54]">AbreYa.</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/65 sm:text-base">
              Encuentra cerrajeros disponibles cerca de ti y contacta sin perder
              tiempo.
            </p>

            <div className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/65 md:flex">
              <TrustItem text="Profesionales verificados" />
              <TrustItem text="Disponibilidad real" />
              <TrustItem text="Sin registro" />
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-7 rounded-[26px] bg-white p-4 text-[#151a17] shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5 md:mt-0"
          >
            <section>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#778179]">
                Primero
              </p>

              <h2 className="mt-1.5 text-xl font-black tracking-[-0.035em]">
                ¿Dónde necesitas ayuda?
              </h2>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationStatus === "loading"}
                className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[#dfff54] px-4 text-left font-black text-[#151a17] transition active:scale-[0.99] disabled:opacity-70"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151a17] text-[#dfff54]">
                  {locationStatus === "ready" ? (
                    <Check size={19} strokeWidth={2.6} />
                  ) : (
                    <Navigation size={18} strokeWidth={2.4} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    {locationStatus === "loading"
                      ? "Obteniendo ubicación..."
                      : locationStatus === "ready"
                        ? "Ubicación detectada"
                        : "Usar mi ubicación actual"}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[#555e27]">
                    {locationStatus === "ready"
                      ? "Lista para buscar profesionales cercanos"
                      : "La forma más rápida"}
                  </div>
                </div>

                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowManualLocation((current) => !current);
                  setMessage("");
                }}
                className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-[#fafbfa] px-4 text-left text-sm font-bold text-[#4e5851]"
              >
                <MapPin size={18} />
                Escribir ubicación
                <ChevronRight className="ml-auto" size={17} />
              </button>

              {showManualLocation && (
                <div className="mt-2">
                  <label htmlFor="location" className="sr-only">
                    Localidad o código postal
                  </label>

                  <input
                    id="location"
                    value={manualLocation}
                    onChange={(event) => {
                      setManualLocation(event.target.value);
                      if (event.target.value.trim()) {
                        setCoordinates(null);
                        setLocationStatus("idle");
                      }
                      setMessage("");
                    }}
                    placeholder="Ej. Marchena o 41620"
                    autoComplete="postal-code"
                    className="h-14 w-full rounded-2xl border border-[#dfe4e0] bg-white px-4 text-base font-semibold outline-none transition placeholder:font-medium placeholder:text-[#9ba39d] focus:border-[#1b231d]"
                  />
                </div>
              )}
            </section>

            <div className="my-5 h-px bg-[#edf0ed]" />

            <section>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#778179]">
                Después
              </p>

              <h2 className="mt-1.5 text-xl font-black tracking-[-0.035em]">
                ¿Qué ha pasado?
              </h2>

              <div className="mt-3 grid gap-2">
                {services.map((service) => {
                  const Icon = service.icon;
                  const active = selectedService === service.id;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(service.id);
                        setMessage("");
                      }}
                      className={`flex min-h-[58px] items-center gap-3 rounded-2xl border px-3.5 text-left transition active:scale-[0.995] ${
                        active
                          ? "border-[#1b231d] bg-[#f0f7ce]"
                          : "border-[#e3e7e4] bg-[#fafbfa]"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          active
                            ? "bg-[#1b231d] text-[#dfff54]"
                            : "bg-white text-[#4f5952]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.25} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black">{service.title}</div>
                        <div className="mt-0.5 truncate text-[11px] font-medium text-[#7a847d]">
                          {service.description}
                        </div>
                      </div>

                      {active && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b231d] text-[#dfff54]">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {message && (
              <div className="mt-4 rounded-xl bg-[#f1f3f1] px-3.5 py-3 text-xs font-medium leading-5 text-[#5d675f]">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="mt-4 hidden h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white transition hover:bg-[#252e27] md:flex"
            >
              <Search size={18} strokeWidth={2.5} />
              Buscar cerrajeros
            </button>

            <p className="mt-3 text-center text-[11px] font-medium text-[#8b948e]">
              No necesitas crear una cuenta.
            </p>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16">
        <div className="grid gap-3 md:grid-cols-3">
          <QuickBenefit
            icon={<Navigation size={19} />}
            title="Cerca de ti"
            text="Priorizamos profesionales que puedan llegar antes."
          />
          <QuickBenefit
            icon={<Star size={19} />}
            title="Compara antes"
            text="Distancia, disponibilidad y valoraciones en un vistazo."
          />
          <QuickBenefit
            icon={<ShieldCheck size={19} />}
            title="Más confianza"
            text="Perfiles claros para saber a quién estás llamando."
          />
        </div>
      </section>

      <section
        id="profesionales"
        className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 md:pb-20"
      >
        <div className="rounded-[28px] bg-[#182019] p-6 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-9">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#dfff54]">
              Profesionales
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              ¿Eres cerrajero?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
              Tendrás un perfil gratuito para mostrar tus servicios y marcarte
              como disponible cuando quieras recibir oportunidades.
            </p>
          </div>

          <button
            type="button"
            className="mt-5 min-h-12 w-full rounded-2xl bg-[#dfff54] px-5 text-sm font-black text-[#151a17] md:mt-0 md:w-auto"
          >
            Crear perfil gratis
          </button>
        </div>
      </section>

      <footer className="border-t border-[#e1e5e2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-[#778079] sm:px-6">
          <span className="font-black text-[#1a211c]">AbreYa</span>
          <span>Tu cerrajero, cuando lo necesitas.</span>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <form onSubmit={handleSearch}>
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
          >
            <Search size={18} strokeWidth={2.5} />
            Buscar cerrajeros
          </button>
        </form>
      </div>
    </main>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Check size={14} className="text-[#dfff54]" strokeWidth={2.5} />
      {text}
    </div>
  );
}

function QuickBenefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[22px] border border-[#e1e5e2] bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff7c9] text-[#20281f]">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-black">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[#727c74]">{text}</p>
    </article>
  );
}
