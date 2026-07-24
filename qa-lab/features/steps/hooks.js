const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { createDriver, quitDriver } = require('./driver-holder');

setDefaultTimeout(30 * 1000);

Before(async function () {
    // Espaciar el inicio de cada escenario para evitar ThrottlerException (Rate Limits) en el backend
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await createDriver();
});

After(async function () {
    await quitDriver();
});