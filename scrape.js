// the primary scraping script

import fs from 'fs';

import moment from 'moment';
import csvWriter from 'csv-writer'

import Scraper from './Scraper.js';
import log from './log.js'

const createObjectCsvWriter = csvWriter.createObjectCsvWriter;

// adjust these if needed
const END_DATE = moment(new Date('10/25/2021')).add(7, 'days');
const MIN_DATE = moment(new Date('9/1/2020'));

function doLog(...msg) {
    return log(`SCRAPE`, msg)
}

/**
 * Scrape all the data from the dashboard
 */
async function doScraping() {
    const data = [];
    
    const s = new Scraper();

    await s.init()

    const dates = [];
    let date = END_DATE;

    // compute dates we'll be setting the date slider to
    while(date.subtract(7, 'days') > MIN_DATE) {
        dates.push(date.format('M/D/YYYY'))
    }

    doLog(dates)

    for(let date of dates) {
        // set the date on the dashboard
        await s.setDate(date);

        // grab positives and tests administered
        const positives = await s.getPositives();
        doLog(positives)

        const testsAdmin = await s.getTestsAdministered();
        doLog(testsAdmin);

        // find this period by date
        const period = {}
        for(let d in positives) {
            const date = new Date(d);
            const key = moment(date).format('M/D/YYYY');
            period[key] = {
                date: key,
                ts: +date
            };

            // loop through positives by type and store them
            for(let k in positives[d]) {
                period[key][`${k.toLowerCase()}_positives`] = parseInt(positives[d][k])
            }
        }

        for(let d in testsAdmin) {
            const key = moment(new Date(d)).format('M/D/YYYY');
            // grab tests administered
            period[key].tests_administered = parseInt(testsAdmin[d]);
        }

        doLog(period)
        for(let key in period) {
            // breaks out each day into the data array
            data.push(period[key])
        }
    }

    await s.close()

    return data;
}

const ROLLING_PERIOD = 7;

/**
 * Process all the data including cumulative sum and rolling averages
 * @param {Object} data 
 */
function processData(data) {
    data.sort((a, b) => a.ts - b.ts);

    // the keys we will compute cumulative sum and rolling average for
    let accumulateKeys = [
        'total_positives',
        'student_positives',
        'staff_positives',
        'faculty_positives',
        'tests_administered'
    ];

    let rollingSums = accumulateKeys.map(k => 0);
    let rollingValues = accumulateKeys.map(k => []);

    let cumulativeSums = accumulateKeys.map(k => 0);

    let count = 0;

    for(let d of data) {
        count++;

        for(let i = 0; i < accumulateKeys.length; i++) {
            const key = accumulateKeys[i];
            const datum = d[key] || 0;

            rollingSums[i] += datum;
            rollingValues[i].push(datum); // for eventual decrement

            cumulativeSums[i] += datum;

            d[`cumulative_${key}`] = cumulativeSums[i];

            if(count >= ROLLING_PERIOD) {
                // can now start computing a rolling average
                d[`${key}_rolling_avg`] = rollingSums[i] / ROLLING_PERIOD;

                // decrement outside of the rolling window
                rollingSums[i] -= rollingValues[i].shift();
            }
        }
    }

    return data;
}


/**
 * Output data to a CSV
 * @param {Object} data 
 */
function outputData(data) {
    // choose the last datum since it will (should) include rolling average
    const last = data[data.length - 1];

    const keys = Object.keys(last);

    // header is the first row of the csv
    // take it verbatim from the keys in the last datum
    const header = keys.map(k => ({
        id: k,
        title: k
    }));

    // create output directory if it doesn't exist
    if(!fs.existsSync('./output')) {
        fs.mkdirSync('./output');
    }

    // write to csv
    const csvWriter = createObjectCsvWriter({
        path: `./output/output-${Date.now()}-${moment().format('MM-DD-YYYY')}.csv`,
        header
    })

    return csvWriter.writeRecords(data);
}

// pipeline
doScraping().then(processData).then(outputData);