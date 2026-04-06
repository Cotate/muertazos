# Muertazos

Plataforma de predicciones para Kings League y Queens League. Los usuarios registrados predicen el ganador de cada partido por jornada, acumulan puntos y compiten en un ranking global.

## Stack

- **Next.js 16** — App Router, TypeScript, Tailwind CSS v4
- **Supabase** — base de datos PostgreSQL (RLS deshabilitado)
- **Vercel** — despliegue

## Requisitos

Variables en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Comandos

```bash
npm run dev      # servidor local en localhost:3000
npm run build    # build de producción
npm run lint     # ESLint
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública — acceso a herramientas y login |
| `/dashboard` | Vista de usuario — picks, ranking, pizarra, simulador |
| `/admin` | Vista de admin — gestión de jornadas, resultados y predicciones |
| `/ranking` | Tabla de posiciones (pública) |
| `/simulator` | Simulador de clasificación (público) |
| `/pizarra` | Pizarra táctica con jugadores arrastrables (pública) |
| `/tierlist` | Creador de tier lists de jugadores (público) |

## Autenticación

Auth propio — **no usa Supabase Auth**. Las credenciales se verifican contra la tabla `app_users` (comparación de contraseña en texto plano). La sesión se guarda en `localStorage` bajo la clave `muertazos_user` como JSON del registro del usuario.

Roles: `admin` | `user`. Las páginas comprueban el rol al cargar y redirigen a `/` si no hay sesión válida.

## Esquema de base de datos

```
competitions   id, key ('kings'|'queens'), name, color
teams          id, competition_key, name, logo_file
matchdays      id, competition_key, name, date_label, display_order, is_visible, is_locked
matches        id, matchday_id, home_team_id, away_team_id, winner_team_id, match_order
match_results  match_id (PK), home_goals, away_goals, home_penalties, away_penalties, updated_at
app_users      id (uuid), username (unique), password, role (default 'user')
predictions    id, user_id, match_id, predicted_team_id
user_points    id (uuid), user_id, matchday_id, points, updated_at
donors         username, tier ('gold'|'silver'|'bronze'), created_at
```

## Componentes compartidos

**`AppHeader`** — cabecera sticky con dos variantes:
- `minimal` — solo logo centrado (login)
- `nav` — navegación completa con drawer lateral en móvil, menú diferente por rol

**`AppFooter`** — pie de página global con muro de donadores (si existe la tabla `donors`) y botón de donación PayPal.

## Lógica de predicciones

1. Admin marca una jornada como `is_visible = true` → usuarios pueden hacer picks
2. Admin marca `is_locked = true` → picks bloqueados, se pueden ingresar resultados
3. Admin registra el `winner_team_id` en cada partido
4. Los puntos se calculan y guardan en `user_points` por jornada

## Imágenes

- Logos de equipos: `public/logos/Kings/` y `public/logos/Queens/`
- Fotos de jugadores: `public/jugadores/{NombreEquipo}/{NombreJugador}.png`
- Avatares de usuarios: `public/usuarios/{username}.jpg`

## Colores de marca

| Color | Uso |
|-------|-----|
| `#FFD300` | Kings / acento amarillo |
| `#01d6c3` | Queens / acento teal |
| `#FF5733` | Simulador / acento naranja |
| `#0a0a0a` | Fondo de la app |
