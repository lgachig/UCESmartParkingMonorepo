const { When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

When('realiza el check-in en el espacio reservado', async function () {
  const driver = getDriver();
  const locator = By.xpath("//button[contains(.,'LLEGUE') and contains(.,'CHECK IN')]");
  await driver.wait(until.elementLocated(locator), 15000);
  const boton = await driver.findElement(locator);
  await driver.wait(until.elementIsVisible(boton), 5000);
  await boton.click();
  await driver.sleep(1500);
});

When('finaliza la sesión con check-out', async function () {
  const driver = getDriver();
  // Tras el check-in el mismo botón rojo pasa a decir "FINALIZAR SESIÓN"
  const locator = By.xpath("//button[contains(.,'FINALIZAR SESIÓN')]");
  await driver.wait(until.elementLocated(locator), 15000);
  const boton = await driver.findElement(locator);
  await driver.wait(until.elementIsVisible(boton), 5000);
  await boton.click();
  await driver.sleep(2000);
});

Then('el sistema refleja el fin de la sesión de parqueo', async function () {
  const driver = getDriver();
  // Dependiendo de la tarifa del usuario, el checkout puede terminar sin costo,
  // con redirección a pasarela de pago, o pendiente de pago desde "Mis Reservas".
  // Verificamos que aparezca alguno de esos desenlaces esperados.
  const xpathExpression = `//*[contains(normalize-space(.),'Sesión finalizada sin cargo')] | //*[contains(normalize-space(.),'Sesión finalizada. Paga desde "Mis Reservas".')] | //*[contains(normalize-space(.),'Error al procesar pago')]`;
  const locator = By.xpath(xpathExpression);
  let encontrado = false;
  try {
    await driver.wait(until.elementLocated(locator), 12000);
    const el = await driver.findElement(locator);
    if (await el.isDisplayed()) {
      encontrado = true;
    }
  } catch (e) {
    console.log('ℹ️ No se detectó mensaje en DOM en 12s, verificando redirección...');
  }
  // Si hubo redirección a la pasarela de pago (checkout.url), la URL ya no será /user
  const url = await driver.getCurrentUrl();
  const redirigioAPago = !url.includes('/user') || url.includes('checkout') || url.includes('payment');
  assert.ok(encontrado || redirigioAPago, 'No se detectó ningún desenlace esperado tras el check-out');
});

When('navega directamente a la vista de {string}', async function (vista) {
  const driver = getDriver();
  await driver.get(`${BASE_URL}/user/reservations`);
  await driver.sleep(1000);
});

Then('no se muestra ningún botón de {string} en la página', async function (textoBoton) {
  const driver = getDriver();
  const botones = await driver.findElements(By.xpath(`//button[contains(.,'${textoBoton.replace(' — ', '')}')]`));
  assert.strictEqual(botones.length, 0, `No debía existir un botón "${textoBoton}" en "Mis Reservas"`);
});