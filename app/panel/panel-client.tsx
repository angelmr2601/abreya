"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Power,
  Route,
  X,
} from "lucide-react";

type RequestStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "completed"
  | "cancelled";

type PanelRequest = {
  id: string;
  service_id: number;
  serviceName: string;
  customer_name: string | null;
  customer_phone: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  details: string | null;
  status: RequestStatus;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
};

type Props = {
  locksmith: {
    businessName: string;
    isAvailable: boolean;
  };
  requests: PanelRequest[];
};

const statusMeta: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-[#fff5c9] text-[#7b6200]",
  },
  accepted: {
    label: "Aceptada",
    className: "bg-[#e8f8da] text-[#397321]",
  },
  on_the_way: {
    label: "En camino",
    className: "bg-[#e8f1ff] text-[#315d9a]",
  },
  completed: {
    label: "Completada",
    className: "bg-[#eef1ee] text-[#566058]",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-[#f7eaea] text-[#95504c]",
  },
};

export default function PanelClient({ locksmith, requests }: Props) {
  const router = useRouter();
  const [availability, setAvailability] = useState(locksmith.isAvailable);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "pending").length,
      accepted: requests.filter((request) => request.status === "accepted").length,
      onTheWay: requests.filter((request) => request.status === "on_the_way").length,
    }),
    [requests],
  );

  async function toggleAvailability() {
    if (availabilityLoading) return;

    setAvailabilityLoading(true);
    setMessage("");

    try {
      const nextValue = !availability;
      const response = await fetch("/api/panel/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextValue }),
      });
      const data = (await response.json()) as {
        isAvailable?: boolean;
        error?: string;
      };

      if (!response.ok || typeof data.isAvailable !== "boolean") {
        throw new Error(data.error ?? "No se ha podido cambiar la disponibilidad.");
      }

      setAvailability(data.isAvailable);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido cambiar la disponibilidad.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function updateStatus(requestId: string, status: RequestStatus) {
    if (updatingId) return;

    setUpdatingId(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/panel/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        status?: RequestStatus;
        error?: string;
      };

      if (!response.ok || !data.status) {
        throw new Error(data.error ?? "No se ha podido actualizar la solicitud.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido actualizar la solicitud.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-8">
      <section className="rounded-[24px] bg-[#182019] p-5 text-white md:flex md:items-center md:justify-between md:gap-6 md:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#dfff54]">
            Disponibilidad
          </p>
          <h2 className="mt-1.5 text-xl font-black">
            {availability ? "Estás recibiendo solicitudes" : "No apareces disponible"}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-white/60">
            {availability
              ? "Los clientes pueden encontrarte como disponible ahora."
              : "Puedes seguir gestionando trabajos abiertos, pero no aparecerás como disponible."}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAvailability}
          disabled={availabilityLoading}
          className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black md:mt-0 md:w-auto ${
            availability
              ? "bg-white text-[#182019]"
              : "bg-[#dfff54] text-[#182019]"
          }`}
        >
          <Power size={17} />
          {availabilityLoading
            ? "Actualizando..."
            : availability
              ? "Marcar no disponible"
              : "Marcar disponible"}
        </button>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
        <SummaryCard label="Pendientes" value={counts.pending} />
        <SummaryCard label="Aceptadas" value={counts.accepted} />
        <SummaryCard label="En camino" value={counts.onTheWay} />
      </section>

      {message && (
        <div className="mt-4 rounded-2xl bg-[#f7eaea] px-4 py-3 text-sm font-semibold text-[#8b4e49]">
          {message}
        </div>
      )}

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
              Solicitudes
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
              Trabajos recibidos
            </h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#626c65]">
            {requests.length}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-[#e0e5e0] bg-white p-8 text-center">
            <Clock3 className="mx-auto text-[#7d867f]" size={26} />
            <h3 className="mt-4 text-lg font-black">Todavía no hay solicitudes</h3>
            <p className="mt-2 text-sm text-[#737c75]">
              Las nuevas peticiones aparecerán aquí cuando un cliente solicite ayuda.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                loading={updatingId === request.id}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e1e5e2] bg-white p-3.5 md:p-5">
      <div className="text-2xl font-black tracking-[-0.04em] md:text-3xl">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#858e87]">
        {label}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  loading,
  onStatusChange,
}: {
  request: PanelRequest;
  loading: boolean;
  onStatusChange: (id: string, status: RequestStatus) => void;
}) {
  const meta = statusMeta[request.status];
  const createdAt = new Date(request.created_at).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const mapsUrl =
    request.latitude !== null && request.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.address_text)}`;

  return (
    <article className="rounded-[24px] border border-[#e0e5e0] bg-white p-5 shadow-[0_10px_28px_rgba(20,30,23,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${meta.className}`}>
            {meta.label}
          </span>
          <h3 className="mt-3 text-lg font-black tracking-[-0.025em]">
            {request.serviceName}
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#8a928c]">{createdAt}</p>
        </div>
        <span className="font-mono text-[10px] font-bold text-[#949c96]">
          {request.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <a
          href={`tel:${request.customer_phone}`}
          className="flex min-h-11 items-center gap-3 rounded-2xl bg-[#f6f7f4] px-3.5 text-sm font-bold"
        >
          <Phone size={16} className="shrink-0 text-[#69736c]" />
          <span className="min-w-0">
            {request.customer_name ? `${request.customer_name} · ` : ""}
            {request.customer_phone}
          </span>
        </a>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-start gap-3 rounded-2xl bg-[#f6f7f4] px-3.5 py-3 text-sm font-bold"
        >
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#69736c]" />
          <span>{request.address_text}</span>
        </a>
      </div>

      {request.details && (
        <div className="mt-3 rounded-2xl border border-[#e8ebe8] px-3.5 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8b938d]">
            Detalles
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[#626d65]">{request.details}</p>
        </div>
      )}

      <RequestActions
        request={request}
        loading={loading}
        onStatusChange={onStatusChange}
      />
    </article>
  );
}

function RequestActions({
  request,
  loading,
  onStatusChange,
}: {
  request: PanelRequest;
  loading: boolean;
  onStatusChange: (id: string, status: RequestStatus) => void;
}) {
  if (request.status === "completed" || request.status === "cancelled") {
    return null;
  }

  if (request.status === "pending") {
    return (
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => onStatusChange(request.id, "accepted")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white disabled:opacity-60"
        >
          <Check size={17} />
          {loading ? "Actualizando..." : "Aceptar"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onStatusChange(request.id, "cancelled")}
          aria-label="Cancelar solicitud"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e3d6d4] text-[#95504c] disabled:opacity-60"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  if (request.status === "accepted") {
    return (
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => onStatusChange(request.id, "on_the_way")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white disabled:opacity-60"
        >
          <Route size={17} />
          {loading ? "Actualizando..." : "Marcar en camino"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onStatusChange(request.id, "cancelled")}
          aria-label="Cancelar solicitud"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e3d6d4] text-[#95504c] disabled:opacity-60"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => onStatusChange(request.id, "completed")}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#182019] text-sm font-black text-white disabled:opacity-60"
      >
        <CheckCircle2 size={17} />
        {loading ? "Actualizando..." : "Marcar completado"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => onStatusChange(request.id, "cancelled")}
        aria-label="Cancelar solicitud"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e3d6d4] text-[#95504c] disabled:opacity-60"
      >
        <X size={18} />
      </button>
    </div>
  );
}
