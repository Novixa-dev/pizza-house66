import { describe, it, expect } from "vitest";
import { CreateOrderSchema, YEMENI_PHONE_REGEX } from "@/lib/validation";

describe("Validation Engine", () => {
  it("accepts valid Yemeni mobile formats across providers (Yemen Mobile, YOU, Sabafon, Y)", () => {
    const validNumbers = [
      "772207788",      // 9-digit standard
      "0772207788",     // Leading 0
      "+967772207788",  // International +967
      "00967772207788", // International 00967
      "731234567",      // YOU (MTN)
      "0731234567",     // YOU with leading 0
      "719876543",      // Sabafon
      "701122334",      // Y Telecom
      "789988776",      // Yemen Mobile 4G
    ];

    for (const num of validNumbers) {
      expect(YEMENI_PHONE_REGEX.test(num)).toBe(true);
    }
  });

  it("rejects invalid phone numbers", () => {
    const invalidNumbers = [
      "1234567",        // Too short
      "96777220",       // Incomplete
      "022345678",      // Landline/non-mobile prefix 02
      "05375561",       // Mukalla landline (not mobile)
      "061234567",      // Invalid prefix
      "abcdefgh",       // Non-numeric
      "971501234567",   // UAE number
    ];

    for (const num of invalidNumbers) {
      expect(YEMENI_PHONE_REGEX.test(num)).toBe(false);
    }
  });

  it("validates and normalizes valid order payload", () => {
    const rawPayload = {
      customerName: "محمد العمودي",
      customerPhone: "0772207788",
      pickupMode: "ASAP",
      paymentMethod: "PAY_AT_PICKUP",
      items: [
        {
          productId: "prod-pizza-1",
          quantity: 2,
          selectedOptionIds: ["opt-large", "opt-stuffed-crust"],
          notes: "تحمير خفيف",
        },
      ],
    };

    const parsed = CreateOrderSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // Should normalize 0772207788 to 772207788
      expect(parsed.data.customerPhone).toBe("772207788");
      expect(parsed.data.customerName).toBe("محمد العمودي");
      expect(parsed.data.items[0].quantity).toBe(2);
    }
  });

  it("rejects excessive quantity or empty items", () => {
    // Empty items
    const emptyOrder = {
      customerName: "سالم باوزير",
      customerPhone: "771234567",
      pickupMode: "ASAP",
      paymentMethod: "PAY_AT_PICKUP",
      items: [],
    };
    expect(CreateOrderSchema.safeParse(emptyOrder).success).toBe(false);

    // Quantity > 50
    const excessiveQty = {
      customerName: "سالم باوزير",
      customerPhone: "771234567",
      pickupMode: "ASAP",
      paymentMethod: "PAY_AT_PICKUP",
      items: [
        {
          productId: "prod-1",
          quantity: 51,
          selectedOptionIds: [],
        },
      ],
    };
    expect(CreateOrderSchema.safeParse(excessiveQty).success).toBe(false);
  });
});
