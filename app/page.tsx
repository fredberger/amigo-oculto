import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { DrawReveal } from "@/components/DrawReveal";

type Event = {
  id: number;
  name: string;
  draw_at: string | null;
  is_drawn: boolean;
};

type Participant = {
  id: number;
  event_id: number;
  name: string;
  email: string;
  photo_url: string | null;
  has_revealed: boolean | null;
};

type MatchResult = {
  id: number;
  receiver: {
    id: number;
    name: string;
    photo_url: string | null;
  };
};

export default async function Home() {
  // 👇 AQUI É O PULO DO GATO: await
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // evento fixo ID 1
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", 1)
    .single<Event>();

  let participant: Participant | null = null;
  let match: MatchResult | null = null;
  let participantsList: Participant[] = []; // 👈 lista para o grid

  if (event) {
    // carrega todos os participantes do evento
    const { data: allParticipants } = await supabase
      .from("participants")
      .select("*")
      .eq("event_id", event.id)
      .order("name", { ascending: true });

    participantsList = allParticipants ?? [];
  }

  if (user?.email && event) {
    const { data: p } = await supabase
      .from("participants")
      .select("*")
      .eq("event_id", event.id)
      .eq("email", user.email)
      .single<Participant>();

    participant = p ?? null;

    if (participant && event.is_drawn) {
      const { data: m } = await supabase
        .from("matches")
        .select(
          "id, receiver:receiver_id ( id, name, photo_url )"
        )
        .eq("event_id", event.id)
        .eq("giver_id", participant.id)
        .single<MatchResult>();

      match = m ?? null;
    }
  }

  // Format date consistently to avoid hydration mismatch
  const drawDate = event?.draw_at
    ? new Date(event.draw_at).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  return (
    <main>
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
            Amigo Oculto
          </p>
          <h1 className="text-xl font-semibold">
            {event?.name ?? "Amigo Oculto da Família"}
          </h1>
        </header>

        {user && (
          <form action="/auth/signout" method="post" className="flex justify-center">
            <button
              type="submit"
              className="w-20 rounded-full bg-amber-500 py-2 text-sm font-semibold text-neutral-900 hover:bg-amber-400"
            >
              Sair
            </button>
          </form>
        )}

        <section className="rounded-xl bg-neutral-800/60 border border-neutral-700/70 p-4 space-y-4 shadow-lg shadow-black/30">
          {!user && (
            <>
              <p className="text-sm text-center text-neutral-300">
                Para participar e saber quem você tirou, entre com seu email.
              </p>
              <LoginForm />
            </>
          )}

          {user && !participant && (
            <div className="space-y-2 text-center">
              <p className="text-sm">
                Oi, <span className="font-semibold">{user.email}</span> 👋
              </p>
              <p className="text-xs text-neutral-400">
                Seu email ainda não está cadastrado nesse amigo oculto.
                Fala com o organizador para te adicionar.
              </p>
            </div>
          )}

          {user && participant && !event?.is_drawn && (
            <div className="space-y-2 text-center">
              <p className="text-sm">
                Oi, <span className="font-semibold">{participant.name}</span> 👋
              </p>
              <p className="text-sm">
                O sorteio ainda <span className="font-semibold">não foi feito</span>.
              </p>
              {drawDate && (
                <p className="text-xs text-neutral-400" suppressHydrationWarning>
                  Volta aqui depois de <strong>{drawDate}</strong> para ver quem você tirou.
                </p>
              )}
            </div>
          )}


          {/* {user && participant && event?.is_drawn && match && ( */}
          {user && participant && event?.is_drawn && match && (
            <DrawReveal
              participant={participant}
              receiver={match.receiver}
              participants={participantsList}
            />
          )}

          {participant && participantsList.length > 0 && (
            <section className="mt-2 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 text-center">
                Participantes
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {participantsList.map((p) => (
                  <div
                    key={p.id}
                    className="relative overflow-hidden rounded-xl bg-neutral-800/80 border border-neutral-700/70"
                  >
                    <div className="aspect-square relative">
                      {p.photo_url ? (
                        <Image
                          src={p.photo_url}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent px-1.5 py-1">
                        <p className="text-[10px] font-medium text-neutral-50 text-center truncate">
                          {p.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {user && participant && event?.is_drawn && !match && (
            <p className="text-xs text-center text-red-400">
              Seu sorteio ainda não foi registrado. Fala com o organizador.
            </p>
          )}
        </section>

        <p className="text-[11px] text-center text-neutral-500">
          Feito com <span className="text-orange-400">🧡</span> por <span className="font-medium text-neutral-300">Fred</span> para a família.
        </p>
      </div>
    </main>
  );
}
