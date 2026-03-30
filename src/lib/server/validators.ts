import { z } from 'zod';

export const queueMailSchema = z
  .object({
    to: z.string().email(),
    subject: z.string().trim().min(1).max(998),
    text: z.string().trim().min(1).optional(),
    html: z.string().trim().min(1).optional(),
    replyTo: z.string().email().optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    headers: z.record(z.string(), z.string()).optional()
  })
  .refine((value) => value.text || value.html, {
    message: 'Either text or html must be present',
    path: ['text']
  });

export type QueueMailInput = z.infer<typeof queueMailSchema>;
