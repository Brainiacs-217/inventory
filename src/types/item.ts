export type InventoryItem = {
  id: string;
  name: string;
  reportingUnit: string;
  cost: number;
  sku: string;
  category: string;
  subcategory: string;
  vendor: string;
};

export type ItemConversion = {
  fromUnit: string;
  toUnit: string;
  factor: number;
};

export type ItemWeightSettings = {
  tareWeight: number;
  fullWeight: number;
  weightUnit: string;
};

export type CreateItemFormValues = {
  name: string;
  category: string;
  caseSize: string;
  unitSize: string;
  unitOfMeasure: string;
  unitName: string;
  vendor: string;
  sku: string;
  price: string;
  reportingUnit: string;
  baseUnit: string;
  cost: string;
  costManuallyEdited: boolean;
  parLevel: string;
  conversions: ItemConversion[];
  useCustomWeights: boolean;
  weights: ItemWeightSettings;
  glCode: string;
  notes: string;
};

export function formatReportingUnitDisplay(
  unitName: string,
  unitSize: string,
  unitOfMeasure: string,
): string {
  const size = unitSize.trim();
  const uom = unitOfMeasure.trim();
  if (size && uom) {
    return `${unitName} (${size}${uom})`;
  }
  if (size) {
    return `${unitName} (${size})`;
  }
  return unitName;
}

export function createEmptyItemFormValues(): CreateItemFormValues {
  return {
    name: "",
    category: "",
    caseSize: "",
    unitSize: "",
    unitOfMeasure: "",
    unitName: "",
    vendor: "",
    sku: "",
    price: "",
    reportingUnit: "",
    baseUnit: "",
    cost: "",
    costManuallyEdited: false,
    parLevel: "",
    conversions: [],
    useCustomWeights: false,
    weights: {
      tareWeight: 0,
      fullWeight: 0,
      weightUnit: "oz",
    },
    glCode: "",
    notes: "",
  };
}
