# Frontend — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> El frontend YA ESTÁ IMPLEMENTADO para los 5 servicios existentes.

---

## Estado: ✅ BASE COMPLETA (pendiente: payment, analytics, websocket)

Puerto: `3002` | Framework: NextJS 14 App Router | UI: TailwindCSS + lucide-react

---

## Estructura de páginas

```
app/
├── (auth)/
│   └── login/page.tsx              ✅ — Login con email/password
└── (dashboard)/
    ├── admin/
    │   ├── page.tsx                ✅ — Dashboard con StatCards
    │   ├── slots/page.tsx          ✅ — CRUD slots, zonas, facultades con modales
    │   └── reports/page.tsx        ✅ — Estadísticas globales y por facultad
    └── user/
        ├── page.tsx                ✅ — Dashboard + mapa de slots con Leaflet
        ├── reservations/page.tsx   ✅ — Mis reservaciones, cancelar
        ├── vehicle/page.tsx        ✅ — Registrar/ver vehículo
        └── settings/page.tsx       ✅ — Actualizar perfil
```

---

## Componentes clave

```
components/
├── auth/
│   ├── LoginForm.tsx              ✅ — react-hook-form + zod validation
│   ├── LoginHero.tsx              ✅ — panel visual izquierdo
│   └── AuthPageLayout.tsx         ✅
├── layout/
│   ├── DashboardShell.tsx         ✅ — layout con sidebar
│   └── Sidebar.tsx                ✅ — navegación según rol
├── map/
│   ├── MapView.tsx                ✅ — container del mapa
│   ├── MapInner.tsx               ✅ — lógica Leaflet (dynamic import, SSR false)
│   ├── MapController.tsx          ✅
│   ├── SlotDetailCard.tsx         ✅ — popup al clickar un slot
│   ├── ActionToast.tsx            ✅
│   └── mapConstants.ts            ✅ — coordenadas UCE, colores por estado
├── admin/
│   ├── StatCard.tsx               ✅
│   └── slots/
│       ├── SlotsPage.tsx          ✅ — página principal con tabs (Facultades, Zonas, Slots)
│       ├── SlotsGrid.tsx          ✅
│       ├── SlotCard.tsx           ✅
│       ├── SlotModal.tsx          ✅ — crear/editar slot
│       ├── FacultyModal.tsx       ✅
│       └── ZoneModal.tsx          ✅
└── user/
    ├── UserDashboard.tsx          ✅
    ├── ZoneMenu.tsx               ✅
    └── SmartSuggestionCard.tsx    ✅
```

---

## Services layer

Todos los servicios usan `lib/api.ts` (axios instance con base URL del gateway):

```typescript
// lib/api.ts
export const authApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL })
export const parkingApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_PARKING_API_URL })
// etc...
// interceptor automático añade Authorization: Bearer <token>
```

Services implementados:
- `services/parking.service.ts` ✅ — faculties, zones, slots, stats (todas las funciones)
- `services/reservation.service.ts` ✅ — CRUD reservaciones
- `services/user.service.ts` ✅ — perfil, actualizar

---

## Variables de entorno frontend

```env
# En QA/PROD: todas apuntan al mismo gateway
NEXT_PUBLIC_AUTH_API_URL=http://<GATEWAY_EIP>:3006
NEXT_PUBLIC_USER_API_URL=http://<GATEWAY_EIP>:3006
NEXT_PUBLIC_VEHICLE_API_URL=http://<GATEWAY_EIP>:3006
NEXT_PUBLIC_PARKING_API_URL=http://<GATEWAY_EIP>:3006
NEXT_PUBLIC_RESERVATION_API_URL=http://<GATEWAY_EIP>:3006

# Local desarrollo
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3006
# (etc, mismo patrón)
```

---

## Qué añadir cuando lleguen los nuevos servicios

### Cuando payment-service esté listo
1. Añadir `services/payment.service.ts`
2. Añadir flujo de pago en `user/reservations/` (al crear reservación → modal de pago)
3. Mostrar estado del pago en la lista de reservaciones

### Cuando analytics-service esté listo
1. Añadir `services/analytics.service.ts`
2. Añadir página `admin/analytics/page.tsx` con gráficas (recharts o chart.js)

### Cuando WebSocket esté listo (FASE 5)
1. Añadir `hooks/useSlotAvailability.ts` con socket.io-client
2. En MapInner.tsx, suscribirse al hook para actualizar markers en tiempo real
3. Instalar: `npm install socket.io-client`

---

## Cómo está implementado el auth en el frontend

- Login llama a `POST /api/auth/login` → guarda `accessToken` en localStorage (o memoria)
- Cada llamada API añade `Authorization: Bearer <token>` via interceptor de axios
- Si recibe 401 → llamar a `POST /api/auth/refresh` con refreshToken → reintentar
- Sidebar usa el rol del token decodificado para mostrar opciones de admin o user

---

## Mapa Leaflet — importante

El mapa usa coordenadas reales de la UCE (Quito, Ecuador):
```typescript
// mapConstants.ts
export const UCE_CENTER = { lat: -0.2105, lng: -78.5051 }
export const DEFAULT_ZOOM = 17
```

MapInner usa `dynamic import` con `{ ssr: false }` porque Leaflet no funciona en SSR.

---

## Historial de implementación (para Huly)

1. Generado con Nx generate @nx/next
2. App Router con grupos (auth) y (dashboard)
3. TailwindCSS configurado
4. LoginForm con react-hook-form + zod
5. DashboardShell + Sidebar con navegación por rol
6. Mapa Leaflet con markers coloreados por estado de slot
7. Admin: CRUD completo de facultades, zonas y slots con modales
8. User: dashboard, reservaciones, vehículo, settings
9. Services layer con axios
10. Dockerfile con build-args para env vars
