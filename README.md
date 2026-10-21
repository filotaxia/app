## Filotaxia

Terrarios vivos que suenan. Escaneá el QR del terrario y escuchá su pieza.
HTML, CSS y JS vanilla con ES modules. Sin build ni dependencias de npm.

```bash
npx serve . -l 4180
```

Abrir `http://localhost:4180`.

Tests de la lógica (formato, QR, partitura del sonido), sin dependencias:

```bash
node --test 'tests/**/*.test.js'
```

## Datos y publicación

- Los terrarios viven en **Supabase** (tabla `terrarios`). Los cambios de estructura son migraciones SQL en `supabase/migrations/`.
- La app se publica en **GitHub Pages** desde `main`, en **https://app.filotaxia.com** (archivo `CNAME`; en el DNS de Hostinger, `CNAME app → filotaxia.github.io`). Cada push a `main` publica.
- Cada terrario tiene un QR definitivo: `https://app.filotaxia.com/t/<código>`. El código lo genera Supabase y no cambia nunca. Se cargan, descargan e imprimen desde el panel privado `https://app.filotaxia.com/admin/` (login de Supabase, solo los emails de la tabla `admins`).
- `.github/workflows/catalogo.yml` corre cada 2 días: mantiene despierto Supabase (plan gratis) y guarda una copia del catálogo en `catalogo.json`, que la app usa si Supabase no responde.

- `CLAUDE.md`: arquitectura y convenciones de código.
- `DESIGN.md`: design system.
