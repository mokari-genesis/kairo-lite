# Problema: Trigger de Cuentas por Pagar No Funciona

## Problema Identificado

El trigger `trg_movs_crear_cxp_ai` en `database_new_scheme2.sql` tiene las siguientes limitaciones:

1. **Solo funciona si `compra_id IS NOT NULL`**: Si no se proporciona `compra_id`, no se crea ninguna cuenta por pagar.

2. **Requiere que la compra exista**: El trigger hace un `SELECT ... INTO` de la tabla `compras`. Si la compra no existe, el SELECT falla y no se crea la cuenta por pagar.

3. **No maneja errores**: Si la compra no existe, el trigger falla silenciosamente sin crear la cuenta por pagar.

## Código Actual del Trigger

```sql
CREATE TRIGGER `trg_movs_crear_cxp_ai` AFTER INSERT ON `movimientos_inventario`
FOR EACH ROW BEGIN
  DECLARE v_empresa_id INT;
  DECLARE v_proveedor_id INT;
  DECLARE v_moneda_id INT;
  DECLARE v_total DECIMAL(12,2);

  IF NEW.tipo_movimiento = 'entrada' AND NEW.compra_id IS NOT NULL THEN
    -- ❌ PROBLEMA: Si compra_id no existe en la tabla compras, este SELECT falla
    SELECT empresa_id, proveedor_id, moneda_id
      INTO v_empresa_id, v_proveedor_id, v_moneda_id
    FROM compras
    WHERE id = NEW.compra_id;  -- Si no existe, falla aquí

    -- ... resto del código nunca se ejecuta
  END IF;
END;
```

## Solución

Se creó un nuevo trigger mejorado en `/Users/luisdeleon/Documents/Github/kairo-core/docs/fix_trigger_cxp_automatica.sql` que:

### 1. Funciona sin `compra_id`

- Si `compra_id` es NULL, crea la cuenta por pagar directamente desde el movimiento
- Obtiene `proveedor_id` del producto
- Usa la moneda base del sistema

### 2. Crea la compra automáticamente si no existe

- Si `compra_id` existe pero la compra no está en la BD, la crea automáticamente
- Crea también el detalle de compra (`compras_detalles`)
- Actualiza el movimiento con el nuevo `compra_id`

### 3. Maneja todos los escenarios

- ✅ Movimiento entrada sin `compra_id` → Crea CxP directamente
- ✅ Movimiento entrada con `compra_id` existente → Usa compra existente
- ✅ Movimiento entrada con `compra_id` inexistente → Crea compra y luego CxP

## Cómo Aplicar la Solución

### Opción 1: Ejecutar el script SQL directamente

```bash
# Conectarse a la base de datos MySQL
mysql -u usuario -p nombre_base_datos < /Users/luisdeleon/Documents/Github/kairo-core/docs/fix_trigger_cxp_automatica.sql
```

### Opción 2: Ejecutar manualmente en MySQL

1. Conectarse a la base de datos
2. Ejecutar el contenido del archivo `fix_trigger_cxp_automatica.sql`

## Verificación

Después de aplicar el fix, probar los siguientes casos:

### Caso 1: Movimiento entrada sin compra_id

```sql
INSERT INTO movimientos_inventario (
  empresa_id, producto_id, usuario_id, tipo_movimiento,
  cantidad, precio_compra, compra_id, comentario
) VALUES (
  1, 123, 1, 'entrada', 50, 75.50, NULL, 'Compra directa'
);
```

**Resultado esperado**: Se crea una cuenta por pagar con `compra_id = NULL`

### Caso 2: Movimiento entrada con compra_id inexistente

```sql
INSERT INTO movimientos_inventario (
  empresa_id, producto_id, usuario_id, tipo_movimiento,
  cantidad, precio_compra, compra_id, comentario
) VALUES (
  1, 123, 1, 'entrada', 50, 75.50, 999, 'Compra con ID inexistente'
);
```

**Resultado esperado**:

- Se crea una compra con `id = 999` (o el siguiente disponible)
- Se crea el detalle de compra
- Se crea la cuenta por pagar
- Se actualiza el movimiento con el `compra_id` correcto

### Caso 3: Movimiento entrada con compra_id existente

```sql
-- Primero crear la compra
INSERT INTO compras (empresa_id, proveedor_id, usuario_id, total, estado, moneda_id)
VALUES (1, 1, 1, 3775.00, 'registrada', 1);

-- Luego crear el movimiento
INSERT INTO movimientos_inventario (
  empresa_id, producto_id, usuario_id, tipo_movimiento,
  cantidad, precio_compra, compra_id, comentario
) VALUES (
  1, 123, 1, 'entrada', 50, 75.50, LAST_INSERT_ID(), 'Compra existente'
);
```

**Resultado esperado**: Se crea la cuenta por pagar usando la compra existente

## Cambios en el Nuevo Trigger

### Mejoras Implementadas

1. **Manejo de compra_id NULL**:

   ```sql
   IF NEW.compra_id IS NULL THEN
     -- Crea CxP directamente desde el movimiento
   END IF;
   ```

2. **Verificación de existencia de compra**:

   ```sql
   SELECT COUNT(*) INTO v_compra_existe
   FROM compras
   WHERE id = v_compra_id;
   ```

3. **Creación automática de compra**:

   ```sql
   IF v_compra_existe = 0 THEN
     INSERT INTO compras (...);
     SET v_compra_id = LAST_INSERT_ID();
     -- Actualiza el movimiento
     UPDATE movimientos_inventario SET compra_id = v_compra_id WHERE id = NEW.id;
   END IF;
   ```

4. **Obtención de moneda base**:

   ```sql
   SELECT id INTO v_moneda_base_id
   FROM monedas
   WHERE es_base = 1
   LIMIT 1;
   ```

5. **Prevención de duplicados**:
   - Verifica si ya existe una CxP para el mismo proveedor, total y fecha antes de crear una nueva

## Notas Importantes

1. **Moneda**: El nuevo trigger usa la moneda base del sistema. Si necesitas una moneda específica, deberías proporcionar un `compra_id` existente o crear la compra manualmente primero.

2. **Proveedor**: Se obtiene automáticamente del producto. Asegúrate de que todos los productos tengan un `proveedor_id` válido.

3. **Total de compra**: Si hay múltiples movimientos para la misma compra, el trigger suma todos los detalles de compra para calcular el total de la CxP.

4. **Actualización de movimiento**: Si se crea una compra automáticamente, el trigger actualiza el movimiento con el nuevo `compra_id`.

## Próximos Pasos

1. ✅ Aplicar el script `fix_trigger_cxp_automatica.sql` a la base de datos
2. ✅ Probar los tres casos de uso mencionados
3. ✅ Verificar que las cuentas por pagar se crean correctamente
4. ✅ Verificar que los abonos funcionan correctamente con las nuevas cuentas

