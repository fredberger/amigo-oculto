// app/api/reveal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EVENT_ID = 1;

export async function POST(_req: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: participant, error } = await supabase
        .from("participants")
        .select("*")
        .eq("event_id", EVENT_ID)
        .eq("email", user.email)
        .single();

    if (error || !participant) {
        return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
    }

    const { error: updError } = await supabase
        .from("participants")
        .update({ has_revealed: true })
        .eq("id", participant.id);

    if (updError) {
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
