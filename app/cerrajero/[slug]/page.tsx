import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  KeyRound,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Timer,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ServiceRow = {
  id: number;
  slug: string;
  name: string;
};

type LocksmithServiceRow = {
  service_id: number;
  starting_price: number | string | null;
};

type LocksmithRow = {
  id: string;
  business_name: string;
  slug: string;
  phone: string | null;
  whatsapp: string | null;
  municipality: string | null;
  province: string | null;
  coverage_radius_km: number;
  is_available: boolean;
  is_active: boolean;
  verified: boolean;
  plan: "free" | "pro" | "premium";
  rating: number | string;
  review_count: number;
  description: string | null;
  years_experience: number | null;
  response_time_min: number | null;
  works_24h: boolean;
};

export default async function LocksmithProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: locksmithData, error } = await supabase
    .from("locksmiths")
    .select(
      "id,business_name,slug,phone,whatsapp,municipality,province,coverage_radius_km,is_available,is_active,verified,plan,rating,review_count,description,years_experience,response_time_min,works_24h",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const locksmith = locksmithData as unknown as LocksmithRow | null;

  if (error || !locksmith) {
    notFound();
  }

  const { data: serviceLinks } = await supabase
    .from("locksmith_services")
    .select("service_id,starting_price")
    .eq("locksmith_id", locksmith.id);

  const links = (serviceLinks ?? []) as LocksmithServiceRow[];
  const serviceIds = links.map((item) => item.service_id);

  let services: ServiceRow[] = [];

  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from("services")
      .select("id,slug,name")
      .in("id", serviceIds)
      .eq("is_active", true);

    services = (data ?? []) as ServiceRow[];
  }

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const publicServices = links
    .map((link) => {
      const service = serviceById.get(link.service_id);

      if (!service) return null;

      return {
        ...service,
        startingPrice:
          link.starting_price === null ? null : Number(link.starting_price),
      };
    })
    .filter(
      (
        service,
      ): service is ServiceRow & {
        startingPrice: number | null;
      } => Boolean(service),
    );

  const rating = Number(locksmith.rating);
  const whatsappNumber = locksmith.whatsapp?.replace(/\D/g, "") ?? "";

  return (
    <main className="min-h-screen bg-[#f6f7f4] pb-24 text-[#151a17] md:pb-10">
      <header className="bg-[#101512] text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-black tracking-[-0.03em]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfff54] text-[#111713]">
              <KeyRound size={19} strokeWidth={2.4} />
            </div>
            AbreYa
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-white/75"
          >
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e2e6e2] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 md:py-10">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                locksmith.is_available
                  ? "bg-[#e8f8da] text-[#397321]"
                  : "bg-[#f1f2f1] text-[#747b76]"
              }`}
            >
              {locksmith.is_available ? "Disponible ahora" : "No disponible"}
            </span>

            {locksmith.verified && (
              <span className="flex items-center gap-1 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#405b9b]">
                <ShieldCheck size={12} />
                Verificado
              </span>
            )}

            {locksmith.plan !== "free" && (
              <span className="rounded-full bg-[#fff5c9] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#7b6200]">
                Destacado
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-5xl">
            {locksmith.business_name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#68716b]">
            <span className="flex items-center gap-1.5">
              <Star
                size={16}
                className="fill-[#d6a900] text-[#d6a900]"
              />
              {Number.isFinite(rating) ? rating.toFixed(1) : "—"}
              <span className="font-medium text-[#939b95]">
                ({locksmith.review_count} valoraciones)
              </span>
            </span>

            {locksmith.municipality && (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {locksmith.municipality}
                {locksmith.province ? `, ${locksmith.province}` : ""}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-5 sm:px-6 md:grid-cols-[1fr_320px] md:gap-6 md:py-8">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-[#e1e5e2] bg-white p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
              Sobre el profesional
            </p>

            <p className="mt-3 text-sm leading-6 text-[#606a63] md:text-base md:leading-7">
              {locksmith.description ??
                "Este profesional todavía no ha completado su descripción."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
              <ProfileStat
                icon={<Clock3 size={18} />}
                value={
                  locksmith.response_time_min
                    ? `≈ ${locksmith.response_time_min} min`
                    : "—"
                }
                label="Respuesta"
              />
              <ProfileStat
                icon={<Wrench size={18} />}
                value={
                  locksmith.years_experience
                    ? `${locksmith.years_experience} años`
                    : "—"
                }
                label="Experiencia"
              />
              <ProfileStat
                icon={<Timer size={18} />}
                value={locksmith.works_24h ? "24 horas" : "Horario propio"}
                label="Atención"
              />
              <ProfileStat
                icon={<MapPin size={18} />}
                value={`${locksmith.coverage_radius_km} km`}
                label="Cobertura"
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-[#e1e5e2] bg-white p-5 md:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
                Servicios
              </p>
              <h2 className="mt-1.5 text-xl font-black tracking-[-0.03em]">
                Qué puede hacer por ti
              </h2>
            </div>

            <div className="mt-4 divide-y divide-[#edf0ed]">
              {publicServices.map((service) => (
                <div
                  key={service.id}
                  className="flex min-h-16 items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff7c9]">
                      <Check size={17} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black">{service.name}</span>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#909791]">
                      Desde
                    </div>
                    <div className="text-base font-black">
                      {service.startingPrice !== null &&
                      Number.isFinite(service.startingPrice)
                        ? `${service.startingPrice.toFixed(0)} €`
                        : "Consultar"}
                    </div>
                  </div>
                </div>
              ))}

              {publicServices.length === 0 && (
                <p className="py-4 text-sm text-[#737c75]">
                  Este profesional todavía no ha publicado sus servicios.
                </p>
              )}
            </div>

            <p className="mt-4 rounded-xl bg-[#f6f7f4] px-3.5 py-3 text-xs leading-5 text-[#717a73]">
              Los precios son orientativos. El profesional debe confirmar el
              importe final antes de realizar el servicio.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-[24px] bg-[#182019] p-5 text-white md:sticky md:top-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#dfff54]">
            Contactar
          </p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">
            ¿Quieres hablar con este profesional?
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            Contacta directamente. AbreYa no cobra por ponerte en contacto.
          </p>

          <Link
            href={`/solicitar/${locksmith.slug}`}
            className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-[#dfff54] px-4 text-sm font-black text-[#151a17]"
          >
            Solicitar ayuda
          </Link>

          {locksmith.phone || locksmith.whatsapp ? (
            <div className="mt-3 grid gap-2">
              {locksmith.phone && (
                <a
                  href={`tel:${locksmith.phone}`}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#dfff54] text-sm font-black text-[#151a17]"
                >
                  <Phone size={17} />
                  Llamar
                </a>
              )}

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm font-black"
                >
                  <MessageCircle size={17} />
                  WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-white/65">
              Este es un perfil de demostración. El contacto se activará cuando
              incorporemos profesionales reales.
            </div>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Link
          href={`/solicitar/${locksmith.slug}`}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#182019] text-sm font-black text-white"
        >
          Solicitar ayuda
        </Link>
      </div>
    </main>
  );
}

function ProfileStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f7f4] p-3.5">
      <div className="text-[#657068]">{icon}</div>
      <div className="mt-3 text-sm font-black">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#858e87]">
        {label}
      </div>
    </div>
  );
}
