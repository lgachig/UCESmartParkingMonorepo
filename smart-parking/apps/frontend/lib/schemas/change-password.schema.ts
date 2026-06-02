import { z } from 'zod';

const passwordRules = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/[0-9]/, 'Debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
