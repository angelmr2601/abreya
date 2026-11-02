import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedServices = new Set([
  "door",
  "lost",
  "broken",
  "change",
]);

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));
  const service = request.nextUrl.searchParams.get("service");
  const radiusKm = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("radius") ?? 30), 1),
    50,
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Las coordenadas no son válidas." },
      { status: 400 },
    );
  }

  if (!service || !allowedServices.has(service)) {
    return NextResponse.json(
      { error: "El servicio solicitado no es válido." },
      { status: 400 },
    );
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return NextResponse.json(
      {
        error:
          "AbreYa todavía no tiene configurado su proyecto de Supabase.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("nearby_locksmiths", {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: radiusKm,
    requested_service: service,
  });

  if (error) {
    console.error("nearby_locksmiths error", error);

    return NextResponse.json(
      { error: "No se han podido consultar los cerrajeros cercanos." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    locksmiths: data ?? [],
    search: {
      latitude,
      longitude,
      radiusKm,
      service,
    },
  });
}
