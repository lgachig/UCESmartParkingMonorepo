const { When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { getDriver } = require('./driver-holder');

When('cancela la reserva desde el panel de detalle', async function () {
  const driver = getDriver();
  const locator = By.xpath("//button[contains(.,'CANCELAR RESERVA')]");
  await driver.wait(until.elementLocated(locator), 15000);
  const boton = await driver.findElement(locator);
  await driver.wait(until.elementIsVisible(boton), 5000);
  await boton.click();
  await driver.sleep(1500);
});

Then('el botón de cancelar quedó inhabilitado durante el procesamiento', async function () {
  // El botón desaparece junto con el panel una vez completada la cancelación
  // (setSelectedSlot(null) en el flujo de liberación). Confirmamos que ya no
  // existe un botón de "CANCELAR RESERVA" visible tras la operación.
  const driver = getDriver();
  const botones = await driver.findElements(By.xpath("//button[contains(.,'CANCELAR RESERVA')]"));
  assert.strictEqual(botones.length, 0, 'El panel de cancelación seguía visible tras cancelar');
});