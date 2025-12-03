// app/api/draw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
        },
    }
);

const EVENT_ID = 1;

async function handleDraw(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret");

    if (secret !== process.env.DRAW_SECRET) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: participants, error } = await supabaseAdmin
        .from("participants")
        .select("*")
        .eq("event_id", EVENT_ID);

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "db error" }, { status: 500 });
    }

    if (!participants || participants.length < 2) {
        return NextResponse.json(
            { error: "Precisa de pelo menos 2 participantes" },
            { status: 400 }
        );
    }

    const givers = [...participants];
    const receivers = [...participants];

    // shuffle
    for (let i = receivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }

    // ninguém pode pegar a si mesmo
    for (let i = 0; i < givers.length; i++) {
        if (givers[i].id === receivers[i].id) {
            const swapWith = (i + 1) % receivers.length;
            [receivers[i], receivers[swapWith]] = [
                receivers[swapWith],
                receivers[i],
            ];
        }
    }

    const payload = givers.map((g, idx) => ({
        event_id: EVENT_ID,
        giver_id: g.id,
        receiver_id: receivers[idx].id,
    }));

    const { error: upsertError } = await supabaseAdmin
        .from("matches")
        .upsert(payload, { onConflict: "event_id,giver_id" });

    if (upsertError) {
        console.error(upsertError);
        return NextResponse.json({ error: "matches error" }, { status: 500 });
    }

    const { error: updateEventError } = await supabaseAdmin
        .from("events")
        .update({ is_drawn: true })
        .eq("id", EVENT_ID);

    if (updateEventError) {
        console.error(updateEventError);
        return NextResponse.json({ error: "event error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: payload.length });
}

// permite GET e POST
export async function GET(req: NextRequest) {
    return handleDraw(req);
}

export async function POST(req: NextRequest) {
    return handleDraw(req);
}
