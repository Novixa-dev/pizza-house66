import { prisma } from "./prisma";

export interface ItemSubmissionInput {
  productId: string;
  quantity: number;
  selectedOptionIds: string[];
  notes?: string;
}

export interface CalculatedOrderItem {
  productId: string;
  productNameAr: string;
  productNameEn: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  selectedOptions: {
    groupNameAr: string;
    groupNameEn: string;
    nameAr: string;
    nameEn: string;
    priceDelta: number;
  }[];
}

export interface AuthoritativePriceResult {
  isValid: boolean;
  errorMessage?: string;
  subtotal: number;
  discount: number;
  total: number;
  items: CalculatedOrderItem[];
}

/**
 * Calculates authoritative order totals by querying the database directly.
 * Completely ignores any client-provided price values.
 */
export async function calculateAuthoritativeOrder(
  itemsInput: ItemSubmissionInput[]
): Promise<AuthoritativePriceResult> {
  if (!itemsInput || itemsInput.length === 0) {
    return {
      isValid: false,
      errorMessage: "السلة فارغة، يرجى إضافة أطباق أولاً.",
      subtotal: 0,
      discount: 0,
      total: 0,
      items: [],
    };
  }

  const calculatedItems: CalculatedOrderItem[] = [];
  let orderSubtotal = 0;

  for (const itemInput of itemsInput) {
    if (!itemInput.productId || itemInput.quantity <= 0) {
      return {
        isValid: false,
        errorMessage: "بيانات الصنف غير صالحة.",
        subtotal: 0,
        discount: 0,
        total: 0,
        items: [],
      };
    }

    // Fetch product from DB with options
    const product = await prisma.product.findUnique({
      where: { id: itemInput.productId },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!product) {
      return {
        isValid: false,
        errorMessage: `الصنف المطلوب غير موجود.`,
        subtotal: 0,
        discount: 0,
        total: 0,
        items: [],
      };
    }

    if (!product.isAvailable) {
      return {
        isValid: false,
        errorMessage: `نعتذر، الصنف "${product.nameAr}" نفد من المخزون حالياً.`,
        subtotal: 0,
        discount: 0,
        total: 0,
        items: [],
      };
    }

    let unitPrice = product.basePrice;
    const itemOptions: CalculatedOrderItem["selectedOptions"] = [];

    // Resolve selected options
    const selectedSet = new Set(itemInput.selectedOptionIds || []);

    for (const group of product.optionGroups) {
      const selectedInGroup = group.options.filter((opt) => selectedSet.has(opt.id));

      if (group.isRequired && selectedInGroup.length < group.minSelect) {
        return {
          isValid: false,
          errorMessage: `يرجى تحديد الخيار الإجباري لمجموعة "${group.nameAr}" في صنف "${product.nameAr}".`,
          subtotal: 0,
          discount: 0,
          total: 0,
          items: [],
        };
      }

      if (group.maxSelect && selectedInGroup.length > group.maxSelect) {
        return {
          isValid: false,
          errorMessage: `لقد تجاوزت الحد الأقصى للاختيارات في "${group.nameAr}".`,
          subtotal: 0,
          discount: 0,
          total: 0,
          items: [],
        };
      }

      for (const opt of selectedInGroup) {
        if (!opt.isAvailable) {
          return {
            isValid: false,
            errorMessage: `نعتذر، الخيار "${opt.nameAr}" في صنف "${product.nameAr}" غير متوفر حالياً.`,
            subtotal: 0,
            discount: 0,
            total: 0,
            items: [],
          };
        }

        unitPrice += opt.priceDelta;
        itemOptions.push({
          groupNameAr: group.nameAr,
          groupNameEn: group.nameEn,
          nameAr: opt.nameAr,
          nameEn: opt.nameEn,
          priceDelta: opt.priceDelta,
        });
      }
    }

    const itemSubtotal = unitPrice * itemInput.quantity;
    orderSubtotal += itemSubtotal;

    calculatedItems.push({
      productId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      unitPrice,
      quantity: itemInput.quantity,
      subtotal: itemSubtotal,
      notes: itemInput.notes,
      selectedOptions: itemOptions,
    });
  }

  const discount = 0; // Configurable promotion logic
  const total = orderSubtotal - discount;

  return {
    isValid: true,
    subtotal: orderSubtotal,
    discount,
    total,
    items: calculatedItems,
  };
}
