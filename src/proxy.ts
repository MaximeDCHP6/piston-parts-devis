import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ADMIN_PREFIX = "/admin";
const PROTECTED_RESELLER_PREFIX = "/espace";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const path = request.nextUrl.pathname;
  const needsAdmin = path.startsWith(PROTECTED_ADMIN_PREFIX);
  const needsReseller = path.startsWith(PROTECTED_RESELLER_PREFIX);

  if (!needsAdmin && !needsReseller) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Le contrôle de rôle (admin vs revendeur) est déjà refait par les layouts
  // `/admin` et `/espace` (voir `getCurrentUser()`), qui redirigent avant
  // tout rendu si le rôle ne correspond pas — la vraie barrière de sécurité
  // reste de toute façon les policies RLS, pas ce middleware. On évite donc
  // ici une deuxième requête profiles (+ un aller-retour réseau) sur
  // absolument chaque navigation : le middleware ne fait plus que vérifier
  // qu'une session existe.
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/espace/:path*"],
};
