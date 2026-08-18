import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_INDICACAO,
  COOKIE_INDICACAO_DIAS,
  CODIGO_INDICACAO,
} from "@/lib/indicacao/regras";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  supabaseConfigurado,
} from "@/lib/supabase/config";

/** Rotas que exigem celular verificado. */
const PROTEGIDAS = ["/doacao/doar", "/doacao/pedido", "/conta"];

function comCookieIndicacao(request: NextRequest, response: NextResponse) {
  const convite = request.nextUrl.pathname.match(/^\/i\/([a-z0-9]{8})$/);
  if (convite && CODIGO_INDICACAO.test(convite[1])) {
    response.cookies.set(COOKIE_INDICACAO, convite[1], {
      maxAge: COOKIE_INDICACAO_DIAS * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseConfigurado) return comCookieIndicacao(request, response);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const precisaEntrar = PROTEGIDAS.some((rota) => pathname.startsWith(rota));

  if (!user && precisaEntrar) {
    const entrar = request.nextUrl.clone();
    entrar.pathname = "/entrar";
    entrar.searchParams.set("proximo", pathname);
    return comCookieIndicacao(request, NextResponse.redirect(entrar));
  }

  return comCookieIndicacao(request, response);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|produtos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
