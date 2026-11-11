import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "completed"
  | "cancelled";

const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  let body: { status?: unknown };

  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json(
      { error: "La petición no tiene un formato válido." },
      { status: 400 },
    );
  }

  if (
    typeof body.status !== "string" ||
    !["accepted", "on_the_way", "completed", "cancelled"].includes(body.status)
  ) {
    return NextResponse.json(
      { error: "El nuevo estado no es válido." },
      { status: 400 },
    );
  }

  const nextStatus = body.status as RequestStatus;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: existingData, error: readError } = await supabase
    .from("service_requests")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  const existing = existingData as unknown as {
    id: string;
    status: RequestStatus;
  } | null;

  if (readError || !existing) {
    return NextResponse.json(
      { error: "No encontramos esa solicitud o no te pertenece." },
      { status: 404 },
    );
  }

  if (!allowedTransitions[existing.status].includes(nextStatus)) {
    return NextResponse.json(
      {
        error: `No se puede pasar de ${existing.status} a ${nextStatus}.`,
      },
      { status: 409 },
    );
  }

  const { data: updatedData, error: updateError } = await supabase
    .from("service_requests")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();

  const updated = updatedData as unknown as {
    id: string;
    status: RequestStatus;
  } | null;

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "No se ha podido actualizar la solicitud." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
  });
}
