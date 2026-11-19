// src/app/api/admin/services/route.ts — PRE-EXISTING in Nov-5; UNCHANGED in
// the Nov-8 live build (verified: live userland module 76369 in chunk
// `_0tufgbovncig3._.js` matches the Nov-5 source behaviour exactly).
// Included here so the live admin API set is complete.
// GET: list services ordered by sort_order. POST: create (title_en and
// title_ar required; slug auto-generated from the title when absent).
// PATCH: update by id. DELETE: delete by id. Only the allowlisted fields
// below are ever written. Writes go through service_role; the caller must
// pass requireAdmin(). Does NOT write an audit row.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, errorMessage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const FIELDS = [
  "slug",
  "title_en",
  "title_ar",
  "problem_en",
  "problem_ar",
  "description_en",
  "description_ar",
  "scope_en",
  "scope_ar",
  "technologies_en",
  "technologies_ar",
  "deliverables_en",
  "deliverables_ar",
  "need_from_you_en",
  "need_from_you_ar",
  "examples_en",
  "examples_ar",
  "sort_order",
  "is_active",
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of FIELDS) if (body[field] !== undefined) row[field] = body[field];
  return row;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "service";
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const admin = serviceSupabase();
    const { data, error } = await admin.from("services").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, services: data });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body.title_en || !body.title_ar) {
      return NextResponse.json({ ok: false, error: "title_en and title_ar are required" }, { status: 400 });
    }
    const admin = serviceSupabase();
    const row = pickFields(body);
    row.slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(String(body.title_en));
    const { data, error } = await admin.from("services").insert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, service: data });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    const admin = serviceSupabase();
    const row = pickFields(body);
    if (typeof body.slug === "string" && body.slug.trim()) row.slug = slugify(body.slug);
    const { data, error } = await admin.from("services").update(row).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, service: data });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    const admin = serviceSupabase();
    const { error } = await admin.from("services").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
