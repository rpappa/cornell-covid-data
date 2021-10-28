import puppeteer from 'puppeteer'

import log from './log.js';

// URL for the dashboard
const BASE_URL = 'https://covid.cornell.edu/testing/dashboard/'

// helper functions from tableau.js
const functions = [
    `async function getTestsAdministered() {
        const data = await tableau.VizManager.getVizs()[1] // dunno
            .getWorkbook().getActiveSheet().getWorksheets() // get all worksheets
            .find(s => s.getName() === 'labels (2)') // labels worksheet is the tests administered
            .getSummaryDataAsync(); // summary data is all the public has access to
    
        return data.getData().reduce((obj, [idx, date, tests]) => {
            // accumulate administed tests by date
            obj[date.value] = tests.value;
            return obj;
        }, {})
    }`,
    `async function getPositives() {
        const data = await tableau.VizManager.getVizs()[1].getWorkbook().getActiveSheet().getWorksheets().find(s => s.getName() === 'INSTRUCTIONS & MAIN').getSummaryDataAsync();
        const obj = {};
        console.log(data.getColumns().map(c => c.getFieldName()))
        for(let [date, _, group, val] of data.getData()) {
            if(!obj[date.formattedValue]) {
                obj[date.formattedValue] = {
                    'total': '0', 'Student': '0', 'Staff': '0', 'Faculty': '0'
                }
            }
            obj[date.formattedValue][group.value === '%null%' ? 'total' : group.value] = val.value;
        }
        return obj;
    }`,
    `async function setDate(date) {
        return tableau.VizManager.getVizs()[1].getWorkbook().changeParameterValueAsync('Date slider', date);
    }`
]

// increment this per scraper constructed
let globalId = 0;

export default class Scraper {
    constructor() {
        this.browser = undefined;
        this.page = undefined;
        this.context = undefined;
        this.id = globalId++;
    }

    /**
     * Get scraper ID
     */
    getId() {
        return this.id;
    }

    /**
     * Log `msg` from this scraper instance
     * @param  {...any} msg 
     */
    log(...msg) {
        log(this.getId(), ...msg)
    }

    /**
     * Initialize the scraper, must call this before doing anything else with
     * the scraper
     */
    async init() {
        if(this.browser) {
            throw new Error("Already initialized this scraper")
        }
        this.browser = await puppeteer.launch({
            headless: !process.env.SCRAPE_DEBUG
        });
        this.page = await this.browser.newPage();
        await this.page.goto(BASE_URL);
        await this.page.waitForNetworkIdle()

        this.context = await this.page.mainFrame().executionContext();

        for(let fn of functions) {
            await this.context.evaluate(fn);
        }

        await this.page.waitForNetworkIdle()
    }

    /**
     * Gets positive tests based on the currently set date, going back one week
     * Note that the date format differs from getPositives, example:
     * `October 25, 2021`
     * @returns {Promise<{[date: string]: {
     *  total: string,
     *  Student: string,
     *  Staff: string,
     *  Faculty: string
     * }}>}
     */
    async getPositives() {
        if(!this.browser) {
            throw new Error("This scraper has not been initialized")
        }

        await this.page.waitForNetworkIdle()

        return await this.context.evaluate(`getPositives()`)
    }

    /**
     * Get tests administed based on the currently set date, going back 1 week
     * Note that the date format differs from getPositives, example:
     * `2021-10-15 00:00:00`
     * @returns {Promise<{[date: string]: string}>}
     */
    async getTestsAdministered() {
        if(!this.browser) {
            throw new Error("This scraper has not been initialized")
        }

        await this.page.waitForNetworkIdle()

        return await this.context.evaluate(`getTestsAdministered()`)
    }

    /**
     * Set the date for data (last 7 days from this date)
     * @param {String} date in mm/dd/yyyy format 
     */
    async setDate(date) {
        if(!this.browser) {
            throw new Error("This scraper has not been initialized")
        }

        await this.page.waitForNetworkIdle()

        return await this.context.evaluate(`setDate("${date}")`)
    }

    /**
     * Close the scraper
     */
    async close() {
        if(!this.browser) {
            throw new Error("This scraper has not been initialized")
        }

        await this.browser.close()
    }
}