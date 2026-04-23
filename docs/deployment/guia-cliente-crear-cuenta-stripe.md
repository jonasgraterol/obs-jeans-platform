# Guia para Crear tu Cuenta de Stripe

## Que es Stripe?

Stripe es la plataforma que procesa los pagos de tu tienda en linea. Cuando un cliente paga con tarjeta de credito o en OXXO, Stripe se encarga de cobrar el dinero y depositarlo en tu cuenta bancaria.

## Costos

- **Sin mensualidad** — solo pagas por transaccion
- **Tarjeta de credito/debito:** 3.6% + $3.00 MXN por venta
- **OXXO:** 3.6% + $3.00 MXN por venta
- Ejemplo: en una venta de $1,000 MXN, Stripe cobra ~$39 MXN de comision. Tu recibes ~$961 MXN.

## Paso 1: Crear la Cuenta

1. Ir a [stripe.com](https://stripe.com)
2. Clic en **"Comenzar ahora"** o **"Start now"**
3. Ingresar tu correo electronico y crear una contrasena
4. Confirmar tu correo electronico

## Paso 2: Verificar tu Identidad

Stripe te pedira la siguiente informacion para verificar tu identidad y poder depositarte dinero:

### Datos personales
- Nombre completo
- Fecha de nacimiento
- CURP
- Direccion

### Datos del negocio
- Nombre del negocio (ej: "OBS Jeans")
- Tipo de negocio (Persona fisica o Persona moral)
- RFC
- Direccion del negocio
- Sitio web: `https://www.jeansobs.com`
- Descripcion del negocio: "Venta de ropa de mezclilla (jeans) al mayoreo y menudeo"

### Cuenta bancaria
- CLABE interbancaria (18 digitos) donde Stripe depositara tus ganancias
- Nombre del titular de la cuenta (debe coincidir con el nombre del negocio o persona registrada)

## Paso 3: Habilitar OXXO

1. Una vez que tu cuenta este verificada, ir a **Settings → Payment Methods**
2. Buscar **OXXO** en la lista
3. Activarlo si no esta habilitado

## Paso 4: Compartir las API Keys

Una vez que la cuenta este activa, necesitamos dos codigos para conectar Stripe con tu tienda:

1. Ir a **Developers → API Keys** (en el menu izquierdo)
2. Asegurarte de estar en modo **Production** (arriba a la derecha, NO debe decir "Test")
3. Copiar y enviarnos:
   - **Publishable key** — empieza con `pk_live_...`
   - **Secret key** — empieza con `sk_live_...` (clic en "Reveal" para verla)

> **Importante:** La Secret key es como la contrasena de tu cuenta de pagos. Enviala por un medio seguro (no por WhatsApp ni correo sin cifrar). Puedes usar un servicio como [onetimesecret.com](https://onetimesecret.com) para compartirla de forma segura.

## Paso 5: Configurar tu Marca

Para que tus clientes vean tu marca cuando paguen:

1. Ir a **Settings → Branding**
2. Subir tu logo
3. Configurar los colores de tu marca
4. Esto aparecera en los recibos y en el voucher de OXXO

## Que Pasa Despues?

- **Depositos automaticos:** Stripe deposita el dinero en tu cuenta bancaria automaticamente. Por defecto, cada 2 dias habiles.
- **Panel de control:** En [dashboard.stripe.com](https://dashboard.stripe.com) puedes ver todas las ventas, reembolsar pagos, y descargar reportes.
- **Facturas de Stripe:** Stripe te cobra las comisiones automaticamente, descontandolas de cada venta. Puedes descargar las facturas desde el dashboard.

## Preguntas Frecuentes

**Cuanto tarda en activarse la cuenta?**
Normalmente entre 1 y 3 dias habiles, dependiendo de la verificacion de identidad.

**Puedo usar mi cuenta personal de banco?**
Si eres persona fisica con actividad empresarial, si. Si eres persona moral, debe ser la cuenta del negocio.

**Que pasa si un cliente pide reembolso?**
Puedes hacer reembolsos desde el dashboard de Stripe o desde el panel de administracion de la tienda. El dinero regresa al cliente en 5-10 dias habiles.

**Que pasa con los pagos de OXXO?**
Cuando un cliente elige pagar en OXXO, recibe un voucher con un codigo de barras. Tiene 3 dias para ir a cualquier tienda OXXO y pagar. Una vez que paga, el dinero se procesa automaticamente y el pedido se confirma en la tienda.

**Que pasa si un cliente no paga el voucher de OXXO?**
El voucher expira despues de 3 dias y no se realiza ningun cobro. El pedido no se crea.

## Soporte

Si tienes problemas con tu cuenta de Stripe, puedes contactar a su soporte en espanol:
- [support.stripe.com](https://support.stripe.com)
- Chat en vivo disponible en el dashboard
