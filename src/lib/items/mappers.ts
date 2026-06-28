import type { CreateItemFormValues, InventoryItem } from "@/types/item";
import { formatReportingUnitDisplay } from "@/types/item";
import type { Tables, TablesInsert } from "@/types/database";

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
    glCode: row.gl_code,
    vendor: row.vendor ?? "",
  };
}
