"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";

type Participant = {
    id: number;
    name: string;
    email: string;
    photo_url: string | null;
    has_revealed: boolean | null;
};

type Receiver = {
    id: number;
    name: string;
    photo_url: string | null;
};

type Props = {
    participant: Participant;
    receiver: Receiver;
    participants: Participant[];
};

type Stage = "idle" | "spinning" | "result";

/** Configs de animação */
const CARD_WIDTH = 97;          // largura aproximada de cada card (px)
const VISIBLE_CARDS = 3;        // quantos cards aparecem mais ou menos na tela
const SPEED_PX_PER_SEC = 144;   // velocidade alvo (~130px/s)
const DURATION = 30;      // duração total da animação (12s)

// distância total = velocidade * tempo
const DISTANCE_PX = SPEED_PX_PER_SEC * DURATION;

export function DrawReveal({ participant, receiver, participants }: Props) {
    const [mounted, setMounted] = useState(false);
    const [stage, setStage] = useState<Stage>(
        participant.has_revealed ? "result" : "idle"
    );
    const [saving, setSaving] = useState(false);

    // Only render after mounting to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * TRILHA DO CARROSSEL
     * - remove o próprio participante
     * - embaralha os demais (exceto o match/receiver)
     * - posiciona o match na posição antepenúltima (-3 do fim)
     * - repete a sequência 3 vezes (3 * 17)
     */
    const track = useMemo(() => {
        if (!mounted) return [];

        // remove o próprio participante
        const base = participants.filter((p) => p.id !== participant.id);

        // separa o match (receiver) dos demais
        const matchParticipant = participants.find((p) => p.id === receiver.id);
        const others = base.filter((p) => p.id !== receiver.id);

        // embaralha os demais
        const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

        // insere o match na posição antepenúltima (-3 do fim)
        let finalBase: Participant[] = [...shuffledOthers];
        if (matchParticipant) {
            const finalLength = shuffledOthers.length + 1; // após inserir o match
            const insertIndex = Math.max(0, finalLength - 3); // antepenúltima
            finalBase.splice(insertIndex, 0, matchParticipant);
        }

        // repete 3x (3 * 17)
        const repeated: Participant[] = [];
        for (let i = 0; i < 3; i++) {
            repeated.push(...finalBase);
        }
        return repeated;
    }, [participants, participant.id, receiver.id, mounted]);

    // Show loading state during SSR/hydration
    if (!mounted) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-neutral-400">Carregando...</p>
            </div>
        );
    }

    async function handleStart() {
        if (stage !== "idle") return;

        setStage("spinning");

        // espera exatamente o mesmo tempo da animação pra mostrar o resultado
        setTimeout(async () => {
            setStage("result");

            if (!participant.has_revealed) {
                try {
                    setSaving(true);
                    await fetch("/api/reveal", { method: "POST" });
                } catch (e) {
                    console.error(e);
                } finally {
                    setSaving(false);
                }
            }
        }, (DURATION * 1000) + 500);
    }

    // card final com fogos
    if (stage === "result") {
        return (
            <div className="space-y-4 text-center">
                <div className="relative">
                    {/* "fogos" simples */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-4 left-8 h-3 w-3 rounded-full bg-amber-400/80 animate-ping" />
                        <div className="absolute -top-2 right-6 h-2 w-2 rounded-full bg-amber-400/80 animate-ping" />
                        <div className="absolute bottom-0 left-1/3 h-2 w-2 rounded-full bg-sky-400/80 animate-ping" />
                        <div className="absolute -bottom-3 right-1/4 h-3 w-3 rounded-full bg-rose-400/80 animate-ping" />
                    </div>

                    <div className="relative mx-auto w-56 rounded-2xl bg-neutral-800/90 border border-amber-500/70 shadow-xl shadow-amber-900/50 p-4 flex flex-col items-center gap-3">
                        {receiver.photo_url && (
                            <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-amber-400">
                                <Image
                                    src={receiver.photo_url}
                                    alt={receiver.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                                Parabéns!
                            </p>
                            <p className="text-sm text-neutral-200">
                                Você tirou
                            </p>
                            <p className="text-lg font-semibold text-neutral-50">
                                {receiver.name}
                            </p>
                        </div>
                        {saving && (
                            <p className="text-[10px] text-neutral-400">
                                Salvando resultado...
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-[11px] text-neutral-400">
                    Você pode voltar aqui quando quiser, o resultado não muda 😉
                </p>
            </div>
        );
    }

    const isSpinning = stage === "spinning";

    return (
        <div className="space-y-4">
            <div className="text-center space-y-1">
                <p className="text-sm">
                    Oi, <span className="font-semibold">{participant.name}</span> 👋
                </p>
                <p className="text-xs text-neutral-400">
                    Clique no botão para sortear visualmente o seu amigo oculto.
                </p>
            </div>

            <div className="relative rounded-2xl bg-neutral-900 border border-neutral-700/80 p-3 overflow-hidden">
                {/* linha central, acima das fotos e alinhada verticalmente */}
                <div className="pointer-events-none absolute inset-0 flex t-0 justify-center z-20">
                    <div className="h-24 w-[4px] rounded-full bg-amber-400/80 shadow-[0_0_12px_rgba(251,146,60,0.9)]" />
                </div>

                {/* carrossel */}
                <div className="overflow-hidden relative z-10">
                    <div
                        className="flex gap-3"
                        style={{
                            transform: isSpinning
                                ? `tranneutralX(-${DISTANCE_PX}px)`
                                : "tranneutralX(0)",
                            transition: isSpinning
                                ? `transform ${DURATION * 1000}ms cubic-bezier(0.3, 0.7, 0.6, 1)`
                                : "none",
                        }}
                    >
                        {track.map((p, idx) => (
                            <div
                                key={`${p.id}-${idx}`}
                                className="shrink-0 w-20"
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-800">
                                    {p.photo_url ? (
                                        <Image
                                            src={p.photo_url}
                                            alt={p.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-neutral-400">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent px-1 pb-1 pt-1">
                                        <p className="text-[9px] text-center text-neutral-50 truncate">
                                            {p.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {!isSpinning && (
                    <button
                        onClick={handleStart}
                        className="mt-3 w-full rounded-full bg-amber-500 py-2 text-sm font-semibold text-neutral-900 hover:bg-amber-400"
                    >
                        Sortear meu amigo
                    </button>
                )}

                {isSpinning && (
                    <p className="mt-3 text-xs text-center text-neutral-400 animate-pulse">
                        Sorteando…
                    </p>
                )}
            </div>
        </div>
    );
}
