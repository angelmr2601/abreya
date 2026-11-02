import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ServiceRequestForm from "./request-form";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type LocksmithRow = {
  id: string;
  business_name: string;
  slug: string;
  municipality: string | null;
  province: string | null;
  is_available: boolean;
  verified: boolean;
};

type ServiceLinkRow = {
  service_id: number;
  starting_price: number | string | null;
};

type ServiceRow = {
  id: number;
  slug: string;
  name: string;
};

export default async function ServiceRequestPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: locksmithData, error } = await supabase
    .from("locksmiths")
    .select(
      "id,business_name,slug,municipality,province,is_available,verified",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const locksmith = locksmithData as unknown as LocksmithRow | null;

  if (error || !locksmith) {
    notFound();
  }

  const { data: linksData } = await supabase
    .from("locksmith_services")
    .select("service_id,starting_price")
    .eq("locksmith_id", locksmith.id);

  const links = (linksData ?? []) as ServiceLinkRow[];
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
  const requestServices = links
    .map((link) => {
      const service = serviceById.get(link.service_id);

      if (!service) return null;

      return {
        slug: service.slug,
        name: service.name,
        startingPrice:
          link.starting_price === null ? null : Number(link.starting_price),
      };
    })
    .filter(
      (
        service,
      ): service is {
        slug: string;
        name: string;
        startingPrice: number | null;
      } => Boolean(service),
    );

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#151a17]">
      <header className="bg-[#101512] text-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
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
            href={`/cerrajero/${locksmith.slug}`}
            className="flex items-center gap-1.5 text-xs font-bold text-white/75"
          >
            <ArrowLeft size={15} />
            Volver al perfil
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e1e5e2] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
            Solicitud de servicio
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] md:text-4xl">
            Pide ayuda a {locksmith.business_name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#69726c]">
            {locksmith.municipality && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#f3f5f2] px-3 py-1.5">
                <MapPin size={14} />
                {locksmith.municipality}
                {locksmith.province ? `, ${locksmith.province}` : ""}
              </span>
            )}

            {locksmith.verified && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[#405b9b]">
                <ShieldCheck size={14} />
                Verificado
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1.5 ${
                locksmith.is_available
                  ? "bg-[#e8f8da] text-[#397321]"
                  : "bg-[#f1f2f1] text-[#747b76]"
              }`}
            >
              {locksmith.is_available ? "Disponible ahora" : "No disponible"}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 md:py-8">
        <ServiceRequestForm
          locksmith={{
            slug: locksmith.slug,
            businessName: locksmith.business_name,
            isAvailable: locksmith.is_available,
          }}
          services={requestServices}
        />
      </div>
    </main>
  );
}
