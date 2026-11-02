import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import PanelClient from "./panel-client";

export const instant = false;

type LocksmithRow = {
  id: string;
  business_name: string;
  slug: string;
  municipality: string | null;
  province: string | null;
  is_available: boolean;
  verified: boolean;
};

type RequestRow = {
  id: string;
  service_id: number;
  customer_name: string | null;
  customer_phone: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  details: string | null;
  status: "pending" | "accepted" | "on_the_way" | "completed" | "cancelled";
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
};

type ServiceRow = {
  id: number;
  name: string;
};

export default async function LocksmithPanelPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims?.sub) {
    redirect("/auth/login");
  }

  const { data: locksmithData } = await supabase
    .from("locksmiths")
    .select("id,business_name,slug,municipality,province,is_available,verified")
    .eq("user_id", claims.sub)
    .eq("is_active", true)
    .maybeSingle();

  const locksmith = locksmithData as unknown as LocksmithRow | null;

  if (!locksmith) {
    return (
      <main className="min-h-screen bg-[#f6f7f4] text-[#151a17]">
        <header className="bg-[#101512] text-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfff54] text-[#111713]">
                <KeyRound size={19} />
              </div>
              AbreYa
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
          <div className="rounded-[28px] border border-[#e0e5e0] bg-white p-6 text-center md:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff7c9]">
              <ShieldCheck size={26} />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
              Cuenta lista, perfil pendiente
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#69736c]">
              Has iniciado sesión correctamente, pero esta cuenta todavía no
              está asociada a un perfil de cerrajero. Por seguridad no
              mostramos ninguna solicitud hasta que exista esa relación.
            </p>
            <p className="mt-4 rounded-2xl bg-[#f6f7f4] px-4 py-3 text-xs font-semibold text-[#737c75]">
              En desarrollo podemos asociar esta cuenta al perfil demo de
              Marchena para probar la solicitud que acabas de crear.
            </p>
            <Link
              href="/"
              className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-[#182019] text-sm font-black text-white"
            >
              Volver a AbreYa
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { data: requestData } = await supabase
    .from("service_requests")
    .select(
      "id,service_id,customer_name,customer_phone,address_text,latitude,longitude,details,status,created_at,accepted_at,completed_at",
    )
    .order("created_at", { ascending: false });

  const requests = (requestData ?? []) as RequestRow[];
  const serviceIds = [...new Set(requests.map((request) => request.service_id))];

  let services: ServiceRow[] = [];

  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from("services")
      .select("id,name")
      .in("id", serviceIds);

    services = (data ?? []) as ServiceRow[];
  }

  const serviceById = new Map(services.map((service) => [service.id, service.name]));

  return (
    <main className="min-h-screen bg-[#f6f7f4] pb-10 text-[#151a17]">
      <header className="bg-[#101512] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-black">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfff54] text-[#111713]">
              <KeyRound size={19} />
            </div>
            AbreYa
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-white/60 sm:block">
              Panel profesional
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="border-b border-[#e1e5e2] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#78817a]">
            Panel del cerrajero
          </p>
          <div className="mt-2 md:flex md:items-end md:justify-between md:gap-6">
            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] md:text-4xl">
                {locksmith.business_name}
              </h1>
              <p className="mt-2 text-sm text-[#6d766f]">
                {locksmith.municipality}
                {locksmith.province ? `, ${locksmith.province}` : ""}
                {locksmith.verified ? " · Perfil verificado" : ""}
              </p>
            </div>

            <Link
              href={`/cerrajero/${locksmith.slug}`}
              className="mt-4 inline-flex text-xs font-black text-[#56621e] underline underline-offset-4 md:mt-0"
            >
              Ver perfil público
            </Link>
          </div>
        </div>
      </section>

      <PanelClient
        locksmith={{
          businessName: locksmith.business_name,
          isAvailable: locksmith.is_available,
        }}
        requests={requests.map((request) => ({
          ...request,
          serviceName: serviceById.get(request.service_id) ?? "Servicio",
        }))}
      />
    </main>
  );
}
