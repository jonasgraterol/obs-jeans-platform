import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildSalesReport, getPeriodRange } from "../../../lib/sales-report"
import type { SalesPeriod, SalesReportOrder } from "../../../lib/sales-report"

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  today: "hoy",
  week: "esta semana",
  month: "este mes",
  custom: "periodo seleccionado",
}

const isSalesPeriod = (value: unknown): value is SalesPeriod =>
  value === "today" || value === "week" || value === "month" || value === "custom"

const getStringQuery = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined
  }
  return typeof value === "string" ? value : undefined
}

async function listOrders(req: MedusaRequest, start: Date, end: Date, status: string) {
  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "status",
      "total",
      "subtotal",
      "items.id",
      "items.title",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.subtotal",
    ],
    filters: {
      created_at: {
        $gte: start.toISOString(),
        $lte: end.toISOString(),
      },
      ...(status === "all" ? {} : { status }),
    },
    pagination: {
      take: 1000,
      skip: 0,
      order: {
        created_at: "DESC",
      },
    },
  })

  return (data || []) as SalesReportOrder[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const periodParam = getStringQuery(req.query.period) || "today"

  if (!isSalesPeriod(periodParam)) {
    return res.status(400).json({
      message: "Periodo inválido. Usa today, week, month o custom.",
    })
  }

  const status = getStringQuery(req.query.status) || "completed"
  const compare = getStringQuery(req.query.compare) !== "false"
  const topParam = Number(getStringQuery(req.query.top) || 5)
  const topProductsLimit = Number.isFinite(topParam) ? Math.min(Math.max(topParam, 1), 20) : 5

  let range: ReturnType<typeof getPeriodRange>
  try {
    range = getPeriodRange(
      periodParam,
      new Date(),
      getStringQuery(req.query.start),
      getStringQuery(req.query.end)
    )
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Rango de fechas inválido.",
    })
  }

  const { start, end, previousStart, previousEnd } = range

  const [orders, previousOrders] = await Promise.all([
    listOrders(req, start, end, status),
    compare ? listOrders(req, previousStart, previousEnd, status) : Promise.resolve([]),
  ])

  const report = buildSalesReport({
    period: periodParam,
    periodLabel: PERIOD_LABELS[periodParam],
    start,
    end,
    orders,
    previousOrders: compare ? previousOrders : undefined,
    topProductsLimit,
  })

  if (report.comparison) {
    report.comparison.start = previousStart.toISOString()
    report.comparison.end = previousEnd.toISOString()
  }

  return res.json({
    ...report,
    filters: {
      status,
      top_products_limit: topProductsLimit,
    },
  })
}
