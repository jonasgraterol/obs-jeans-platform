import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPriceLists,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import * as XLSX from "xlsx"
import * as path from "path"

// ============================================================
// Types
// ============================================================

interface TabConfig {
  name: string
  category: string
  headerRow: number
  modelCol: number
  toneCol: number | null
  typeCol: number | null
  locationCol: number | null
  sizeColumns: { col: number; label: string }[]
  priceColumns: {
    mayoreo: number | null
    menudeo: number | null
    wix: number | null
    coppel: number | null
    tiktok: number | null
    liverpool: number | null
    mercadoLibre: number | null
    shein: number | null
  }
}

interface ParsedRow {
  model: string
  tone: string
  type: string
  location: string
  sizes: { label: string; quantity: number }[]
  prices: {
    mayoreo: number | null
    menudeo: number | null
    wix: number | null
    coppel: number | null
    tiktok: number | null
    liverpool: number | null
    mercadoLibre: number | null
    shein: number | null
  }
}

interface ProductGroup {
  model: string
  tone: string
  type: string
  category: string
  sizes: Map<string, { bodega: number; tienda: number }>
  prices: ParsedRow["prices"]
}

// ============================================================
// Tab Configurations
// ============================================================

const TAB_CONFIGS: TabConfig[] = [
  {
    name: "MODA",
    category: "Moda Dama",
    headerRow: 5,
    modelCol: 0,
    toneCol: 1,
    typeCol: null,
    locationCol: 2,
    sizeColumns: [
      { col: 3, label: "1" },
      { col: 4, label: "3" },
      { col: 5, label: "5" },
      { col: 6, label: "7" },
      { col: 7, label: "9" },
      { col: 8, label: "11" },
      { col: 9, label: "13" },
      { col: 10, label: "15" },
      { col: 11, label: "17" },
      { col: 12, label: "19" },
      { col: 13, label: "21" },
      { col: 14, label: "23" },
      { col: 15, label: "25" },
    ],
    priceColumns: {
      mayoreo: 18,
      menudeo: 19,
      wix: 20,
      coppel: 21,
      tiktok: 22,
      liverpool: 23,
      mercadoLibre: 24,
      shein: 25,
    },
  },
  {
    name: "BASICO",
    category: "Básico Dama",
    headerRow: 5,
    modelCol: 0,
    toneCol: 1,
    typeCol: null,
    locationCol: 2,
    sizeColumns: [
      { col: 3, label: "1" },
      { col: 4, label: "3" },
      { col: 5, label: "5" },
      { col: 6, label: "7" },
      { col: 7, label: "9" },
      { col: 8, label: "11" },
      { col: 9, label: "13" },
      { col: 10, label: "15" },
      { col: 11, label: "17" },
      { col: 12, label: "19" },
      { col: 13, label: "21" },
      { col: 14, label: "23" },
      { col: 15, label: "25" },
    ],
    priceColumns: {
      mayoreo: 18,
      menudeo: 19,
      wix: 20,
      coppel: 21,
      tiktok: 22,
      liverpool: 23,
      mercadoLibre: 24,
      shein: null,
    },
  },
  {
    name: "PARTES ALTAS",
    category: "Partes Altas Dama",
    headerRow: 4,
    modelCol: 0,
    toneCol: 2,
    typeCol: 1,
    locationCol: 3,
    sizeColumns: [
      { col: 4, label: "S" },
      { col: 5, label: "M" },
      { col: 6, label: "L" },
      { col: 7, label: "XL" },
    ],
    priceColumns: {
      mayoreo: 10,
      menudeo: 11,
      wix: 12,
      coppel: 13,
      tiktok: 14,
      liverpool: 15,
      mercadoLibre: 16,
      shein: 17,
    },
  },
  {
    name: "CABALLERO",
    category: "Caballero",
    headerRow: 5,
    modelCol: 0,
    toneCol: 1,
    typeCol: null,
    locationCol: 2,
    sizeColumns: [
      { col: 3, label: "26" },
      { col: 4, label: "28" },
      { col: 5, label: "30" },
      { col: 6, label: "31" },
      { col: 7, label: "32" },
      { col: 8, label: "34" },
      { col: 9, label: "36" },
      { col: 10, label: "38" },
      { col: 11, label: "40" },
      { col: 12, label: "42" },
      { col: 13, label: "44" },
      { col: 14, label: "46" },
      { col: 15, label: "48" },
    ],
    priceColumns: {
      mayoreo: 18,
      menudeo: 19,
      wix: 20,
      coppel: 21,
      tiktok: 22,
      liverpool: 23,
      mercadoLibre: 24,
      shein: 25,
    },
  },
  {
    name: "SCRUBS",
    category: "Scrubs",
    headerRow: 6,
    modelCol: 0,
    toneCol: 1,
    typeCol: null,
    locationCol: 2,
    // Uses same odd-number system as MODA (S/M/L in row 4 are just labels)
    sizeColumns: [
      { col: 3, label: "3" },
      { col: 4, label: "5" },
      { col: 5, label: "7" },
      { col: 6, label: "9" },
      { col: 7, label: "11" },
      { col: 8, label: "13" },
      { col: 9, label: "15" },
      { col: 10, label: "17" },
      { col: 11, label: "19" },
      { col: 12, label: "21" },
      { col: 13, label: "23" },
      { col: 14, label: "25" },
    ],
    priceColumns: {
      mayoreo: 17,
      menudeo: 18,
      wix: 19,
      coppel: 20,
      tiktok: 21,
      liverpool: 22,
      mercadoLibre: 23,
      shein: 24,
    },
  },
  {
    name: "NIÑA",
    category: "Niña",
    headerRow: 5,
    modelCol: 0,
    toneCol: null,
    typeCol: null,
    locationCol: 1,
    sizeColumns: [
      { col: 2, label: "4" },
      { col: 3, label: "6" },
      { col: 4, label: "8" },
      { col: 5, label: "10" },
      { col: 6, label: "12" },
      { col: 7, label: "14" },
      { col: 8, label: "16" },
      { col: 9, label: "18" },
    ],
    priceColumns: {
      mayoreo: 14,
      menudeo: 15,
      wix: 16,
      coppel: 17,
      tiktok: 18,
      liverpool: 19,
      mercadoLibre: 20,
      shein: 21,
    },
  },
  {
    name: "DEPORTIVO",
    category: "Deportivo",
    headerRow: 4,
    modelCol: 0,
    toneCol: null,
    typeCol: 1,
    locationCol: 2,
    sizeColumns: [
      { col: 3, label: "XS" },
      { col: 4, label: "S" },
      { col: 5, label: "M" },
      { col: 6, label: "L" },
      { col: 7, label: "XL" },
    ],
    priceColumns: {
      mayoreo: 10,
      menudeo: 11,
      wix: 12,
      coppel: 13,
      tiktok: 14,
      liverpool: 15,
      mercadoLibre: 16,
      shein: 17,
    },
  },
  {
    name: "VESTIR",
    category: "Vestir",
    headerRow: 4,
    modelCol: 0,
    toneCol: 1,
    typeCol: null,
    locationCol: null, // VESTIR has no UBICACIÓN column
    sizeColumns: [
      { col: 2, label: "XS" },
      { col: 3, label: "S" },
      { col: 4, label: "M" },
      { col: 5, label: "L" },
      { col: 6, label: "XL" },
      { col: 7, label: "UNI" },
    ],
    priceColumns: {
      mayoreo: null,
      menudeo: null,
      wix: 19,
      coppel: null,
      tiktok: null,
      liverpool: null,
      mercadoLibre: null,
      shein: null,
    },
  },
]

