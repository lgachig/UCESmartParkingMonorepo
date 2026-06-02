import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Required'),
  plate: z.string().min(1, 'Required'),
  color: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
