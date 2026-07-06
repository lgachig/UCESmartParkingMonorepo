export interface PaymentFailedContext {
    reservationCode: string;
    reason: string;
}

export function paymentFailedTemplate(ctx: PaymentFailedContext): string {
    return `
    <h2>Pago no procesado</h2>
    <p>No pudimos procesar el pago de tu reserva <strong>${ctx.reservationCode}</strong>.</p>
    <p>Motivo: ${ctx.reason}</p>
  `;
}