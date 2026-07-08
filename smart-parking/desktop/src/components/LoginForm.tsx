import React, { useState } from 'react';
import { authApi } from '../api/authApi';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Ingresa correo y contraseña');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { accessToken, refreshToken } = await authApi.login({ email: email.trim(), password });
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.status === 401 ? 'Credenciales inválidas' : 'No se pudo iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 360, margin: '80px auto' }}>
            <h2>Smart Parking — Gestión de Slots</h2>
            <input
                style={{ width: '100%', padding: 10, marginTop: 12 }}
                placeholder="Correo electrónico"
                autoCorrect="off"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                style={{ width: '100%', padding: 10, marginTop: 12 }}
                placeholder="Contraseña"
                type="password"
                autoCorrect="off"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p style={{ color: '#DC2626', marginTop: 8 }}>{error}</p>}
            <button style={{ width: '100%', padding: 10, marginTop: 16 }} onClick={handleLogin} disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
        </div>
    );
}