"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  KeyRound,
  MapPin,
  Navigation,
  Phone,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ServiceOption = {
  slug: string;
  name: string;
  startingPrice: number | null;
};

type Props = {
  locksmith: {
    slug: string;
    businessName: string;
    isAvailable: boolean;
  };
  services: ServiceOption[];
};

type SubmitResponse = {
  request?: {
    id: string;
    reference: string;
    status: string;
    locksmith: string;
    service: string;
    trackingToken: string;
    trackingExpiresAt: string;
  };
  error?: string;
};

type ReverseResponse = {
  address?: {
    label: string;
  };
};

type GeocodeResponse = {
  location?: Coordinates & {
    label: string;
  };
};

export default function ServiceRequestForm({ locksmith, services }: Props) {
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] =
    useState<NonNullable<SubmitResponse["request"]> | null>(null);

  async function detectLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setMessage("Tu navegador no permite detectar la ubicación.");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const detected = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setCoordinates(detected);

        try {
          const params = new URLSearchParams({
            lat: String(detected.latitude),
            lng: String(detected.longitude),
          });

          const response = await fetch(`/api/reverse-geocode?${params}`);
          const data = (await response.json()) as ReverseResponse;

          if (response.ok && data.address?.label) {
            setAddressText(data.address.label);
            setLocationStatus("ready");
            return;
          }

          setLocationStatus("error");
          setMessage(
            "Hemos detectado tus coordenadas, pero no la dirección. Escríbela manualmente.",
          );
        } catch {
          setLocationStatus("error");
          setMessage(
            "Hemos detectado tus coordenadas, pero no la dirección. Escríbela manualmente.",
          );
        }
      },
      (error) => {
        setCoordinates(null);
        setLocationStatus("error");

        if (error.code === error.PERMISSION_DENIED) {
          setMessage(
            "No tenemos permiso para usar tu ubicación. Puedes escribir la dirección manualmente.",
          );
          return;
        }

        if (error.code === error.TIMEOUT) {
          setMessage(
            "No hemos conseguido detectar tu ubicación a tiempo. Puedes escribirla manualmente.",
          );
          return;
        }

        setMessage(
          "No hemos podido detectar tu ubicación. Puedes escribirla manualmente.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  async function resolveManualCoordinates() {
    if (coordinates || addressText.trim().length < 3) {
      return coordinates;
    }

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(addressText.trim())}`,
      );
      const data = (await response.json()) as GeocodeResponse;

      if (response.ok && data.location) {
        return {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        };
      }
    } catch {
      // La dirección sigue siendo válida aunque no podamos geocodificarla.
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || createdRequest) return;

    if (!locksmith.isAvailable) {
      setMessage(
        "Este profesional ya no aparece como disponible. Vuelve al buscador para elegir otro.",
      );
      return;
    }

    if (!serviceSlug) {
      setMessage("Selecciona el servicio que necesitas.");
      return;
    }

    if (customerPhone.replace(/\D/g, "").length < 7) {
      setMessage("Introduce un número de teléfono válido.");
      return;
    }

    if (addressText.trim().length < 3) {
      setMessage("Indica dónde necesitas el servicio.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const resolvedCoordinates = await resolveManualCoordinates();

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locksmithSlug: locksmith.slug,
          serviceSlug,
          customerName,
          customerPhone,
          addressText,
          latitude: resolvedCoordinates?.latitude ?? null,
          longitude: resolvedCoordinates?.longitude ?? null,
          details,
        }),
      });

      const data = (await response.json()) as SubmitResponse;

      if (!response.ok || !data.request) {
        throw new Error(
          data.error ?? "No hemos podido registrar la solicitud.",
        );
      }

      window.localStorage.setItem(
        "abreya:lastTrackingToken",
        data.request.trackingToken,
      );
      setCreatedRequest(data.request);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No hemos podido registrar la solicitud.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (createdRequest) {
    return (
      <section className="rounded-[26px] border border-[#dfe5df] bg-white p-6 text-center shadow-[0_14px_40px_rgba(20,30,23,0.05)] md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f8da] text-[#397321]">
          <CheckCircle2 size={28} strokeWidth={2.2} />
        </div>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
          Solicitud registrada
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
          Ya está guardada en AbreYa
        </h2>

        <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-[#f6f7f4] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#818982]">
            Referencia
          </div>
          <div className="mt-1 font-mono text-xl font-black">
            {createdRequest.reference}
          </div>
          <div className="mt-3 text-sm font-bold">
            {createdRequest.service}
          </div>
          <div className="mt-1 text-xs text-[#737c75]">
            {createdRequest.locksmith}
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#6f7972]">
          Puedes seguir el estado en tiempo real sin crear una cuenta. Guarda
          el enlace: funciona como acceso privado a esta solicitud.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/seguimiento/${createdRequest.trackingToken}`}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#182019] text-sm font-black text-white"
          >
            Seguir solicitud
          </Link>
          <Link
            href={`/cerrajero/${locksmith.slug}`}
            className="flex min-h-12 items-center justify-center rounded-2xl border border-[#dfe3df] text-sm font-black"
          >
            Volver al perfil
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[26px] border border-[#e1e5e2] bg-white p-4 shadow-[0_14px_40px_rgba(20,30,23,0.04)] sm:p-5 md:p-6"
    >
      <section>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff7c9]">
            <Wrench size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b847d]">
              1. Servicio
            </p>
            <h2 className="text-base font-black">¿Qué necesitas?</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {services.map((service) => {
            const selected = service.slug === serviceSlug;

            return (
              <button
                key={service.slug}
                type="button"
                onClick={() => setServiceSlug(service.slug)}
                className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left ${
                  selected
                    ? "border-[#1b231d] bg-[#f0f7ce]"
                    : "border-[#e2e6e2] bg-[#fafbfa]"
                }`}
              >
                <span className="text-sm font-black">{service.name}</span>
                <span className="ml-4 shrink-0 text-xs font-bold text-[#6d766f]">
                  {service.startingPrice !== null
                    ? `desde ${service.startingPrice.toFixed(0)} €`
                    : "consultar"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="my-6 h-px bg-[#edf0ed]" />

      <section>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff7c9]">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b847d]">
              2. Dirección
            </p>
            <h2 className="text-base font-black">¿Dónde es el servicio?</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={locationStatus === "loading" || submitting}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#dfff54] px-4 text-sm font-black disabled:opacity-60"
        >
          <Navigation size={17} />
          {locationStatus === "loading"
            ? "Detectando ubicación..."
            : locationStatus === "ready"
              ? "Ubicación detectada"
              : "Usar mi ubicación actual"}
        </button>

        <label
          htmlFor="request-address"
          className="mt-3 block text-xs font-black text-[#59635c]"
        >
          Dirección del servicio
        </label>
        <input
          id="request-address"
          required
          value={addressText}
          onChange={(event) => {
            setAddressText(event.target.value);
            setCoordinates(null);
            setLocationStatus("idle");
            setMessage("");
          }}
          placeholder="Ej. Calle San Pedro 12, Marchena"
          className="mt-1.5 h-14 w-full rounded-2xl border border-[#dfe4e0] px-4 text-base font-semibold outline-none placeholder:font-medium placeholder:text-[#9ba39d] focus:border-[#1b231d]"
        />

        {coordinates && locationStatus === "ready" && (
          <p className="mt-2 text-xs font-bold text-[#557128]">
            Coordenadas GPS asociadas a esta dirección.
          </p>
        )}
      </section>

      <div className="my-6 h-px bg-[#edf0ed]" />

      <section>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff7c9]">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b847d]">
              3. Contacto
            </p>
            <h2 className="text-base font-black">¿Cómo te localizamos?</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="request-name"
              className="block text-xs font-black text-[#59635c]"
            >
              Nombre <span className="font-medium text-[#929a94]">(opcional)</span>
            </label>
            <div className="relative mt-1.5">
              <UserRound
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c857e]"
              />
              <input
                id="request-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                maxLength={100}
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-14 w-full rounded-2xl border border-[#dfe4e0] pl-11 pr-4 text-base font-semibold outline-none placeholder:font-medium placeholder:text-[#9ba39d] focus:border-[#1b231d]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="request-phone"
              className="block text-xs font-black text-[#59635c]"
            >
              Teléfono
            </label>
            <div className="relative mt-1.5">
              <Phone
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c857e]"
              />
              <input
                id="request-phone"
                required
                type="tel"
                value={customerPhone}
                onChange={(event) => {
                  setCustomerPhone(event.target.value);
                  setMessage("");
                }}
                maxLength={30}
                autoComplete="tel"
                inputMode="tel"
                placeholder="Ej. 600 123 123"
                className="h-14 w-full rounded-2xl border border-[#dfe4e0] pl-11 pr-4 text-base font-semibold outline-none placeholder:font-medium placeholder:text-[#9ba39d] focus:border-[#1b231d]"
              />
            </div>
          </div>
        </div>

        <label
          htmlFor="request-details"
          className="mt-4 block text-xs font-black text-[#59635c]"
        >
          Detalles <span className="font-medium text-[#929a94]">(opcional)</span>
        </label>
        <textarea
          id="request-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Ej. La llave está dentro y la puerta solo está cerrada de golpe."
          className="mt-1.5 w-full resize-none rounded-2xl border border-[#dfe4e0] px-4 py-3 text-sm font-medium leading-6 outline-none placeholder:text-[#9ba39d] focus:border-[#1b231d]"
        />
        <div className="mt-1 text-right text-[10px] font-bold text-[#9aa19c]">
          {details.length}/1000
        </div>
      </section>

      {message && (
        <div className="mt-4 rounded-2xl bg-[#f4f5f3] px-4 py-3 text-xs font-semibold leading-5 text-[#5f6962]">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={
          submitting ||
          !locksmith.isAvailable ||
          services.length === 0
        }
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={18} />
        {submitting ? "Enviando solicitud..." : "Solicitar ayuda"}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8b948e]">
        <KeyRound size={13} />
        No necesitas crear una cuenta.
      </div>
    </form>
  );
}
