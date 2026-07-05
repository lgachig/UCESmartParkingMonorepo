export interface ReservationCancelledContext {
    reservationCode: string;
    slotNumber: string;
    zoneName?: string;
    cancelledByAdmin: boolean;
}

export function reservationCancelledTemplate(ctx: ReservationCancelledContext): string {
    const reason = ctx.cancelledByAdmin
        ? 'un administrador canceló tu reserva.'
        : 'cancelaste tu reserva.';

    return `
    <h2>Reserva cancelada</h2>
    <p>Tu reserva <strong>${ctx.reservationCode}</strong> del puesto <strong>${ctx.slotNumber}${ctx.zoneName ? ` (${ctx.zoneName})` : ''}</strong> fue cancelada.</p>
    <p>Motivo: ${reason}</p>
  `;
}