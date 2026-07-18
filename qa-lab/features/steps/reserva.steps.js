const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL, GATEWAY_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

Given('el usuario {string} ha iniciado sesión', async function (email) {
    const driver = getDriver();
    await driver.get(`${BASE_URL}/login`);
    await driver.findElement(By.name('email')).sendKeys(email);
    await driver.findElement(By.name('password')).sendKeys('A12345a-@');
    await driver.findElement(By.xpath("//button[contains(text(),'ACCEDER')]")).click();

    await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return !currentUrl.includes('/login');
    }, 8000);

    const token = await driver.executeScript("return window.localStorage.getItem('access_token');");
    assert.ok(token, 'No se encontró el access_token en localStorage tras el login');

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
    } else if (response.status === 409) {
        console.log('ℹ️ El usuario ya tenía un vehículo registrado, continuando...');
    } else {
        const body = await response.text();
        throw new Error(`Error registrando vehículo: ${response.status} - ${body}`);
    }
});

When('selecciona un espacio disponible en el mapa', async function () {
    const driver = getDriver();
    await driver.wait(until.elementLocated(By.className('leaflet-marker-icon')), 10000);
    const markers = await driver.findElements(By.className('leaflet-marker-icon'));
    assert.ok(markers.length > 0, 'No se encontró ningún espacio en el mapa');
    await markers[0].click();
    await driver.sleep(1000);
});

When('confirma la reserva', async function () {
    const driver = getDriver();
    await driver.findElement(By.xpath("//button[contains(text(),'RESERVAR')]")).click();
    await driver.sleep(1500);
});

Then('aparece la opción de hacer check-in', async function () {
    const driver = getDriver();
    await driver.wait(until.elementLocated(By.xpath("//button[contains(text(),'CHECK IN')]")), 10000);
    console.log('✅ Reserva confirmada, botón CHECK IN visible');
});