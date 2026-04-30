# Cómo agregar productos

Guía para dar de alta modelos nuevos de OBS Jeans en el panel.

## Cuándo usar esta guía

Usa esta guía cuando se necesite crear un producto nuevo, por ejemplo:

- Nuevo modelo de jeans.
- Nuevo color de un modelo existente.
- Nuevo producto con variantes por talla.
- Producto que después se publicará en tienda online o marketplaces.

## Antes de empezar

Ten lista esta información:

- Nombre comercial del producto.
- Descripción corta y clara.
- Tipo de producto, por ejemplo: Jeans, Short, Falda, Chamarra.
- Colección, si aplica.
- Tallas disponibles.
- Colores disponibles.
- SKU o código interno por variante.
- Código de barras por variante, si ya existe.
- Precio autorizado.
- Fotografías del producto.
- Stock inicial por talla y color.

## Pasos

1. Entra al panel:
   - Producción: https://admin.jeansobs.com/app
   - Staging: https://admin-staging.jeansobs.com/app
2. Abre el menú **Productos**.
3. Selecciona **Crear producto**.
4. Llena la información principal:
   - Nombre.
   - Descripción.
   - Estado del producto.
   - Tipo.
   - Colección, si aplica.
   - Categorías, si aplica.
5. Carga las fotografías del producto.
6. Configura opciones de variantes:
   - Talla.
   - Color.
7. Crea las variantes necesarias.
8. En cada variante, revisa:
   - SKU.
   - Código de barras.
   - Talla.
   - Color.
   - Precio.
9. Guarda el producto.
10. Abre el producto recién creado y verifica que todas las variantes aparezcan correctamente.
11. Ajusta inventario inicial siguiendo la guía [Cómo ajustar inventario](./ajustar-inventario.md).

## Ejemplo de estructura recomendada

Producto: `Jeans Wide Leg Azul Claro`

Variantes:

- Talla 3 / Azul Claro / SKU: `WL-AZC-03`
- Talla 5 / Azul Claro / SKU: `WL-AZC-05`
- Talla 7 / Azul Claro / SKU: `WL-AZC-07`
- Talla 9 / Azul Claro / SKU: `WL-AZC-09`

## Verificación

Antes de darlo por terminado, confirma:

- El producto tiene al menos 1 imagen principal.
- Todas las variantes tienen SKU.
- Todas las variantes tienen talla y color correctos.
- El precio coincide con el autorizado.
- El producto aparece en el listado de productos.
- El inventario inicial se registró en el almacén correcto.

## Errores comunes

- Crear un producto por talla en lugar de usar variantes.
- Escribir el color con nombres distintos, por ejemplo `Azul claro`, `Azul Claro` y `azul claro`.
- Subir fotos duplicadas o de otro modelo.
- Olvidar capturar códigos de barras.
- Crear producto en producción cuando solo era prueba.

## Screenshot sugerido

Guardar capturas siguiendo el plan en [screenshots](./screenshots/README.md):

- `01-productos-listado.png`
- `02-productos-crear.png`
- `03-productos-variantes.png`
- `04-productos-verificacion.png`
