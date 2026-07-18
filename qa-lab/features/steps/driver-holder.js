const { Builder } = require('selenium-webdriver');
let driver = null;

module.exports = {
    async createDriver() {
        driver = await new Builder().forBrowser('chrome').build();
        return driver;
    },
    getDriver() {
        return driver;
    },
    async quitDriver() {
        if (driver) await driver.quit();
        driver = null;
    },
};