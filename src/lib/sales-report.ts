export type SalesPeriod = "today" | "week" | "month" | "custom"

export type SalesReportOrderItem = {
  id?: string
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
  total?: number | string | null
  subtotal?: number | string | null
}

export type SalesReportOrder = {
  id?: string
  display_id?: number | string | null
  created_at?: string | Date | null
  status?: string | null
  total?: number | string | null
  subtotal?: number | string | null
  items?: SalesReportOrderItem[] | null
}

export type SalesReportSummary = {
  total_orders: number
  total_sales: number
  total_items: number
  avg_ticket: number
}

export type TopProduct = {
  title: string
  quantity: number
  total: number
}

export type SalesReport = {
  period: SalesPeriod
  start: string
  end: string
  summary: SalesReportSummary
  comparison?: {
    start: string
    end: string
    summary: SalesReportSummary
    delta_sales: number
    delta_sales_percent: number | null
    delta_orders: number
  }
  top_products: TopProduct[]
  daily_sales: Array<{ date: string; total: number; orders: number }>
  chart_svg: string
  chart_data_url: string
  whatsapp_message: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const numberValue = (value: unknown): number => {
  const parsed = typeof value === "string" ? Number(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0
}

const money = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)

const dateKey = (value: string | Date | null | undefined): string => {
  const date = value ? new Date(value) : new Date(0)
  return date.toISOString().slice(0, 10)
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

export function getPeriodRange(
  period: SalesPeriod,
  now = new Date(),
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const end = new Date(now)
  let start: Date

  if (period === "custom") {
    if (!customStart) {
      throw new Error("El periodo custom requiere start")
    }
    start = new Date(customStart)
    const customEndDate = customEnd ? new Date(customEnd) : end
    if (Number.isNaN(start.getTime()) || Number.isNaN(customEndDate.getTime())) {
      throw new Error("Fechas inválidas para el periodo custom")
    }
    end.setTime(customEndDate.getTime())
  } else if (period === "month") {
    start = new Date(end)
    start.setUTCDate(1)
    start.setUTCHours(0, 0, 0, 0)
  } else if (period === "week") {
    start = new Date(end)
    const day = start.getUTCDay() || 7
    start.setUTCDate(start.getUTCDate() - day + 1)
    start.setUTCHours(0, 0, 0, 0)
  } else {
    start = new Date(end)
    start.setUTCHours(0, 0, 0, 0)
  }

  const duration = Math.max(end.getTime() - start.getTime(), MS_PER_DAY)
  const previousEnd = new Date(start.getTime())
  const previousStart = new Date(previousEnd.getTime() - duration)

  return { start, end, previousStart, previousEnd }
}

export function summarizeOrders(orders: SalesReportOrder[]): SalesReportSummary {
  const total_sales = orders.reduce(
    (sum, order) => sum + numberValue(order.total ?? order.subtotal),
    0
  )
  const total_items = orders.reduce(
    (sum, order) =>
      sum +
      (order.items || []).reduce(
        (itemSum, item) => itemSum + numberValue(item.quantity),
        0
      ),
    0
  )

  return {
    total_orders: orders.length,
    total_sales,
    total_items,
    avg_ticket: orders.length ? total_sales / orders.length : 0,
  }
}

export function getTopProducts(
  orders: SalesReportOrder[],
  limit = 5
): TopProduct[] {
  const products = new Map<string, TopProduct>()

  for (const order of orders) {
    for (const item of order.items || []) {
      const title =
        item.product_title || item.title || item.variant_title || "Producto sin nombre"
      const quantity = numberValue(item.quantity)
      const total = numberValue(item.total ?? item.subtotal) || quantity * numberValue(item.unit_price)
      const current = products.get(title) || { title, quantity: 0, total: 0 }
      current.quantity += quantity
      current.total += total
      products.set(title, current)
    }
  }

  return [...products.values()]
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, limit)
}

export function getDailySales(
  orders: SalesReportOrder[]
): Array<{ date: string; total: number; orders: number }> {
  const byDate = new Map<string, { date: string; total: number; orders: number }>()

  for (const order of orders) {
    const date = dateKey(order.created_at)
    const current = byDate.get(date) || { date, total: 0, orders: 0 }
    current.total += numberValue(order.total ?? order.subtotal)
    current.orders += 1
    byDate.set(date, current)
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function buildBarChartSvg(
  dailySales: Array<{ date: string; total: number; orders: number }>,
  title = "Ventas"
): string {
  const width = 900
  const height = 500
  const padding = 70
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const values = dailySales.length ? dailySales : [{ date: "Sin ventas", total: 0, orders: 0 }]
  const max = Math.max(...values.map((entry) => entry.total), 1)
  const barGap = 12
  const barWidth = Math.max(18, (chartWidth - barGap * (values.length - 1)) / values.length)

  const bars = values
    .map((entry, index) => {
      const barHeight = Math.round((entry.total / max) * chartHeight)
      const x = padding + index * (barWidth + barGap)
      const y = padding + chartHeight - barHeight
      const label = entry.date.slice(5)
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="#b80049" />
        <text x="${x + barWidth / 2}" y="${padding + chartHeight + 28}" text-anchor="middle" font-size="18" fill="#374151">${escapeXml(label)}</text>
        <text x="${x + barWidth / 2}" y="${Math.max(32, y - 12)}" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">${escapeXml(money(entry.total))}</text>`
    })
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff" />
    <text x="${padding}" y="40" font-size="28" font-weight="700" fill="#111827">${escapeXml(title)}</text>
    <line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="#d1d5db" stroke-width="2" />
    ${bars}
  </svg>`
}

export function buildWhatsAppMessage(
  periodLabel: string,
  summary: SalesReportSummary,
  topProducts: TopProduct[],
  comparison?: SalesReport["comparison"]
): string {
  if (summary.total_orders === 0) {
    return `💰 *Ventas de ${periodLabel}*\n\nNo hay ventas registradas en ${periodLabel}.`
  }

  const lines = [
    `💰 *Ventas de ${periodLabel}*`,
    "",
    `📊 Total: ${money(summary.total_sales)} MXN`,
    `📦 Pedidos: ${summary.total_orders}`,
    `👖 Piezas: ${summary.total_items}`,
    `🎫 Ticket promedio: ${money(summary.avg_ticket)} MXN`,
  ]

  if (comparison) {
    const direction = comparison.delta_sales >= 0 ? "arriba" : "abajo"
    const percent = comparison.delta_sales_percent === null
      ? "sin comparación previa"
      : `${Math.abs(comparison.delta_sales_percent).toFixed(1)}% ${direction}`
    lines.push(`📈 Comparativa: ${money(Math.abs(comparison.delta_sales))} MXN ${direction} (${percent})`)
  }

  if (topProducts.length) {
    lines.push("", "🏆 *Top productos:*")
    topProducts.slice(0, 3).forEach((product, index) => {
      lines.push(`${index + 1}. ${product.title} (${product.quantity} unidades)`)
    })
  }

  return lines.join("\n")
}

export function buildSalesReport(input: {
  period: SalesPeriod
  periodLabel: string
  start: Date
  end: Date
  orders: SalesReportOrder[]
  previousOrders?: SalesReportOrder[]
  topProductsLimit?: number
}): SalesReport {
  const summary = summarizeOrders(input.orders)
  const topProducts = getTopProducts(input.orders, input.topProductsLimit ?? 5)
  const dailySales = getDailySales(input.orders)
  const chartSvg = buildBarChartSvg(dailySales, `Ventas ${input.periodLabel}`)
  const comparisonSummary = input.previousOrders
    ? summarizeOrders(input.previousOrders)
    : undefined
  const comparison = comparisonSummary
    ? {
        start: "",
        end: "",
        summary: comparisonSummary,
        delta_sales: summary.total_sales - comparisonSummary.total_sales,
        delta_sales_percent: comparisonSummary.total_sales
          ? ((summary.total_sales - comparisonSummary.total_sales) /
              comparisonSummary.total_sales) *
            100
          : null,
        delta_orders: summary.total_orders - comparisonSummary.total_orders,
      }
    : undefined

  return {
    period: input.period,
    start: input.start.toISOString(),
    end: input.end.toISOString(),
    summary,
    comparison,
    top_products: topProducts,
    daily_sales: dailySales,
    chart_svg: chartSvg,
    chart_data_url: `data:image/svg+xml;base64,${Buffer.from(chartSvg).toString("base64")}`,
    whatsapp_message: buildWhatsAppMessage(
      input.periodLabel,
      summary,
      topProducts,
      comparison
    ),
  }
}
