"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Route,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";

type RequestStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "completed"
  | "cancelled";

type TrackingRequest = {
  reference: string;
  status: RequestStatus;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  trackingExpiresAt: string | null;
  locksmith: string;
  responseTimeMin: number | null;
  service: string;
};

type TrackingResponse = {
  request?: TrackingRequest;
  error?: string;
};

const statusIndex: Record<Exclude<RequestStatus, "cancelled">, number> = {
  pending: 0,
  accepted: 1,
  on_the_way: 2,
  completed: 3,
};

export default function TrackingClient({ token }: { token: string }) {
  const [request, setRequest] = useState<TrackingRequest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadTracking = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);

      try {
        const response = await fetch(
          `/api/service-requests/track?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as TrackingResponse;

        if (!response.ok || !data.request) {
          throw new Error(
            data.error ?? "No hemos podido consultar tu solicitud.",
          );
        }

        setRequest(data.request);
        setError("");
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No hemos podido consultar tu solicitud.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadTracking();

    const interval = window.setInterval(() => {
      void loadTracking();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadTracking]);

  const currentIndex = useMemo(() => {
    if (!request || request.status === "cancelled") return 0;
    return statusIndex[request.status];
  }, [request]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#e0e5e0] bg-white p-8 text-center">
        <LoaderCircle className="mx-auto animate-spin text-[#56621e]" size={28} />
        <h1 className="mt-4 text-xl font-black">Consultando tu solicitud</h1>
        <p className="mt-2 text-sm text-[#727b74]">
          Estamos recuperando el estado más reciente.
        </p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-[28px] border border-[#eadbd8] bg-white p-7 text-center">
        <XCircle className="mx-auto text-[#98544f]" size={30} />
        <h1 className="mt-4 text-xl font-black">No podemos abrir el seguimiento</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#737c75]">
          {error || "El enlace no es válido o ha caducado."}
        </p>
      </div>
    );
  }

  const cancelled = request.status === "cancelled";
  const createdAt = formatDate(request.createdAt);
  const expiresAt = request.trackingExpiresAt
    ? formatDate(request.trackingExpiresAt)
    : null;

  return (
    <div>
      <section className="rounded-[28px] border border-[#e0e5e0] bg-white p-5 shadow-[0_14px_40px_rgba(20,30,23,0.04)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
              Seguimiento de solicitud
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] md:text-3xl">
              {request.service}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#6f7871]">
              {request.locksmith}
            </p>
          </div>

          <div className="rounded-2xl bg-[#f6f7f4] px-3.5 py-2 text-right">
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8b938d]">
              Referencia
            </div>
            <div className="mt-0.5 font-mono text-sm font-black">
              {request.reference}
            </div>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-6 rounded-2xl bg-[#f7eaea] p-4">
            <div className="flex items-center gap-2 font-black text-[#95504c]">
              <XCircle size={19} />
              Solicitud cancelada
            </div>
            <p className="mt-2 text-sm leading-6 text-[#795f5c]">
              Esta solicitud ya no está activa. Puedes volver al inicio para
              buscar otro profesional.
            </p>
          </div>
        ) : (
          <>
            {request.status === "pending" && request.responseTimeMin && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f0f7ce] p-4">
                <Clock3 size={19} className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-black">
                    Esperando respuesta del profesional
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#69734c]">
                    Su tiempo de respuesta habitual es de aproximadamente{" "}
                    {request.responseTimeMin} minutos.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-7">
              <TimelineStep
                title="Solicitud enviada"
                description={createdAt}
                complete={currentIndex >= 0}
                active={currentIndex === 0}
                icon={<Check size={17} />}
              />
              <TimelineStep
                title="Aceptada por el cerrajero"
                description={
                  request.acceptedAt
                    ? formatDate(request.acceptedAt)
                    : "El profesional confirmará que puede atenderte."
                }
                complete={currentIndex >= 1}
                active={currentIndex === 1}
                icon={<ShieldCheck size={17} />}
              />
              <TimelineStep
                title="El profesional va de camino"
                description="El cerrajero se está desplazando hacia la ubicación del servicio."
                complete={currentIndex >= 2}
                active={currentIndex === 2}
                icon={<Route size={17} />}
              />
              <TimelineStep
                title="Servicio completado"
                description={
                  request.completedAt
                    ? formatDate(request.completedAt)
                    : "El trabajo aparecerá aquí cuando haya finalizado."
                }
                complete={currentIndex >= 3}
                active={currentIndex === 3}
                icon={<CheckCircle2 size={17} />}
                last
              />
            </div>
          </>
        )}
      </section>

      <section className="mt-4 rounded-[22px] border border-[#e1e5e2] bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black">Actualización automática</div>
            <p className="mt-0.5 text-[11px] text-[#818a83]">
              {lastUpdated
                ? `Última consulta: ${lastUpdated.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}`
                : "Consultando estado..."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTracking(true)}
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#f2f4f1] px-3 text-xs font-black disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-[#f7eaea] px-3 py-2 text-xs font-semibold text-[#8d514c]">
            {error}
          </p>
        )}

        {expiresAt && (
          <p className="mt-3 text-[10px] leading-4 text-[#969d98]">
            Este enlace es privado y estará disponible hasta {expiresAt}. No lo
            compartas con otras personas.
          </p>
        )}
      </section>
    </div>
  );
}

function TimelineStep({
  title,
  description,
  complete,
  active,
  icon,
  last = false,
}: {
  title: string;
  description: string;
  complete: boolean;
  active: boolean;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div
          className={`absolute left-[18px] top-9 h-[calc(100%-4px)] w-0.5 ${
            complete ? "bg-[#c6df72]" : "bg-[#e7eae7]"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          complete
            ? "bg-[#dfff54] text-[#182019]"
            : "bg-[#eef0ee] text-[#929a94]"
        } ${active ? "ring-4 ring-[#eff6cf]" : ""}`}
      >
        {icon}
      </div>

      <div className={last ? "pb-0" : "pb-7"}>
        <div
          className={`text-sm font-black ${
            complete ? "text-[#182019]" : "text-[#8b938d]"
          }`}
        >
          {title}
        </div>
        <p className="mt-1 text-xs leading-5 text-[#7a837c]">{description}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
