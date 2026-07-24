const { Given, When, Then } = require('@cucumber/cucumber');
const { By } = require('selenium-webdriver');
const assert = require('assert');
const { BASE_URL } = require('../../config');
const { getDriver } = require('./driver-holder');

Given('el usuario abre la página de registro', async function () {
  const driver = getDriver();
  await driver.get(`${BASE_URL}/register`);
});

async function fillRegisterForm(driver, { firstName, lastName, email, password, confirmPassword }) {
  await driver.findElement(By.name('firstName')).sendKeys(firstName);
  await driver.findElement(By.name('lastName')).sendKeys(lastName);
  await driver.findElement(By.name('email')).sendKeys(email);
  await driver.findElement(By.name('password')).sendKeys(password);
  await driver.findElement(By.name('confirmPassword')).sendKeys(confirmPassword);
}

When('completa el formulario de registro con un correo institucional único y datos válidos', async function () {
  const driver = getDriver();
  const uniqueEmail = `qa.selenium.${Date.now()}.${Math.floor(Math.random() * 100000)}@uce.edu.ec`;
  this.registeredEmail = uniqueEmail;
  await fillRegisterForm(driver, {
    firstName: 'Ana',
    lastName: 'QA',
    email: uniqueEmail,
    password: 'A12345a-@',
    confirmPassword: 'A12345a-@',
  });
});

When('completa el formulario de registro con el correo {string} ya existente', async function (email) {
  const driver = getDriver();
  await fillRegisterForm(driver, {
    firstName: 'Luis',
    lastName: 'Achig',
    email,
    password: 'A12345a-@',
    confirmPassword: 'A12345a-@',
  });
});

When('completa el formulario de registro con contraseñas distintas entre sí', async function () {
  const driver = getDriver();
  const uniqueEmail = `qa.selenium.mismatch.${Date.now()}.${Math.floor(Math.random() * 100000)}@uce.edu.ec`;
  await fillRegisterForm(driver, {
    firstName: 'Carlos',
    lastName: 'Perez',
    email: uniqueEmail,
    password: 'A12345a-@',
    confirmPassword: 'OtraClave9!',
  });
});

Then('el sistema lo redirige fuera de la página de registro', async function () {
  const driver = getDriver();
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return !currentUrl.includes('/register');
  }, 8000);
  const url = await driver.getCurrentUrl();
  assert.ok(!url.includes('/register'), 'Seguía en /register, el registro falló');
});

Then('el usuario permanece en la página de registro', async function () {
  const driver = getDriver();
  await driver.sleep(1000);
  const url = await driver.getCurrentUrl();
  assert.ok(url.includes('/register'), `Se esperaba permanecer en /register pero la URL fue ${url}`);
});