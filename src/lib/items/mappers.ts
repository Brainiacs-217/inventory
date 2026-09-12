import type { CreateItemFormValues, InventoryItem } from "@/types/item";
import { formatReportingUnitDisplay } from "@/types/item";
import type { Tables, TablesInsert } from "@/types/database";

export type CatalogItemRow = {
  id: number | string;
  name: string;
  subcategory: {
    name: string;
    category: {
      name: string;
      item_type: {
        name: string;
      } | null;
    } | null;
  } | null;
  item_packages:
    | {
        sku: string | null;
        purchase_price: number | string | null;
        units_per_package: number | null;
        unit_size: number | string | null;
        vendor: { name: string } | null;
        unit: { name: string; symbol: string } | null;
      }[]
    | null;
};

function formatNumericDisplay(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toFixed(4)));
}

function formatPackageReportingUnit(
  unitSize: number | string | null | undefined,
  unitSymbol: string | null | undefined,
  unitsPerPackage: number | null | undefined,
): string {
  const size = unitSize == null || unitSize === "" ? null : Number(unitSize);
  const symbol = unitSymbol?.trim() ?? "";
  const sizeLabel =
    size != null && Number.isFinite(size)
      ? `${formatNumericDisplay(size)}${symbol ? ` ${symbol}` : ""}`
      : symbol;

  if (!sizeLabel) return "";
  if (unitsPerPackage != null && unitsPerPackage > 1) {
    return `${unitsPerPackage} × ${sizeLabel}`;
  }
  return sizeLabel;
}

function toCost(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapFormToItemInsert(
  values: CreateItemFormValues,
  organizationId: string,
): TablesInsert<"items"> {
  const caseSize = values.caseSize.trim() ? parseFloat(values.caseSize) : null;
  const parLevel = values.parLevel.trim() ? parseFloat(values.parLevel) : null;

  return {
    organization_id: organizationId,
    name: values.name.trim(),
    category: values.category,
    vendor: values.vendor,
    sku: values.sku.trim() || null,
    price: parseFloat(values.price),
    case_size: caseSize,
    unit_size: parseFloat(values.unitSize),
    unit_of_measure: values.unitOfMeasure,
    unit_name: values.unitName.trim(),
    reporting_unit: values.reportingUnit,
    base_unit: values.baseUnit,
    cost: parseFloat(values.cost),
    cost_manually_edited: values.costManuallyEdited,
    par_level: parLevel,
    gl_code: values.glCode.trim() || null,
    notes: values.notes.trim() || null,
  };
}

export function mapItemRowToInventoryItem(row: Tables<"items">): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    reportingUnit: formatReportingUnitDisplay(
      row.unit_name,
      String(row.unit_size),
      row.unit_of_measure,
    ),
    cost: row.cost ?? 0,
    sku: row.sku ?? "",
    category: row.category,
    subcategory: "",
    vendor: row.vendor ?? "",
  };
}

export function mapCatalogItemRow(row: CatalogItemRow): InventoryItem {
  const pkg = row.item_packages?.[0];
  const itemType = row.subcategory?.category?.item_type?.name?.trim() ?? "";
  const categoryName = row.subcategory?.category?.name?.trim() ?? "";
  const subcategoryName = row.subcategory?.name?.trim() ?? "";

  return {
    id: String(row.id),
    name: row.name,
    reportingUnit: formatPackageReportingUnit(
      pkg?.unit_size,
      pkg?.unit?.symbol ?? pkg?.unit?.name,
      pkg?.units_per_package,
    ),
    cost: toCost(pkg?.purchase_price),
    sku: pkg?.sku ?? "",
    category: itemType || categoryName,
    subcategory: subcategoryName,
    vendor: pkg?.vendor?.name ?? "",
  };
}
