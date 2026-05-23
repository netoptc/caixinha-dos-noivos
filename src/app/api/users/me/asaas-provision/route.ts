import { NextResponse } from "next/server";

// Subaccount provisioning is deprecated: the platform now operates with a
// single Asaas master account and tracks per-couple balances in the database.
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint descontinuado." },
    { status: 410 },
  );
}
