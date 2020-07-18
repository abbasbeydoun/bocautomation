const {Builder, By, Capabilities, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const proxy = require('selenium-webdriver/proxy');
const uuid = require('uuid-with-v6');
const dbc = require('dbc_api_nodejs');
const gmail_api = require('../gmail');
require('chromedriver');
let dbcCreds = {
    'username': 'captchasolver9996',
    'password': 'Captcha@1996'
};
const client = new dbc.HttpClient(dbcCreds.username, dbcCreds.password, "");

let acxiom_optout = async (data) => {

    let url = 'https://isapps.acxiom.com/optout/optout.aspx#section8';
    let driver = await new Builder().forBrowser('chrome')
        .withCapabilities(Capabilities.chrome())
        .build();

    try {
        await driver.get(url);
        await driver.findElement(By.css('.ss-disabled')).click();
        let mailing_address_segment = await driver.wait(  until.elementLocated(By.xpath('//div[contains(text(),\'Mailing Addresses\')]')),   20000);
        await driver.executeScript('arguments[0].click()', mailing_address_segment);
        let phone_numbers_segment = await driver.wait(  until.elementLocated(By.xpath('//div[contains(text(),\'Phone Numbers\')]')),   20000);
        await driver.executeScript('arguments[0].click()', phone_numbers_segment);
        let email_addresses_segment = await driver.wait(  until.elementLocated(By.xpath('//div[contains(text(),\'Email Addresses\')]')),   20000);
        await driver.executeScript('arguments[0].click()', email_addresses_segment);
        await driver.findElement(By.css('option[value="Submitter"]')).click();
        await driver.findElement(By.css('option[value="Mr."]')).click();
        await driver.findElement(By.css('input[name="FirstName"]')).sendKeys('Leo');
        await driver.findElement(By.css('input[name="LastName"]')).sendKeys('Beydoun');

        let addName = await driver.wait(  until.elementLocated(By.css('input[name="AddName2"]')),   20000);
        await driver.sleep(5000);
        await driver.executeScript('arguments[0].click()', addName);

        await driver.findElement(By.css('input[name="AreaCode"]')).sendKeys('703');
        await driver.findElement(By.css('input[name="PhoneNumber"]')).sendKeys('5761234');

        let addPhone = await driver.wait(  until.elementLocated(By.css('input[id="AddPhone2"]')),   20000);
        await driver.sleep(8000);
        await driver.executeScript('arguments[0].click()', addPhone);

        await driver.sleep(5000);
        await driver.findElement(By.css('input[name="Email"]')).sendKeys('tester@gmail.com');

        let addEmail = await driver.wait(  until.elementLocated(By.css('input[name="AddEmail2"]')),   20000);
        await driver.sleep(6000);
        await driver.executeScript('arguments[0].click()', addEmail);

        await driver.findElement(By.css('input[name="Street1"]')).sendKeys('1235 Random Way');
        await driver.findElement(By.css('input[name="Street2"]')).sendKeys('202');
        await driver.findElement(By.css('input[name="City"]')).sendKeys('Detroit');

        // Option value taken from data
        let stateSelection = await driver.findElement(By.css('select[name="State"] option[value="DC"]'));
        await driver.sleep(3000);
        stateSelection.click();

        await driver.findElement(By.css('input[name="Zip"]')).sendKeys('20017');

        let addAddress = await driver.wait(  until.elementLocated(By.css('input[name="AddAddress2"]')),   20000);
        await driver.sleep(3000);
        await driver.executeScript('arguments[0].click()', addAddress);

        try {
            let selectAddress = await driver.wait(until.elementLocated(By.css('input[name="SelectCorrected2"]')), 10000);
            await driver.executeScript('arguments[0].click()', selectAddress);
        } catch (err) {
            let selectAddress2 = await driver.wait(until.elementLocated(By.css('input[name="SelectOriginal2"]')),   20000);
            await driver.executeScript('arguments[0].click()', selectAddress2);
        }

        let submitButton = await driver.findElement(By.css('input[name="SubmitButton2"]'));
        await driver.sleep(5000);
        await driver.executeScript('arguments[0].click()', submitButton);

        // Next Page

        await driver.wait(until.elementLocated(By.css('input[name="confirmationEmailAddress"]')), 10000).sendKeys('bocautomation12+' + uuid.v6().slice(0,23) + '@gmail.com');

        // solve captcha
        // Proxy and Recaptcha token data
        let token_params = JSON.stringify({
            'proxy': '',
            'proxytype': '',
            'googlekey': '6LcLljUUAAAAAGl9-FFS3yg9BvixGZmY2KGYU-RQ',
            'pageurl': 'https://isapps.acxiom.com/optout/optout.aspx'
        });

        // Get user balance
        client.get_balance((balance) => {
            console.log(balance);
        });
        client.decode({extra: {type: 4, token_params: token_params}, timeout: 500},  async (captcha) => {
            if (captcha) {
                console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
                console.log(captcha);

                let cmd = 'document.getElementById("g-recaptcha-response").innerHTML="' + captcha['text']  +'";';
                driver.executeScript(cmd);
                await driver.sleep(2000);
                let submitButton = await driver.findElement(By.css('input[name="CaptchaSubmit2"]'));
                await driver.sleep(2000);
                await driver.executeScript('arguments[0].click()', submitButton);

                // Captcha solved, go to e-mail and click link

                await driver.sleep(30000);

                let optoutUrl = await gmail_api.getAxiomOptoutLink();
                await driver.get(optoutUrl);

                token_params = JSON.stringify({
                    'proxy': '',
                    'proxytype': '',
                    'googlekey': '6LcLljUUAAAAAGl9-FFS3yg9BvixGZmY2KGYU-RQ',
                    'pageurl': optoutUrl
                });

                client.get_balance((balance) => {
                    console.log(balance);
                });

                client.decode({extra: {type: 4, token_params: token_params}, timeout: 500}, async (captcha) => {
                    if (captcha) {
                        console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
                        console.log(captcha);
                        let cmd = 'document.getElementById("g-recaptcha-response").innerHTML="' + captcha['text'] + '";';
                        driver.executeScript(cmd);
                        await driver.sleep(2000);
                        let submitButton = await driver.findElement(By.css('input[name="ConfirmButton2"]'));
                        await driver.sleep(2000);
                        await driver.executeScript('arguments[0].click()', submitButton);
                        // Get reference number
                        await driver.sleep(2000);
                        let refNumber = await driver.wait(until.elementLocated(By.css('span[id="ReferenceNumber"]')), 20000).getText();
                        console.log(refNumber);
                        console.log('Successfully opted out of acxiom');
                        await driver.quit();
                    }
                });
            }
        });
        


    } catch(error) {
        console.log("ERROR OCCURED");
        console.log(error);
    }
};

let beenVerifiedOptOut = async (clientInfo) => {
    try{
        let driver = new Builder().forBrowser('chrome')
            //.setChromeOptions(chromeOption)
            .withCapabilities(Capabilities.chrome())
            .build();

        driver.manage().window().maximize();
        // just hard coding here but will change
        clientInfo = {
            'fname': 'Joshua',
            'lname': 'Anderson',
            'age': '26'
        };

        await driver.get(`https://www.beenverified.com/app/search/person?fn=${clientInfo.fname}&ln=${clientInfo.lname}&optout=true`);
        // capture all the people info with the matching on the page, and traverse through each to check if the age is same
        await driver.sleep(1000);
        let peopleList = await driver.findElements(By.css('div[id="person_result"]'));
        console.log(peopleList.length);
        for (let people of peopleList) {
            if (await people.findElement(By.css('div.age')).getText() === clientInfo.age) {
                await people.findElement(By.className('fa fa-chevron-right')).click();
                let randomEnd = uuid.v6();
                let email = 'bocautomation12+' + randomEnd + '@gmail.com';
                await driver.findElement(By.id('optout-email')).sendKeys(email);
                // Find the captcha text box and click on it
                await driver.wait(until.elementLocated(By.xpath('//iframe[@role]')), 5000);
                let iframe = await driver.findElement(By.xpath('//iframe[@role]'));
                let srcTag = await iframe.getAttribute('src');
                //await driver.switchTo().frame(iframe);
                /*let captchaBox = await driver.findElement(By.id('recaptcha-anchor'));
                captchaBox.click();*/
                // get the pageurl and replace /anchor with /demo
                let pageurl = srcTag.slice(0,srcTag.search(",")).split("/").slice(0,-1).join("/") + "/demo";
                // find the google key by extracting k= and & from the k= string
                let key = srcTag.slice(srcTag.search("k="))
                let googlekey = key.slice(2, key.search("&"));
                console.log(pageurl, googlekey)
                let url = await driver.getCurrentUrl();
                // Proxy and Recaptcha token data
                const token_params = JSON.stringify({
                    'proxy': '',
                    'proxytype': '',
                    'googlekey': googlekey,
                    'pageurl': url
                });
                client.decode({extra: {type: 4, token_params: token_params}}, async (captcha) => {
                    console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
                    // Report an incorrectly solved CAPTCHA.
                    // Make sure the CAPTCHA was in fact incorrectly solved!
                    client.report(captcha['captcha'], (result) => {
                       console.log('Report status: ' + result);
                    });
                    await driver.executeScript('document.getElementById("g-recaptcha-response").innerHTML=\"' + captcha['text'] + "\"");
                    let btn = await driver.findElement(By.css('button[id="optout"'));
                    await btn.click();
                    // wait for 10 minutes for email to get here then do call
                    await driver.sleep(300000);
                    let optoutURL = await gmail_api.emailConfirmBeenVerified();
                    await driver.get(optoutURL);
                    await driver.sleep(3000);
                    await driver.quit();
                    return "OK"
                });                
            }
        }
        return "Did not deleted"
    }
    catch(err) {
        console.log(err.stack);
        return err
    }

};

module.exports = {
    beenVerifiedOptOut,
    acxiom_optout
};