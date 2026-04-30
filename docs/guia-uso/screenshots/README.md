# Plan de screenshots paso a paso

Este archivo define las capturas necesarias para completar visualmente las guías internas.

> Las capturas deben tomarse preferentemente en staging para evitar exponer datos reales de clientes. Si se usan capturas de producción, ocultar datos personales, teléfonos, correos, direcciones y montos sensibles.

## Convenciones

- Formato: PNG.
- Ancho recomendado: 1440 px o superior.
- Guardar en esta carpeta: `docs/guia-uso/screenshots/`.
- Usar nombres exactamente como aparecen abajo.
- Evitar capturas con información privada.

## Productos

- `01-productos-listado.png`: listado principal de productos.
- `02-productos-crear.png`: pantalla de creación de producto.
- `03-productos-variantes.png`: sección de variantes por talla/color.
- `04-productos-verificacion.png`: producto guardado con variantes visibles.

## Inventario

- `05-inventario-listado.png`: listado o búsqueda de inventario.
- `06-inventario-variante.png`: detalle de inventario de una variante.
- `07-inventario-ajuste.png`: pantalla/modal de ajuste.
- `08-inventario-verificacion.png`: cantidad actualizada después de guardar.

## Órdenes

- `09-ordenes-listado.png`: listado de órdenes.
- `10-ordenes-detalle.png`: detalle de orden.
- `11-ordenes-pago.png`: sección de pago.
- `12-ordenes-envio.png`: sección de envío/fulfillment.
- `13-ordenes-completada.png`: orden completada o con estado final.

## Reportes

- `14-reportes-ordenes-filtro-fecha.png`: órdenes filtradas por fecha.
- `15-reportes-exportar-ordenes.png`: opción de exportación si está disponible.
- `16-reportes-inventario-bajo.png`: ejemplo de variantes con stock bajo.
- `17-reportes-clientes.png`: vista de clientes o historial, sin datos sensibles.

## Checklist antes de subir capturas

- [ ] No hay teléfonos visibles.
- [ ] No hay correos visibles.
- [ ] No hay direcciones visibles.
- [ ] No hay datos de pago visibles.
- [ ] El ambiente es staging o los datos reales están ocultos.
- [ ] La captura corresponde al paso de la guía.
- [ ] El nombre del archivo coincide con esta lista.

## Cómo referenciar una captura en una guía

```md
![Listado de productos](./screenshots/01-productos-listado.png)
```
