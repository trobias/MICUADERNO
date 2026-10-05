// Solo para las pruebas de la nube: deja importar los .ts del servidor sin extensión (como hace Next).
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(spec, ctx, next) {
    try { return await next(spec, ctx); }
    catch (e) {
      if ((spec.startsWith('./') || spec.startsWith('../')) && !/\\.[cm]?[jt]s$/.test(spec)) return next(spec + '.ts', ctx);
      throw e;
    }
  }`), import.meta.url);
