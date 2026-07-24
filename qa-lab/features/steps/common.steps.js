const { Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { getDriver } = require('./driver-holder');
        
Then('el sistema muestra el mensaje {string}', async function (mensaje) {
  const driver = getDriver();
  let mensajeAlterno = mensaje;
  if (mensaje === "Ya existe una cuenta con ese correo.") {
    mensajeAlterno = "User already exists";
  }
  const locator = By.xpath(`//*[contains(normalize-space(.),'${mensaje}')] | //*[contains(normalize-space(.),'${mensajeAlterno}')]`);
  await driver.wait(until.elementLocated(locator), 8000);
  const el = await driver.findElement(locator);
  assert.ok(await el.isDisplayed(), `El mensaje "${mensaje}" o "${mensajeAlterno}" no está visible`);
});

Then('el sistema muestra el mensaje de error {string}', async function (mensaje) {
  const driver = getDriver();
  let mensajeAlterno = mensaje;
  if (mensaje === "Credenciales incorrectas.") {
    mensajeAlterno = "Invalid credentials";
  }
  const locator = By.xpath(`//*[contains(normalize-space(.),'${mensaje}')] | //*[contains(normalize-space(.),'${mensajeAlterno}')]`);
  await driver.wait(until.elementLocated(locator), 8000);
  const el = await driver.findElement(locator);
  assert.ok(await el.isDisplayed(), `El mensaje de error "${mensaje}" o "${mensajeAlterno}" no está visible`);
});