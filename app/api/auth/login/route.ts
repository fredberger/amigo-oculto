import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Cria um client específico para route handler
    let response = NextResponse.json({ success: true });
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

    // Tenta fazer login com email e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao fazer login" },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: "Sessão não criada" },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    console.error("Erro na rota de login:", error);
    return NextResponse.json(
      { error: "Erro no servidor" },
      { status: 500 }
    );
  }
}
