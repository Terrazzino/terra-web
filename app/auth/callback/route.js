import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/admin';

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // El bloque try/catch previene errores si se llama desde Server Components
            }
          },
        },
      }
    );

    // Intercambia el código por la sesión de usuario y la guarda en las cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirige correctamente a la página del panel de administración
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // Si hubo error o no hubo código, vuelve al inicio
  return NextResponse.redirect(`${requestUrl.origin}`);
}