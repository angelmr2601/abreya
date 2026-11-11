import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (token.length < 32 || token.length > 200) {
    return NextResponse.json(
      { error: "El enlace de seguimiento no es válido." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "AbreYa todavía no tiene configurado Supabase." },
      { status: 503 },
    );
  }

  try {
    const url = new URL("/functions/v1/track-service-request", supabaseUrl);
    url.searchParams.set("token", token);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = (await response.json()) as unknown;

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No hemos podido consultar el seguimiento." },
      { status: 502 },
    );
  }
}