// Tabs to skip (no prices or duplicate inventory tracking)
const SKIP_TABS = ["LIVERPOOL", "BAZAR 1415 FEB"]

// Locations that represent sellable inventory
const SELLABLE_LOCATIONS = ["BODEGA", "TIENDA"]

// ============================================================
// Excel Parsing
// ============================================================

function parseCell(value: unknown): string {
  if (value === null || value === undefined) return "-"
  const str = String(value).trim()
  return str === "" ? "-" : str
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (str === "-" || str === "") return null
  const num = Number(value)
  return isNaN(num) || num <= 0 ? null : num
}

function parseTab(workbook: XLSX.WorkBook, config: TabConfig): ParsedRow[] {
  const sheet = workbook.Sheets[config.name]
  if (!sheet) return []

  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  })

  const rows: ParsedRow[] = []
  let currentModel = ""
  let currentTone = ""
  let currentType = ""

  for (let i = config.headerRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const modelVal = parseCell(row[config.modelCol])
    const toneVal = config.toneCol !== null ? parseCell(row[config.toneCol]) : "-"
    const typeVal = config.typeCol !== null ? parseCell(row[config.typeCol]) : "-"
    const locationVal =
      config.locationCol !== null ? parseCell(row[config.locationCol]) : "TIENDA"

    // Update current model/tone when a new one appears
    if (modelVal !== "-") currentModel = modelVal
    if (toneVal !== "-") currentTone = toneVal
    if (typeVal !== "-") currentType = typeVal

    // Skip header-like rows, section headers, and summary rows
    if (!currentModel || currentModel === "MODELO") continue
    if (currentModel.startsWith("TOTAL")) continue
    if (currentModel.startsWith("MODA")) continue
    if (currentModel === "DAMA" || currentModel === "CABALLERO") continue
    if (currentModel === "PANTALON" || currentModel === "BERMUDA") continue

    // Parse size quantities
    const sizes = config.sizeColumns
      .map((sc) => ({
        label: sc.label,
        quantity: parseNumber(row[sc.col]),
      }))
      .filter((s) => s.quantity > 0)

    // Parse prices
    const prices = {
      mayoreo: config.priceColumns.mayoreo !== null ? parsePrice(row[config.priceColumns.mayoreo]) : null,
      menudeo: config.priceColumns.menudeo !== null ? parsePrice(row[config.priceColumns.menudeo]) : null,
      wix: config.priceColumns.wix !== null ? parsePrice(row[config.priceColumns.wix]) : null,
      coppel: config.priceColumns.coppel !== null ? parsePrice(row[config.priceColumns.coppel]) : null,
      tiktok: config.priceColumns.tiktok !== null ? parsePrice(row[config.priceColumns.tiktok]) : null,
      liverpool: config.priceColumns.liverpool !== null ? parsePrice(row[config.priceColumns.liverpool]) : null,
      mercadoLibre: config.priceColumns.mercadoLibre !== null ? parsePrice(row[config.priceColumns.mercadoLibre]) : null,
      shein: config.priceColumns.shein !== null ? parsePrice(row[config.priceColumns.shein]) : null,
    }

    // Keep rows that have either inventory OR prices (prices may be on
    // a row with zero stock, e.g. PARTES ALTAS BODEGA rows carry prices
    // while TIENDA rows carry inventory)
    const hasAnyPrice = Object.values(prices).some((p) => p !== null)
    if (sizes.length === 0 && !hasAnyPrice) continue

    rows.push({
      model: currentModel,
      tone: currentTone,
      type: currentType,
      location: locationVal,
      sizes,
      prices,
    })
  }

  return rows
}

