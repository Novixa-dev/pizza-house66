import { describe, it, expect } from "vitest";
import { calculateAuthoritativeOrder } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

describe("Pricing Engine & Option Availability", () => {
  it("authoritatively calculates base price and selected options ignoring client prices", async () => {
    // Find a real seeded product with options
    const product = await prisma.product.findFirst({
      where: { nameEn: { contains: "Pepperoni" } },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    expect(product).not.toBeNull();
    if (!product) return;

    // Pick first size and crust option
    const selectedOptionIds: string[] = [];
    let expectedUnitPrice = product.basePrice;

    for (const group of product.optionGroups) {
      if (group.options.length > 0) {
        const opt = group.options[0];
        selectedOptionIds.push(opt.id);
        expectedUnitPrice += opt.priceDelta;
      }
    }

    const calculation = await calculateAuthoritativeOrder([
      {
        productId: product.id,
        quantity: 2,
        selectedOptionIds,
      },
    ]);

    expect(calculation.isValid).toBe(true);
    expect(calculation.items.length).toBe(1);
    expect(calculation.items[0].unitPrice).toBe(expectedUnitPrice);
    expect(calculation.total).toBe(expectedUnitPrice * 2);
  });

  it("strictly rejects orders with unavailable (86'd) options", async () => {
    // Temporarily mark an option as unavailable
    const option = await prisma.optionItem.findFirst();
    expect(option).not.toBeNull();
    if (!option) return;

    // Find the product owning this option
    const group = await prisma.optionGroup.findUnique({
      where: { id: option.optionGroupId },
    });
    expect(group).not.toBeNull();
    if (!group) return;

    // Mark unavailable in DB
    await prisma.optionItem.update({
      where: { id: option.id },
      data: { isAvailable: false },
    });

    try {
      const calculation = await calculateAuthoritativeOrder([
        {
          productId: group.productId,
          quantity: 1,
          selectedOptionIds: [option.id],
        },
      ]);

      expect(calculation.isValid).toBe(false);
      expect(calculation.errorMessage).toContain("غير متوفر حالياً");
    } finally {
      // Revert availability
      await prisma.optionItem.update({
        where: { id: option.id },
        data: { isAvailable: true },
      });
    }
  });

  it("strictly rejects non-existent product IDs", async () => {
    const calculation = await calculateAuthoritativeOrder([
      {
        productId: "non-existent-fake-product-id",
        quantity: 1,
        selectedOptionIds: [],
      },
    ]);

    expect(calculation.isValid).toBe(false);
    expect(calculation.errorMessage).toContain("غير موجود");
  });
});
