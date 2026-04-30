# Cómo generar reportes

Guía para obtener información de ventas, órdenes, productos e inventario desde el panel.

## Cuándo usar esta guía

Usa esta guía para responder preguntas como:

- ¿Cuánto se vendió hoy?
- ¿Qué órdenes siguen pendientes?
- ¿Qué productos tienen stock bajo?
- ¿Qué clientes compraron en el mes?
- ¿Qué productos hay que resurtir?

## Reporte de ventas

1. Entra al panel.
2. Abre **Órdenes**.
3. Filtra por fecha:
   - Hoy.
   - Esta semana.
   - Este mes.
   - Rango personalizado.
4. Filtra por estado si se necesita:
   - Pagada.
   - Completada.
   - Cancelada.
5. Revisa total de órdenes y monto total.
6. Exporta si el panel muestra opción de exportación.
7. Guarda el archivo con nombre claro.

Nombre sugerido:

`ventas-YYYY-MM-DD.csv`

## Reporte de órdenes pendientes

1. Abre **Órdenes**.
2. Filtra por estado pendiente o no completado.
3. Ordena por fecha de creación.
4. Revisa cada orden:
   - Pago.
   - Producto.
   - Cliente.
   - Envío.
5. Exporta o comparte el listado con el equipo.

## Reporte de inventario bajo

1. Abre **Inventario**.
2. Filtra o busca variantes con poca existencia.
3. Considera stock bajo cuando queden menos de 5 unidades.
4. Revisa si hay unidades reservadas.
5. Genera listado con:
   - Producto.
   - Talla.
   - Color.
   - SKU.
   - Stock disponible.
   - Stock reservado, si aplica.

## Reporte de productos

1. Abre **Productos**.
2. Filtra por estado, colección, tipo o categoría.
3. Exporta el catálogo si se necesita revisión masiva.
4. Verifica que cada producto tenga:
   - Imágenes.
   - Variantes.
   - SKU.
   - Precio.
   - Inventario.

## Reporte de clientes

1. Abre **Clientes**.
2. Busca o filtra clientes por nombre, correo o grupo.
3. Revisa historial de compras.
4. No compartir datos personales fuera del equipo autorizado.

## Formato recomendado para compartir reportes por WhatsApp

Ejemplo:

```text
*Reporte de ventas — 2026-04-29*

- Órdenes completadas: 12
- Piezas vendidas: 15
- Total vendido: $8,450 MXN
- Órdenes pendientes: 3
- Variantes con stock bajo: 7

*Pendientes:*
- Revisar orden #1234: pago pendiente
- Resurtir talla 7 negro: quedan 2 unidades
```

## Verificación

Antes de enviar un reporte:

- Confirmar rango de fechas.
- Confirmar si incluye canceladas o solo completadas.
- Confirmar moneda.
- Confirmar si los totales incluyen envío, descuentos o impuestos.
- Revisar que no se compartan datos privados de clientes con personas no autorizadas.

## Screenshot sugerido

Guardar capturas siguiendo el plan en [screenshots](./screenshots/README.md):

- `14-reportes-ordenes-filtro-fecha.png`
- `15-reportes-exportar-ordenes.png`
- `16-reportes-inventario-bajo.png`
- `17-reportes-clientes.png`
