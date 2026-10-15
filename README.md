# ERP Gastronómico — Módulo RRHH

PWA SaaS multi-local para registrar el ingreso y egreso del personal (fichaje por QR rotativo + geolocalización), mantener legajos y liquidar sueldos con descuentos por ausencias y cupones de consumo de empleados. Estilo y funcionalidad de referencia: Naaloo.

> **Estado:** fase de diseño. No hay código de producto todavía; el spec está pendiente de aprobación.

## Documentación

| Documento | Contenido |
|---|---|
| [Spec de diseño](docs/superpowers/specs/2026-10-15-rrhh-fichaje-liquidacion-design.md) | Alcance, arquitectura, componentes, decisiones |
| [Modelo de datos](docs/architecture/data-model.md) | Tablas, relaciones y RLS multi-tenant |
| [Fichaje QR + geocerca](docs/architecture/qr-geofence.md) | Protocolo del QR rotativo y validación de ubicación |
| [Reglas de liquidación](docs/product/payroll-rules.md) | Cálculo de sueldo, ausencias, cupones |
| [Roles y pantallas](docs/product/roles-and-screens.md) | Administrador, encargado, empleado |
| [Roadmap](docs/roadmap.md) | Fases de construcción |

## Estructura prevista

```
apps/web/            App Next.js (PWA): admin, encargado, empleado
supabase/migrations/ Migraciones SQL (esquema + políticas RLS)
docs/                Especificaciones y decisiones
```
