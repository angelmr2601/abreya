import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResult = {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  error?: string;
};

function buildAddressLabel(result: NominatimReverseResult) {
  const address = result.address ?? {};

  const streetName =
    address.road ??
    address.pedestrian ??
    address.footway ??
    address.neighbourhood ??
    address.suburb;

  const street = [streetName, address.house_number].filter(Boolean).join(" ");
  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county;

  const localityLine = [address.postcode, locality].filter(Boolean).join(" ");
  const parts = [street, localityLine, address.state]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index);

  return parts.length > 0 ? parts.join(", ") : result.display_name;
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));

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

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");
  url.searchParams.set("zoom", "18");

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
        { error: "No se ha podido obtener una dirección para esa ubicación." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as NominatimReverseResult;

    if (result.error) {
      return NextResponse.json(
        { error: "No hemos encontrado una dirección cercana." },
        { status: 404 },
      );
    }

    const label = buildAddressLabel(result);

    if (!label) {
      return NextResponse.json(
        { error: "No hemos encontrado una dirección cercana." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        address: {
          label,
          fullLabel: result.display_name ?? label,
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
