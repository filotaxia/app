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

- `CLAUDE.md`: arquitectura y convenciones de código.
- `DESIGN.md`: design system.
