// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    // depois do login, vamos sempre mandar o usuário pra home
    let response = NextResponse.redirect(new URL("/", requestUrl.origin));

    // se não veio "code" na URL, só redireciona
    if (!code) {
        return response;
    }

    // cria um client ESPECÍFICO pra route handler,
    // com acesso de leitura/escrita aos cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    response.cookies.set(name, value, options);
                },
                remove(name: string, options: any) {
                    response.cookies.set(name, "", { ...options, maxAge: 0 });
                },
            },
        }
    );

    // troca o "code" por sessão e grava o cookie na resposta
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Erro ao trocar código por sessão:", error);
        // em caso de erro, ainda redireciona, mas sem sessão
        return response;
    }

    return response;
}
