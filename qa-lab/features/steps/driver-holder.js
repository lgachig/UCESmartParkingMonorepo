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
        if (driver) {
            const currentDriver = driver;
            driver = null;
            try {
                await Promise.race([
                    currentDriver.quit(),
                    new Promise((resolve) => setTimeout(resolve, 5000))
                ]);
            } catch (e) {
                console.error('Error during driver quit:', e);
            }
        }
    },
};