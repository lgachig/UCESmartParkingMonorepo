const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const { BASE_URL } = require('../config');

describe('Inicio de sesión (Sin Cucumber)', () => {
  let driver;

  beforeEach(async () => {
    // Inicializa el driver antes de cada caso de prueba
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterEach(async () => {
    // Cierra el driver después de cada caso de prueba
    if (driver) {
      await driver.quit();
    }
  });

  test('Login exitoso con credenciales válidas', async () => {
    // 1. El usuario abre la página de login (Equivalente al "Given")
    await driver.get(`${BASE_URL}/login`);

    // 2. Ingresa el correo y la contraseña (Equivalente al "When")
    await driver.findElement(By.name('email')).sendKeys('user1@uce.edu.ec');
    await driver.findElement(By.name('password')).sendKeys('A12345a-@');

    // 3. Presiona el botón "ACCEDER" (Equivalente al "And")
    await driver.findElement(By.xpath("//button[contains(text(),'ACCEDER')]")).click();
    await driver.sleep(2000);

    // 4. El sistema lo redirige fuera de la página de login (Equivalente al "Then")
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return !currentUrl.includes('/login');
    }, 8000);

    const url = await driver.getCurrentUrl();
    if (url.includes('/login')) {
      const image = await driver.takeScreenshot();
      fs.writeFileSync('login-failure.png', image, 'base64');
      console.log('📸 Captura guardada en qa-lab-sin-cucumber/login-failure.png');
      const bodyText = await driver.findElement(By.css('body')).getText();
      console.log('--- TEXTO DE LA PÁGINA ---');
      console.log(bodyText);
    }

    assert.ok(!url.includes('/login'), 'Seguía en /login, el test falló');
  });
});
