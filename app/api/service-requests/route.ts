import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestPayload = {
  locksmithSlug?: unknown;
  serviceSlug?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  addressText?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  details?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json(
      { error: "La solicitud no tiene un formato válido." },
      { status: 400 },
    );
  }

  const locksmithSlug = cleanText(payload.locksmithSlug);
  const serviceSlug = cleanText(payload.serviceSlug);
  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const addressText = cleanText(payload.addressText);
  const details = cleanText(payload.details);
  const latitude = optionalCoordinate(payload.latitude);
  const longitude = optionalCoordinate(payload.longitude);
  const phoneDigits = customerPhone.replace(/\D/g, "");

  if (!locksmithSlug || !serviceSlug) {
    return NextResponse.json(
      { error: "Falta el profesional o el servicio solicitado." },
      { status: 400 },
    );
  }

  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json(
      { error: "Introduce un número de teléfono válido." },
      { status: 400 },
    );
  }

  if (addressText.length < 3 || addressText.length > 300) {
    return NextResponse.json(
      { error: "Introduce una dirección válida para el servicio." },
      { status: 400 },
    );
  }

  if (customerName.length > 100) {
    return NextResponse.json(
      { error: "El nombre es demasiado largo." },
      { status: 400 },
    );
  }

  if (details.length > 1000) {
    return NextResponse.json(
      { error: "Los detalles no pueden superar los 1000 caracteres." },
      { status: 400 },
    );
  }

  const hasLatitude = latitude !== null;
  const hasLongitude = longitude !== null;

  if (hasLatitude !== hasLongitude) {
    return NextResponse.json(
      { error: "Las coordenadas de la ubicación están incompletas." },
      { status: 400 },
    );
  }

  if (
    latitude !== null &&
    (latitude < -90 ||
      latitude > 90 ||
      longitude === null ||
      longitude < -180 ||
      longitude > 180)
  ) {
    return NextResponse.json(
      { error: "Las coordenadas de la ubicación no son válidas." },
      { status: 400 },
    );
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return NextResponse.json(
      { error: "AbreYa todavía no tiene configurado Supabase." },
      { status: 503 },
    );
  }

  const supabase = await createClient();

  const { data: locksmithData, error: locksmithError } = await supabase
    .from("locksmiths")
    .select("id,business_name,is_available")
    .eq("slug", locksmithSlug)
    .eq("is_active", true)
    .maybeSingle();

  const locksmith = locksmithData as unknown as {
    id: string;
    business_name: string;
    is_available: boolean;
  } | null;

  if (locksmithError || !locksmith) {
    return NextResponse.json(
      { error: "El profesional seleccionado ya no está disponible." },
      { status: 404 },
    );
  }

  if (!locksmith.is_available) {
    return NextResponse.json(
      { error: "Este profesional ya no aparece como disponible." },
      { status: 409 },
    );
  }

  const { data: serviceData, error: serviceError } = await supabase
    .from("services")
    .select("id,name")
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .maybeSingle();

  const service = serviceData as unknown as {
    id: number;
    name: string;
  } | null;

  if (serviceError || !service) {
    return NextResponse.json(
      { error: "El servicio seleccionado no es válido." },
      { status: 400 },
    );
  }

  const { data: linkData, error: linkError } = await supabase
    .from("locksmith_services")
    .select("locksmith_id")
    .eq("locksmith_id", locksmith.id)
    .eq("service_id", service.id)
    .maybeSingle();

  if (linkError || !linkData) {
    return NextResponse.json(
      { error: "Este profesional no ofrece el servicio seleccionado." },
      { status: 400 },
    );
  }

  const requestId = crypto.randomUUID();
  const trackingToken = randomBytes(32).toString("base64url");
  const trackingTokenHash = createHash("sha256")
    .update(trackingToken)
    .digest("hex");
  const trackingExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase.from("service_requests").insert({
    id: requestId,
    locksmith_id: locksmith.id,
    service_id: service.id,
    customer_name: customerName || null,
    customer_phone: customerPhone,
    address_text: addressText,
    latitude,
    longitude,
    details: details || null,
    status: "pending",
    tracking_token_hash: trackingTokenHash,
    tracking_expires_at: trackingExpiresAt,
  });

  if (insertError) {
    console.error("service_requests insert error", insertError);

    return NextResponse.json(
      { error: "No hemos podido enviar tu solicitud. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      request: {
        id: requestId,
        reference: requestId.slice(0, 8).toUpperCase(),
        status: "pending",
        locksmith: locksmith.business_name,
        service: service.name,
        trackingToken,
        trackingExpiresAt,
      },
    },
    { status: 201 },
  );
}
