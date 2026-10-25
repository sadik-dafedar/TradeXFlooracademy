import { z } from 'zod';

export const otpRequestSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const orderCreateSchema = z.object({
    productId: z.string().min(1, "Product ID required"),
});
