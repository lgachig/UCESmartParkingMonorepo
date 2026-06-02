import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/\d/, 'Debe incluir un número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe incluir un carácter especial');

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Nombre muy corto'),
    lastName: z.string().min(2, 'Apellido muy corto'),
    email: z.string().email('Correo inválido'),
    phone: z.string().optional(),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