// ============================================================
// Product Grouping
// ============================================================

function groupProducts(
  rows: ParsedRow[],
  category: string
): Map<string, ProductGroup> {
  const groups = new Map<string, ProductGroup>()

  for (const row of rows) {
    // Skip defective items
    if (row.location === "FALLOS") continue

    const key = `${row.model}__${row.tone}__${category}`

    if (!groups.has(key)) {
      groups.set(key, {
        model: row.model,
        tone: row.tone,
        type: row.type,
        category,
        sizes: new Map(),
        prices: row.prices,
      })
    }

    const group = groups.get(key)!

    // Update prices if this row has them and the group doesn't
    if (!group.prices.wix && row.prices.wix) {
      group.prices = row.prices
    }

    // Aggregate inventory by size and location
    const isBodega = row.location === "BODEGA"
    const isTienda = row.location === "TIENDA"

    for (const size of row.sizes) {
      if (!group.sizes.has(size.label)) {
        group.sizes.set(size.label, { bodega: 0, tienda: 0 })
      }
      const inv = group.sizes.get(size.label)!
      if (isBodega) inv.bodega += size.quantity
      else if (isTienda) inv.tienda += size.quantity
      // OFERTA inventory goes to bodega count (it's sellable, just discounted)
      else if (row.location === "OFERTA") inv.bodega += size.quantity
    }
  }

  return groups
}

