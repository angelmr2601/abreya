import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Introduce una localidad o código postal válido." },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "es",
        "User-Agent": "AbreYa/0.1 (+https://github.com/angelmr2601/abreya)",
      },
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se ha podido consultar esa ubicación." },
        { status: 502 },
      );
    }

    const results = (await response.json()) as NominatimResult[];
    const firstResult = results[0];

    if (!firstResult) {
      return NextResponse.json(
        { error: "No hemos encontrado esa ubicación en España." },
        { status: 404 },
      );
    }

    const latitude = Number(firstResult.lat);
    const longitude = Number(firstResult.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "La ubicación encontrada no tiene coordenadas válidas." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        location: {
          latitude,
          longitude,
          label: firstResult.display_name,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "No se ha podido conectar con el servicio de ubicaciones." },
      { status: 502 },
    );
  }
}
