const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { createDriver, quitDriver } = require('./driver-holder');

setDefaultTimeout(30 * 1000);

Before(async function () {
    await createDriver();
});

After(async function () {
    await quitDriver();
});