// ============================================================
// Handle Generation
// ============================================================

function generateHandle(model: string, tone: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

  const modelPart = clean(model)
  const tonePart = tone && tone !== "-" ? `-${clean(tone)}` : ""
  return `${modelPart}${tonePart}`
}

function generateTitle(
  model: string,
  tone: string,
  type: string,
  category: string
): string {
  const parts = [model]
  if (type && type !== "-") parts.push(type)
  if (tone && tone !== "-") parts.push(tone)
  return parts.join(" - ")
}

function generateSku(model: string, tone: string, size: string): string {
  const clean = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

  const parts = [clean(model)]
  if (tone && tone !== "-") parts.push(clean(tone))
  parts.push(clean(size))
  return parts.join("-")
}

// ============================================================
// Main Import Function
// ============================================================

export default async function importProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const storeModuleService = container.resolve(Modules.STORE)

  // ----------------------------------------------------------
  // Configuration
  // ----------------------------------------------------------

  const XLSX_PATH =
    process.env.IMPORT_FILE_PATH ||
    path.resolve(__dirname, "../../../Inventario Bodega OBS (7).xlsx")

  const DRY_RUN = process.env.DRY_RUN === "true"

  logger.info(`📂 Reading Excel file: ${XLSX_PATH}`)
  logger.info(`🏃 Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE IMPORT"}`)

  // ----------------------------------------------------------
  // Step 1: Read Excel
  // ----------------------------------------------------------

  const workbook = XLSX.readFile(XLSX_PATH)
  logger.info(`📊 Found sheets: ${workbook.SheetNames.join(", ")}`)

  // ----------------------------------------------------------
  // Step 2: Parse all tabs and group products
  // ----------------------------------------------------------

  const allGroups: ProductGroup[] = []

  for (const config of TAB_CONFIGS) {
    if (SKIP_TABS.includes(config.name)) {
      logger.info(`⏭️  Skipping tab: ${config.name}`)
      continue
    }

    const rows = parseTab(workbook, config)
    const groups = groupProducts(rows, config.category)

    // Include products that have a store price (WIX preferred, MENUDEO fallback)
    let withPrice = 0
    let withoutPrice = 0

    for (const [key, group] of groups) {
      // Skip products with no inventory at all
      const totalInventory = Array.from(group.sizes.values()).reduce(
        (sum, inv) => sum + inv.bodega + inv.tienda,
        0
      )
      if (totalInventory === 0) {
        withoutPrice++
        continue
      }

      // Use WIX price, fall back to MENUDEO
      const storePrice = group.prices.wix || group.prices.menudeo
      if (storePrice) {
        group.prices.wix = storePrice // normalize so the rest of the script uses .wix
        allGroups.push(group)
        withPrice++
      } else {
        withoutPrice++
      }
    }

    logger.info(
      `📋 ${config.name}: ${rows.length} rows → ${groups.size} products (${withPrice} with WIX price, ${withoutPrice} skipped)`
    )
  }

  logger.info(`\n🎯 Total products to import: ${allGroups.length}`)

  if (DRY_RUN) {
    // Print summary and sample products
    logger.info("\n=== DRY RUN SUMMARY ===")
    const byCategory = new Map<string, number>()
    for (const g of allGroups) {
      byCategory.set(g.category, (byCategory.get(g.category) || 0) + 1)
    }
    for (const [cat, count] of byCategory) {
      logger.info(`  ${cat}: ${count} products`)
    }

    // Print first 3 products as sample
    logger.info("\n=== SAMPLE PRODUCTS ===")
    for (const g of allGroups.slice(0, 3)) {
      const sizes = Array.from(g.sizes.entries())
        .map(([s, inv]) => `${s}(B:${inv.bodega},T:${inv.tienda})`)
        .join(", ")
      logger.info(
        `  ${g.model} ${g.tone} [${g.category}] - WIX: $${g.prices.wix} MXN`
      )
      logger.info(`    Sizes: ${sizes}`)
      logger.info(
        `    SKU sample: ${generateSku(g.model, g.tone, Array.from(g.sizes.keys())[0])}`
      )
      logger.info(
        `    Handle: ${generateHandle(g.model, g.tone)}`
      )
    }
    logger.info("\n✅ Dry run complete. Run without DRY_RUN=true to import.")
    return
  }

  // ----------------------------------------------------------
  // Step 3: Setup store infrastructure
  // ----------------------------------------------------------

  logger.info("\n🏗️  Setting up store infrastructure...")

  // Get or create sales channel
  const [store] = await storeModuleService.listStores()
  let salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!salesChannels.length) {
    salesChannels = await salesChannelModuleService.listSalesChannels()
  }
  const defaultSalesChannel = salesChannels[0]
  logger.info(`  Sales Channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)

  // Get shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  const shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    throw new Error(
      "No default shipping profile found. Run seed script first or create one in the admin."
    )
  }
  logger.info(`  Shipping Profile: ${shippingProfile.id}`)

  // Create stock locations (Bodega + Tienda)
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  let bodegaLocation = existingLocations.find(
    (l: any) => l.name === "Bodega OBS"
  )
  let tiendaLocation = existingLocations.find(
    (l: any) => l.name === "Tienda OBS"
  )

  if (!bodegaLocation || !tiendaLocation) {
    const locationsToCreate: { name: string; address: any }[] = []

    if (!bodegaLocation) {
      locationsToCreate.push({
        name: "Bodega OBS",
        address: {
          city: "Jalisco",
          country_code: "MX",
          address_1: "Bodega Principal",
        },
      })
    }
    if (!tiendaLocation) {
      locationsToCreate.push({
        name: "Tienda OBS",
        address: {
          city: "Jalisco",
          country_code: "MX",
          address_1: "Tienda Principal",
        },
      })
    }

    if (locationsToCreate.length > 0) {
      const { result: locationResult } = await createStockLocationsWorkflow(
        container
      ).run({ input: { locations: locationsToCreate } })

      for (const loc of locationResult) {
        if (loc.name === "Bodega OBS") bodegaLocation = loc
        if (loc.name === "Tienda OBS") tiendaLocation = loc

        // Link to sales channel
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: { id: loc.id, add: [defaultSalesChannel.id] },
        })
      }
    }
  }

  logger.info(`  Bodega Location: ${bodegaLocation!.id}`)
  logger.info(`  Tienda Location: ${tiendaLocation!.id}`)

  // Create product categories
  const uniqueCategories = [...new Set(allGroups.map((g) => g.category))]

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })

  const categoriesToCreate = uniqueCategories.filter(
    (cat) => !existingCategories.find((ec: any) => ec.name === cat)
  )

  let categoryMap = new Map<string, string>()
  for (const ec of existingCategories) {
    categoryMap.set(ec.name, ec.id)
  }

  if (categoriesToCreate.length > 0) {
    const { result: categoryResult } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: categoriesToCreate.map((name) => ({
          name,
          is_active: true,
        })),
      },
    })

    for (const cat of categoryResult) {
      categoryMap.set(cat.name, cat.id)
    }
  }

  logger.info(
    `  Categories: ${uniqueCategories.map((c) => `${c} (${categoryMap.get(c)})`).join(", ")}`
  )

  // ----------------------------------------------------------
  // Step 4: Create products in batches
  // ----------------------------------------------------------

  logger.info("\n📦 Creating products...")

  const BATCH_SIZE = 20
  const allInventoryLevels: CreateInventoryLevelInput[] = []
  let totalCreated = 0

  for (let i = 0; i < allGroups.length; i += BATCH_SIZE) {
    const batch = allGroups.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allGroups.length / BATCH_SIZE)

    logger.info(
      `  Batch ${batchNum}/${totalBatches} (${batch.length} products)...`
    )

    const products = batch.map((group) => {
      const sizeValues = Array.from(group.sizes.keys())

      return {
        title: generateTitle(
          group.model,
          group.tone,
          group.type,
          group.category
        ),
        handle: generateHandle(group.model, group.tone),
        status: ProductStatus.PUBLISHED,
        category_ids: [categoryMap.get(group.category)!],
        shipping_profile_id: shippingProfile.id,
        origin_country: "MX",
        material: "Denim",
        options: [
          {
            title: "Talla",
            values: sizeValues,
          },
        ],
        variants: sizeValues.map((size) => ({
          title: size,
          sku: generateSku(group.model, group.tone, size),
          manage_inventory: true,
          options: { Talla: size },
          prices: [
            {
              amount: group.prices.wix!,
              currency_code: "mxn",
            },
          ],
        })),
        sales_channels: [{ id: defaultSalesChannel.id }],
      }
    })

    try {
      const { result: productResult } = await createProductsWorkflow(
        container
      ).run({ input: { products } })

      // Collect inventory levels for created products
      for (let j = 0; j < productResult.length; j++) {
        const product = productResult[j]
        const group = batch[j]

        for (const variant of product.variants) {
          const sizeLabel = variant.title
          const inv = group.sizes.get(sizeLabel)
          if (!inv) continue

          // Find the inventory item linked to this variant
          const { data: variantInventory } = await query.graph({
            entity: "product_variant",
            fields: ["inventory_items.inventory_item_id"],
            filters: { id: variant.id },
          })

          const inventoryItemId =
            variantInventory[0]?.inventory_items?.[0]?.inventory_item_id

          if (inventoryItemId) {
            if (inv.bodega > 0) {
              allInventoryLevels.push({
                location_id: bodegaLocation!.id,
                inventory_item_id: inventoryItemId,
                stocked_quantity: inv.bodega,
              })
            }
            if (inv.tienda > 0) {
              allInventoryLevels.push({
                location_id: tiendaLocation!.id,
                inventory_item_id: inventoryItemId,
                stocked_quantity: inv.tienda,
              })
            }
          }
        }

        totalCreated++
      }
    } catch (error: any) {
      logger.error(
        `  ❌ Batch ${batchNum} failed: ${error.message}`
      )
      // Log the failing products for debugging
      for (const p of products) {
        logger.error(`    - ${p.title} (${p.handle})`)
      }
      // Continue with next batch
      continue
    }
  }

  logger.info(`\n✅ Created ${totalCreated} products`)

  // ----------------------------------------------------------
  // Step 5: Set inventory levels
  // ----------------------------------------------------------

  if (allInventoryLevels.length > 0) {
    logger.info(
      `\n📊 Setting ${allInventoryLevels.length} inventory levels...`
    )

    // Process in batches to avoid overwhelming the system
    const INV_BATCH_SIZE = 100
    for (let i = 0; i < allInventoryLevels.length; i += INV_BATCH_SIZE) {
      const invBatch = allInventoryLevels.slice(i, i + INV_BATCH_SIZE)
      try {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: invBatch },
        })
      } catch (error: any) {
        logger.error(
          `  ❌ Inventory batch failed: ${error.message}`
        )
      }
    }

    logger.info(`  ✅ Inventory levels set`)
  }

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------

  logger.info("\n" + "=".repeat(50))
  logger.info("🎉 IMPORT COMPLETE")
  logger.info("=".repeat(50))
  logger.info(`  Products created: ${totalCreated}`)
  logger.info(`  Inventory levels: ${allInventoryLevels.length}`)
  logger.info(`  Categories: ${uniqueCategories.join(", ")}`)
  logger.info(`  Stock locations: Bodega OBS, Tienda OBS`)
  logger.info(`  Default price: WIX price in MXN`)
  logger.info("=".repeat(50))
  logger.info("\n💡 Next steps:")
  logger.info("  1. Check products in admin: http://localhost:9000/app/products")
  logger.info(
    "  2. Create Price Lists for MAYOREO, COPPEL, LIVERPOOL, etc. in the admin"
  )
  logger.info("  3. Add product images through the admin panel")
}
