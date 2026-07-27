This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Requisitos previos

- Node.js 18 o superior
- npm, pnpm o yarn
- Cuenta en Supabase

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_EMAIL=tu-email@dominio.com
```

### Instalación

```bash
npm install
```

### Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Estructura de rutas

- `/` → Landing page pública de TERRA
- `/admin` → Panel de administración protegido por Supabase Auth

### Supabase

1. En Supabase crea las tablas ejecutando el script SQL en `supabase-schema.sql`.
2. Crea los buckets de Storage:
   - `flyers`
   - `discografia`
   - `merch`
3. Ajusta permisos de bucket para permitir lectura pública de archivos.

### Scripts disponibles

- `npm run dev` → inicia el servidor de desarrollo.
- `npm run build` → genera la aplicación para producción.
- `npm run start` → ejecuta la app en modo producción.
- `npm run lint` → ejecuta ESLint.

### Notas importantes

- El panel de admin solo permite acceso al email definido en `NEXT_PUBLIC_ADMIN_EMAIL`.
- En la landing, los botones de entradas redirigen a Instagram.
- No hay carrito de compra en el merch; todo se gestiona por mensaje directo.

## Learn More

Para más información sobre Next.js, revisa la documentación oficial:

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Dónde está el script SQL

El script para ejecutar en Supabase está en el archivo `supabase-schema.sql` en la raíz del proyecto.

También puedes crear los buckets con el CLI de Supabase si prefieres:

```bash
supabase storage bucket create flyers --public
supabase storage bucket create discografia --public
supabase storage bucket create merch --public
```

## Deploy on Vercel

La forma más sencilla de desplegar es usar Vercel.

- [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)


To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
