export interface PaymentProcessedContext {
    reservationCode: string;
}

export function paymentProcessedTemplate(ctx: PaymentProcessedContext): string {
    return `
    <h2>Pago procesado</h2>
    <p>Tu pago para la reserva <strong>${ctx.reservationCode}</strong> fue procesado correctamente.</p>
  `;
}