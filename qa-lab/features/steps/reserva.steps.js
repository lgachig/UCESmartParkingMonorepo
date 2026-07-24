const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL, GATEWAY_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

// Caché global de tokens en Node.js para evitar hacer login en la UI en cada escenario
const globalTokenCache = {};

Given('el usuario {string} ha iniciado sesión', async function (email) {
    const driver = getDriver();
    const password = 'A12345a-@';

    // 1. Obtener o realizar login directo vía API para evitar rebasar el Rate Limit
    let sessionData = globalTokenCache[email];
    if (!sessionData) {
        console.log(`🔑 Realizando login directo vía API para ${email}...`);
        const loginRes = await fetch(`${GATEWAY_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) {
            const body = await loginRes.text();
            throw new Error(`Error en login de API para ${email}: ${loginRes.status} - ${body}`);
        }
        sessionData = await loginRes.json();
        globalTokenCache[email] = sessionData;
    }

        const payload = sessionData.data || sessionData;
    const { accessToken, refreshToken, user } = payload;
    assert.ok(accessToken, `No se obtuvo access_token de la API de autenticación. Respuesta: ${JSON.stringify(sessionData)}`);

    // 2. Cargar la página de login para estar en el dominio correcto y poder inyectar localStorage
    await driver.get(`${BASE_URL}/login`);

    // 3. Inyectar tokens de sesión en localStorage
    await driver.executeScript((aToken, rToken, uData) => {
        window.localStorage.setItem('access_token', aToken);
        window.localStorage.setItem('refresh_token', rToken);
        window.localStorage.setItem('user', JSON.stringify(uData));
    }, accessToken, refreshToken, user);

    // 4. Navegar al dashboard del usuario
    await driver.get(`${BASE_URL}/user`);
    await driver.sleep(1500);

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    };

    // Limpieza: cancela/finaliza cualquier reserva pendiente o activa de pruebas anteriores
    const myReservationsRes = await fetch(`${GATEWAY_URL}/reservations/my-reservations`, {
        headers: authHeaders,
    });
    if (myReservationsRes.ok) {
        const myReservations = await myReservationsRes.json();
        console.log('🔍 Respuesta real de my-reservations:', JSON.stringify(myReservations, null, 2));

        const reservationsArray = Array.isArray(myReservations)
            ? myReservations
            : (myReservations.data || myReservations.reservations || myReservations.items || []);

        const dirty = reservationsArray.filter((r) => r.status === 'PENDING' || r.status === 'ACTIVE');
        for (const r of dirty) {
            if (r.status === 'PENDING') {
                await fetch(`${GATEWAY_URL}/reservations/${r.id}/cancel`, { method: 'PUT', headers: authHeaders });
                console.log(`🧹 Reserva PENDING ${r.id} cancelada (limpieza previa)`);
            } else if (r.status === 'ACTIVE') {
                await fetch(`${GATEWAY_URL}/reservations/${r.id}/check-out`, { method: 'POST', headers: authHeaders });
                console.log(`🧹 Reserva ACTIVE ${r.id} finalizada (limpieza previa)`);
            }
        }
    } else {
        console.log('⚠️ No se pudo consultar reservas previas, continuando de todos modos');
    }

    // Registrar vehículo vía API (la UI de "Mi Vehículo" aún no está implementada)
    // Se cachea en globalTokenCache para evitar rebasar el límite de peticiones (429) por minuto
    if (!globalTokenCache[`vehicle_${email}`]) {
        const response = await fetch(`${GATEWAY_URL}/vehicles/me`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                registrationNumber: 'ABC-1234',
                plate: 'PBC-9876',
                color: 'Negro',
                model: 'Toyota Corolla',
                year: 2020,
            }),
        });

        if (response.status === 201) {
            console.log('✅ Vehículo registrado correctamente');
            globalTokenCache[`vehicle_${email}`] = true;
        } else if (response.status === 409) {
            console.log('ℹ️ El usuario ya tenía un vehículo registrado, continuando...');
            globalTokenCache[`vehicle_${email}`] = true;
        } else if (response.status === 429) {
            console.log('⚠️ Rate limit hit (429) al registrar vehículo. Asumiendo que ya está registrado y continuando...');
            globalTokenCache[`vehicle_${email}`] = true;
        } else {
            const body = await response.text();
            throw new Error(`Error registrando vehículo: ${response.status} - ${body}`);
        }
    }
});

When('selecciona un espacio disponible en el mapa', async function () {
    const driver = getDriver();
    const locator = By.xpath("//div[contains(@class, 'leaflet-marker-icon')]/div[contains(@style, '#22C55E') or contains(@style, 'rgb(34, 197, 94)')]");
    
    // Intentar hasta 3 veces para evitar errores de elemento Stale causados por re-renders de Leaflet
    for (let i = 0; i < 3; i++) {
        try {
            await driver.wait(until.elementLocated(locator), 15000);
            const markers = await driver.findElements(locator);
            assert.ok(markers.length > 0, 'No se encontró ningún espacio disponible (verde) en el mapa');
            await markers[0].click();
            await driver.sleep(1000);
            return;
        } catch (err) {
            if (err.name === 'StaleElementReferenceError' && i < 2) {
                console.log('🔄 Stale element reference detectado. Reintentando click de marcador...');
                await driver.sleep(500);
                continue;
            }
            throw err;
        }
    }
});

When('confirma la reserva', async function () {
    const driver = getDriver();
    const locator = By.xpath("//button[contains(.,'RESERVAR')]");
    await driver.wait(until.elementLocated(locator), 8000);
    const btn = await driver.findElement(locator);
    await driver.wait(until.elementIsVisible(btn), 5000);
    await btn.click();
    await driver.sleep(1500);
});

Then('aparece la opción de hacer check-in', async function () {
    const driver = getDriver();
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'CHECK IN')]")), 10000);
    console.log('✅ Reserva confirmada, botón CHECK IN visible');
});

When('intenta seleccionar otro espacio disponible en el mapa', async function () {
    const driver = getDriver();
    // Buscamos de nuevo marcadores verdes. El ya reservado ahora es azul (isMine), por lo que no coincidirá.
    const locator = By.xpath("//div[contains(@class, 'leaflet-marker-icon')]/div[contains(@style, '#22C55E') or contains(@style, 'rgb(34, 197, 94)')]");
    await driver.wait(until.elementLocated(locator), 10000);
    const markers = await driver.findElements(locator);
    assert.ok(markers.length > 0, 'Se necesita al menos un segundo espacio disponible en el mapa para esta prueba');
    await markers[0].click();
    await driver.sleep(1000);
});

Given('el usuario no ha iniciado sesión', async function () {
    const driver = getDriver();
    await driver.get(`${BASE_URL}/login`);
    await driver.executeScript('window.localStorage.clear();');
});

When('intenta navegar directamente a la ruta de usuario', async function () {
    const driver = getDriver();
    await driver.get(`${BASE_URL}/user`);
});

Then('el sistema lo redirige a la página de login', async function () {
    const driver = getDriver();
    await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return currentUrl.includes('/login');
    }, 8000);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), `Se esperaba redirección a /login pero la URL fue ${url}`);
});