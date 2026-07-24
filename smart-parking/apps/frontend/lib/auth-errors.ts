import axios from 'axios';

export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica que los servicios estén activos.';
    }
    if (error.response.status === 401) return 'Credenciales incorrectas.';
    if (error.response.status === 409) return 'Ya existe una cuenta con ese correo.';
    if (error.response.status === 429) {
      return 'Demasiados intentos. Espera un minuto e intenta de nuevo.';
    }
    if (error.response.status === 400) {
      return 'Datos inválidos o token expirado.';
    }

    const data = error.response.data as {
      message?: string | string[] | { message?: string };
    };
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (
      data?.message &&
      typeof data.message === 'object' &&
      'message' in data.message
    ) {
      return String(data.message.message);
    }
  }
  return fallback;
}
