# Métodos de Pago Unificados - Documentación

## Descripción

Este módulo implementa la integración completa del servicio `metodosPagoUnificado` en el frontend de la aplicación web. Proporciona una vista unificada de métodos de pago con capacidades de filtrado avanzado y resúmenes estadísticos.

## Estructura de Archivos

### API Service

- `src/app/api/metodos-pago-unificado.ts` - Servicio principal para las llamadas HTTP al backend

### Componentes

- `src/app/components/metodos-pago-unificado/UnifiedPaymentMethodsFilters.tsx` - Componente de filtros avanzados
- `src/app/components/metodos-pago-unificado/UnifiedPaymentMethodsTable.tsx` - Tabla de datos con funcionalidades avanzadas
- `src/app/components/metodos-pago-unificado/UnifiedPaymentMethodsSummary.tsx` - Componente de resúmenes estadísticos

### Hooks

- `src/app/hooks/useUnifiedPaymentMethods.ts` - Hook personalizado para gestión de estado

### Páginas

- `src/app/home/metodosPagoUnificado/page.tsx` - Página principal que integra todos los componentes

## Características Implementadas

### 1. Servicio API (`metodos-pago-unificado.ts`)

- ✅ Endpoints para datos principales y resúmenes
- ✅ Interfaces TypeScript completas
- ✅ Funciones helper para casos de uso comunes
- ✅ Manejo de errores integrado
- ✅ Paginación automática

### 2. Filtros Avanzados (`UnifiedPaymentMethodsFilters.tsx`)

- ✅ Filtros básicos (venta_id, cliente_id, usuario_id, etc.)
- ✅ Filtros de fecha con rango
- ✅ Filtros de estado (venta y pago)
- ✅ Selectores dinámicos para clientes, métodos de pago y monedas
- ✅ Botones de filtro rápido
- ✅ Debounce en filtros de texto
- ✅ Validación de fechas

### 3. Tabla de Datos (`UnifiedPaymentMethodsTable.tsx`)

- ✅ Visualización completa de datos unificados
- ✅ Columnas configurables y ordenables
- ✅ Indicadores de progreso de pago
- ✅ Tags de estado con colores
- ✅ Estadísticas resumidas
- ✅ Paginación integrada
- ✅ Selección múltiple de filas
- ✅ Acciones por fila (ver detalles, imprimir)

### 4. Resúmenes Estadísticos (`UnifiedPaymentMethodsSummary.tsx`)

- ✅ Agrupación por múltiples criterios
- ✅ Estadísticas generales
- ✅ Tabla detallada de resúmenes
- ✅ Indicadores de rendimiento
- ✅ Gráficos de progreso
- ✅ Filtros específicos para resúmenes

### 5. Gestión de Estado (`useUnifiedPaymentMethods.ts`)

- ✅ Hook personalizado para estado global
- ✅ Manejo de filtros con debounce
- ✅ Gestión de paginación
- ✅ Estados de carga y error
- ✅ Funciones de actualización y limpieza

### 6. Página Principal (`page.tsx`)

- ✅ Integración de todos los componentes
- ✅ Sistema de pestañas (Tabla, Resúmenes, Reportes)
- ✅ Modal de detalles expandidos
- ✅ Manejo de errores con reintentos
- ✅ Estados de carga y vacío
- ✅ Funciones de exportación e impresión

## Casos de Uso Implementados

### 1. Reporte de Ventas por Método de Pago

```typescript
// Filtrar por método de pago específico
const filters = {
  empresa_id: 1,
  metodo_pago_id: 2,
  fecha_venta_inicio: '2024-01-01',
  fecha_venta_fin: '2024-01-31',
}
```

### 2. Análisis de Pagos por Cliente

```typescript
// Agrupar resúmenes por cliente
const summaryFilters = {
  empresa_id: 1,
  agrupar_por: 'cliente',
  cliente_id: 123,
}
```

### 3. Seguimiento de Saldos Pendientes

```typescript
// Filtrar solo pagos pendientes
const filters = {
  empresa_id: 1,
  estado_pago: 'pendiente',
}
```

### 4. Análisis Temporal

```typescript
// Resumen por día de venta
const summaryFilters = {
  empresa_id: 1,
  agrupar_por: 'fecha_venta_dia',
  fecha_venta_inicio: '2024-01-01',
  fecha_venta_fin: '2024-01-31',
}
```

## Filtros Disponibles

### Filtros Básicos

- `empresa_id` (requerido) - ID de la empresa
- `venta_id` - ID de venta específica
- `cliente_id` - ID del cliente
- `usuario_id` - ID del usuario
- `metodo_pago_id` - ID del método de pago
- `moneda_id` - ID de la moneda
- `estado_venta` - Estado de la venta
- `estado_pago` - Estado del pago

### Filtros de Fecha

- `fecha_venta_inicio` - Fecha de inicio de venta (YYYY-MM-DD)
- `fecha_venta_fin` - Fecha de fin de venta (YYYY-MM-DD)
- `fecha_pago_inicio` - Fecha de inicio de pago (YYYY-MM-DD)
- `fecha_pago_fin` - Fecha de fin de pago (YYYY-MM-DD)

### Filtros Adicionales

- `venta_es_vendida` - Filtrar ventas completadas (true/false)
- `limit` - Límite de registros (default: 100)
- `offset` - Offset para paginación (default: 0)

### Opciones de Agrupación para Resúmenes

- `metodo_pago` - Por método de pago
- `cliente` - Por cliente
- `usuario` - Por usuario
- `moneda` - Por moneda
- `fecha_venta_dia` - Por día de venta
- `fecha_pago_dia` - Por día de pago

## Navegación

La página está disponible en: `/home/metodosPagoUnificado`

Se ha agregado al menú de navegación como "Métodos de Pago Unificados" con el ícono de gráficos de barras.

## Consideraciones Técnicas

### Rendimiento

- ✅ Paginación implementada para grandes volúmenes
- ✅ Debounce en filtros de texto (500ms)
- ✅ Lazy loading de datos por pestaña
- ✅ Memoización de cálculos costosos

### Manejo de Errores

- ✅ Try-catch en todas las llamadas API
- ✅ Mensajes de error amigables
- ✅ Botones de reintento
- ✅ Estados de error y carga

### Validación

- ✅ Validación de formatos de fecha
- ✅ Validación de rangos numéricos
- ✅ Filtros de fecha deshabilitados para fechas futuras

### Accesibilidad

- ✅ Tooltips informativos
- ✅ Iconos descriptivos
- ✅ Estados de carga visibles
- ✅ Mensajes de error claros

## Próximas Mejoras

### Funcionalidades Pendientes

- [ ] Exportación a Excel/PDF
- [ ] Impresión de tickets mejorada
- [ ] Gráficos interactivos
- [ ] Filtros guardados
- [ ] Notificaciones en tiempo real
- [ ] Integración con sistema de reportes

### Optimizaciones

- [ ] Virtualización de tablas grandes
- [ ] Cache de datos frecuentes
- [ ] Compresión de respuestas API
- [ ] Lazy loading de componentes

## Uso

```typescript
import { MetodosPagoUnificadoPage } from '@/app/home/metodosPagoUnificado/page'

// La página está lista para usar con todas las funcionalidades implementadas
```

## Dependencias

- React 18+
- Ant Design 5+
- Next.js 14+
- TypeScript 5+
- dayjs para manejo de fechas
- AWS Amplify para autenticación

## Soporte

Para soporte técnico o reportar bugs, contactar al equipo de desarrollo.
