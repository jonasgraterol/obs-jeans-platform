# Reporte matutino automático

Este documento describe el reporte matutino que Jeany envía al grupo interno de OBS Jeans.

## Objetivo

Dar al equipo una lectura rápida del estado operativo al inicio del día:

- Ventas del día anterior.
- Pedidos pendientes de envío.
- Alertas de stock bajo.
- Estado de carritos recuperados.
- Métricas acumuladas de la semana.

## Programación actual

- **Nombre del job:** `obs-reporte-matutino`
- **Horario:** lunes a sábado, 8:00 AM hora México.
- **Cron UTC:** `0 14 * * 1-6`
- **Destino:** grupo WhatsApp interno de OBS Jeans.
- **Script:** `~/.hermes/scripts/obs_morning_report.py`

## Datos incluidos

### Ventas de ayer

- Número de pedidos.
- Total vendido en MXN.
- Ticket promedio.
- Piezas vendidas.

### Semana actual

- Pedidos acumulados desde el lunes.
- Total vendido acumulado.

### Pedidos pendientes de envío

- Total de pedidos no enviados.
- Primeros pedidos pendientes con folio, cliente y total.

### Stock bajo

- Variantes debajo de 5 unidades disponibles.
- Primeros SKUs con alerta.

Regla de OBS Jeans:

- Stock bajo: menos de 5 unidades.
- Agotado: 0 unidades.

### Carritos recuperados

Actualmente se reportan como `0 registrados` porque el flujo de recuperación de carritos todavía no está activo. Cuando se implemente ese flujo, esta sección debe conectarse al tracking real de recuperación.

## Formato del mensaje

```text
☀️ *Reporte matutino OBS Jeans*

*Corte:* DD/MM/YYYY HH:mm hora México

*Ventas de ayer*
• Pedidos: 0
• Total: $0 MXN
• Ticket promedio: $0 MXN
• Piezas vendidas: 0

*Semana actual*
• Pedidos: 0
• Total: $0 MXN

*Pedidos pendientes de envío*
• Total pendientes: 0
• No hay pedidos pendientes de envío 🎉

*Alertas de stock bajo*
• Variantes debajo de 5 unidades: 0
• No hay variantes con stock bajo

*Carritos recuperados*
• 0 registrados por ahora. El flujo de recuperación de carritos todavía no está activo.
```

## Verificación

Para probar sin enviar al grupo:

```bash
/root/.hermes/scripts/obs_morning_report.py --dry-run
```

Para ver el job programado:

```bash
hermes cron list
```

## Mantenimiento

Actualizar este documento si cambia:

- El horario del reporte.
- El destino del reporte.
- El umbral de stock bajo.
- Las métricas incluidas.
- La implementación de recuperación de carritos.
