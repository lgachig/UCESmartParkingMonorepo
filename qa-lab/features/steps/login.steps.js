const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const { BASE_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

Given('el usuario abre la página de login', async function () {
  const driver = getDriver();
  await driver.get(`${BASE_URL}/login`);
});

When('ingresa el correo {string} y la contraseña {string}', async function (email, password) {
  const driver = getDriver();
  await driver.findElement(By.name('email')).sendKeys(email);
  await driver.findElement(By.name('password')).sendKeys(password);
});

When('presiona el botón {string}', async function (textoBoton) {
  const driver = getDriver();
  await driver.findElement(By.xpath(`//button[contains(.,'${textoBoton}')]`)).click();
  await driver.sleep(2000);
});

Then('el sistema lo redirige fuera de la página de login', async function () {
  const driver = getDriver();

  // Espera correcta: hasta que la URL YA NO contenga /login
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return !currentUrl.includes('/login');
  }, 8000);

  const url = await driver.getCurrentUrl();
  if (url.includes('/login')) {
    const image = await driver.takeScreenshot();
    fs.writeFileSync('login-failure.png', image, 'base64');
    console.log('📸 Captura guardada en qa-lab/login-failure.png');
    const bodyText = await driver.findElement(By.css('body')).getText();
    console.log('--- TEXTO DE LA PÁGINA ---');
    console.log(bodyText);
  }
  assert.ok(!url.includes('/login'), 'Seguía en /login, el test falló');
});

Then('el usuario permanece en la página de login', async function () {
  const driver = getDriver();
  await driver.sleep(1500); 
  const url = await driver.getCurrentUrl();
  assert.ok(url.includes('/login'), `Se esperaba permanecer en /login pero la URL fue ${url}`);
});

Then('no se produce ninguna redirección fuera del login', async function () {
  const driver = getDriver();
  const url = await driver.getCurrentUrl();
  assert.ok(url.includes('/login'), `No debía redirigir, pero la URL fue ${url}`);
});