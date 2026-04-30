import {
  buildSalesReport,
  getPeriodRange,
  getTopProducts,
  summarizeOrders,
} from "../sales-report"

describe("sales-report helpers", () => {
  it("calculates totals, pieces and average ticket in MXN without cent conversion", () => {
    const summary = summarizeOrders([
      {
        total: 1500,
        items: [{ title: "Wide Leg", quantity: 2, unit_price: 500 }],
      },
      {
        total: 700,
        items: [{ title: "Mom Fit", quantity: 1, unit_price: 700 }],
      },
    ])

    expect(summary).toEqual({
      total_orders: 2,
      total_sales: 2200,
      total_items: 3,
      avg_ticket: 1100,
    })
  })

  it("sorts top products by units sold and then sales amount", () => {
    const products = getTopProducts([
      {
        total: 1000,
        items: [
          { title: "Wide Leg", quantity: 2, unit_price: 500 },
          { title: "Mom Fit", quantity: 3, unit_price: 300 },
        ],
      },
      {
        total: 800,
        items: [{ title: "Wide Leg", quantity: 2, unit_price: 400 }],
      },
    ])

    expect(products[0]).toEqual({ title: "Wide Leg", quantity: 4, total: 1800 })
    expect(products[1]).toEqual({ title: "Mom Fit", quantity: 3, total: 900 })
  })

  it("builds WhatsApp-ready output and SVG chart payload", () => {
    const report = buildSalesReport({
      period: "today",
      periodLabel: "hoy",
      start: new Date("2026-04-30T00:00:00.000Z"),
      end: new Date("2026-04-30T18:00:00.000Z"),
      orders: [
        {
          created_at: "2026-04-30T16:00:00.000Z",
          total: 1200,
          items: [{ title: "Recto Azul", quantity: 2, unit_price: 600 }],
        },
      ],
      previousOrders: [],
    })

    expect(report.whatsapp_message).toContain("*Ventas de hoy*")
    expect(report.whatsapp_message).toContain("Total: $1,200 MXN")
    expect(report.whatsapp_message).toContain("Recto Azul (2 unidades)")
    expect(report.chart_svg).toContain("<svg")
    expect(report.chart_data_url).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it("returns current and previous week ranges", () => {
    const range = getPeriodRange("week", new Date("2026-04-30T17:00:00.000Z"))

    expect(range.start.toISOString()).toBe("2026-04-27T00:00:00.000Z")
    expect(range.end.toISOString()).toBe("2026-04-30T17:00:00.000Z")
    expect(range.previousEnd.toISOString()).toBe("2026-04-27T00:00:00.000Z")
  })
})
