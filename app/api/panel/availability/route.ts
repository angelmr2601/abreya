import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  let body: { isAvailable?: unknown };

  try {
    body = (await request.json()) as { isAvailable?: unknown };
  } catch {
    return NextResponse.json(
      { error: "La petición no tiene un formato válido." },
      { status: 400 },
    );
  }

  if (typeof body.isAvailable !== "boolean") {
    return NextResponse.json(
      { error: "El estado de disponibilidad no es válido." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("locksmiths")
    .update({ is_available: body.isAvailable })
    .eq("user_id", userId)
    .eq("is_active", true)
    .select("is_available")
    .maybeSingle();

  const updated = data as unknown as { is_available: boolean } | null;

  if (error || !updated) {
    return NextResponse.json(
      { error: "No se ha podido cambiar la disponibilidad." },
      { status: 400 },
    );
  }

  return NextResponse.json({ isAvailable: updated.is_available });
}
