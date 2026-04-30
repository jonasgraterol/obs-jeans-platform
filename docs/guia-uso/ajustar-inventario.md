# Cómo ajustar inventario

Guía para sumar, restar o corregir stock de variantes en el panel.

## Cuándo usar esta guía

Usa esta guía cuando:

- Llegó producción nueva.
- Se vendió una pieza fuera del sistema y hay que descontarla.
- Se encontró diferencia física contra sistema.
- Se movió mercancía entre almacenes.
- Hay que corregir una talla o color específico.

## Conceptos importantes

- **Producto**: modelo general, por ejemplo `Jeans Wide Leg Azul Claro`.
- **Variante**: combinación exacta de talla y color.
- **SKU**: código interno de la variante.
- **Stock disponible**: piezas que se pueden vender.
- **Stock reservado**: piezas apartadas por órdenes todavía no completadas.

## Pasos para ajustar stock

1. Entra al panel correcto.
2. Abre el menú **Inventario** o busca el producto desde **Productos**.
3. Localiza la variante exacta por:
   - Nombre del producto.
   - Talla.
   - Color.
   - SKU o código de barras.
4. Abre el detalle de inventario de esa variante.
5. Revisa el stock actual antes de cambiarlo.
6. Captura la nueva cantidad o el ajuste correspondiente.
7. Guarda el cambio.
8. Vuelve a buscar la variante y confirma que la cantidad quedó actualizada.

## Reglas OBS Jeans

- Stock bajo: menos de 5 unidades por variante.
- Si una variante queda en 0 unidades, avisar al equipo antes de promocionarla.
- Si hay diferencia entre sistema y físico, anotar la razón del ajuste.
- Si el ajuste viene de venta externa, registrar también el canal: WhatsApp, bazar, Liverpool, Coppel, Mercado Libre u otro.

## Ejemplo

Situación: llegaron 6 piezas de `Jeans Mom Fit Negro`, talla 7.

1. Buscar producto: `Jeans Mom Fit Negro`.
2. Abrir variante: talla 7 / negro.
3. Confirmar stock actual: 2 unidades.
4. Ajustar stock a 8 unidades.
5. Guardar.
6. Verificar que el sistema muestre 8 unidades.

## Verificación

Después de guardar, confirma:

- Producto correcto.
- Variante correcta.
- Almacén correcto.
- Cantidad final correcta.
- No hay órdenes pendientes que expliquen reservas.

## Errores comunes

- Ajustar talla equivocada.
- Ajustar color parecido pero no exacto.
- Sumar unidades cuando el campo espera cantidad final.
- Hacer pruebas en producción.
- No considerar unidades reservadas por órdenes abiertas.

## Screenshot sugerido

Guardar capturas siguiendo el plan en [screenshots](./screenshots/README.md):

- `05-inventario-listado.png`
- `06-inventario-variante.png`
- `07-inventario-ajuste.png`
- `08-inventario-verificacion.png`
