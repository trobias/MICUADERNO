// Proxy (antes middleware): renueva la sesión de Supabase en cada pedido de página y no deja abrir el
// cuaderno ni la cuenta sin sesión. Las rutas /api comprueban la sesión por su cuenta. D37.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const OPEN = ['/entrar', '/preparar'];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;
  if (!url || !key) {
    // Sin nube configurada (desarrollo local): el cuaderno abre igual, como en file://.
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;
  if (!signedIn && !OPEN.includes(path)) {
    const to = request.nextUrl.clone();
    to.pathname = '/entrar';
    to.search = '';
    const r = NextResponse.redirect(to);
    r.cookies.delete('mc_person');
    return r;
  }
  if (signedIn && path === '/entrar') {
    const to = request.nextUrl.clone();
    to.pathname = '/';
    to.search = '';
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  // Solo páginas: el cuaderno (/ e index.html), la cuenta y el ingreso. Los archivos del cuaderno (js, css,
  // íconos, sw.js) son el “cuaderno vacío” sin datos y quedan libres para que la PWA funcione sin conexión.
  matcher: ['/', '/index.html', '/entrar', '/preparar', '/cuenta/:path*']
};
