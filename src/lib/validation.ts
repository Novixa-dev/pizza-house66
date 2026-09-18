import { z } from "zod";

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل"),
  customerPhone: z
    .string()
    .min(9, "رقم الهاتف يجب أن يتكون من 9 أرقام على الأقل")
    .regex(/^(\+?967)?[7][0-9]{8}$/, "يرجى إدخال رقم هاتف يمني صالح (يبدأ بـ 7)"),
  pickupMode: z.enum(["ASAP", "SCHEDULED"]),
  requestedTime: z.string().optional(), // "HH:mm" if SCHEDULED
  paymentMethod: z.enum([
    "PAY_AT_PICKUP",
    "TRANSFER_KURAIMI",
    "TRANSFER_AMQI",
    "TRANSFER_BUSAIRI",
  ]),
  referenceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().max(500, "الملاحظات لا يمكن أن تتجاوز 500 حرف").optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        selectedOptionIds: z.array(z.string()),
        notes: z.string().optional(),
      })
    )
    .min(1, "السلة فارغة"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
