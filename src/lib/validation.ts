import { z } from "zod";

// Yemeni mobile prefix: 70, 71, 73, 77, 78 followed by 7 digits (total 9 digits).
// Accepts optional prefix: +967, 00967, or local leading 0.
export const YEMENI_PHONE_REGEX =
  /^(?:(?:\+|00)?967|0)?(7[01378][0-9]{7})$/;

export const CreateOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  customerPhone: z
    .string()
    .trim()
    .refine((val) => YEMENI_PHONE_REGEX.test(val.replace(/\s+/g, "")), {
      message:
        "يرجى إدخال رقم جوال يمني صالح (مثال: 772207788 أو 0772207788)",
    })
    .transform((val) => {
      // Normalize to 9-digit standard format: 7xxxxxxxx
      const clean = val.replace(/\s+/g, "");
      const match = clean.match(YEMENI_PHONE_REGEX);
      return match ? match[1] : clean;
    }),
  pickupMode: z.enum(["ASAP", "SCHEDULED"]),
  requestedTime: z.string().optional(), // "HH:mm" if SCHEDULED
  paymentMethod: z.enum([
    "PAY_AT_PICKUP",
    "TRANSFER_KURAIMI",
    "TRANSFER_AMQI",
    "TRANSFER_BUSAIRI",
  ]),
  referenceNumber: z
    .string()
    .max(100, "الرقم المرجعي لا يمكن أن يتجاوز 100 حرف")
    .optional(),
  receiptUrl: z
    .string()
    .max(8 * 1024 * 1024, "حجم الإشعار كبير جداً")
    .optional(),
  notes: z.string().max(500, "الملاحظات لا يمكن أن تتجاوز 500 حرف").optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "معرف الصنف مطلوب"),
        quantity: z
          .number()
          .int("الكمية يجب أن تكون عدداً صحيحاً")
          .positive("الكمية يجب أن تكون أكبر من صفر")
          .max(50, "الحد الأقصى للكمية هو 50 قطعة لكل صنف"),
        selectedOptionIds: z.array(z.string()).max(20, "خيارات زائدة"),
        notes: z.string().max(200, "ملاحظات الصنف لا تتجاوز 200 حرف").optional(),
      })
    )
    .min(1, "السلة فارغة، يرجى اختيار صنف واحد على الأقل")
    .max(30, "الحد الأقصى لعدد الأصناف المختلفة في الطلب هو 30 صنفاً"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

