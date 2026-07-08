import React from 'react';

export interface Slot {
    id: string;
    code: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
    facultyId?: string;
    zoneId?: string;
}

const statusColors: Record<string, string> = {
    AVAILABLE: '#10B981',
    OCCUPIED: '#EF4444',
    RESERVED: '#F59E0B',
    MAINTENANCE: '#6B7280',
};

export default function SlotCard({ slot, onAction }: { slot: Slot; onAction: (id: string, action: string) => void }) {
    return (
        <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{slot.code}</strong>
                <span style={{ background: statusColors[slot.status], color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: 12 }}>
                    {slot.status}
                </span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {slot.status === 'AVAILABLE' && (
                    <button onClick={() => onAction(slot.id, 'reserve')}>Reservar</button>
                )}
                {slot.status === 'RESERVED' && (
                    <button onClick={() => onAction(slot.id, 'occupy')}>Ocupar</button>
                )}
                {(slot.status === 'RESERVED' || slot.status === 'OCCUPIED') && (
                    <button onClick={() => onAction(slot.id, 'release')}>Liberar</button>
                )}
                {slot.status !== 'MAINTENANCE' && (
                    <button onClick={() => onAction(slot.id, 'maintenance')}>Mantenimiento</button>
                )}
                {slot.status === 'MAINTENANCE' && (
                    <button onClick={() => onAction(slot.id, 'enable')}>Habilitar</button>
                )}
            </div>
        </div>
    );
}