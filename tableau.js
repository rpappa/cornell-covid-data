// helper functions for interacting with the dashboard

/**
 * Get tests administed based on the currently set date, going back 1 week
 * Note that the date format differs from getPositives, example:
 * `2021-10-15 00:00:00`
 * @returns {Promise<{[date: string]: string}>}
 */
async function getTestsAdministered() {
    const data = await tableau.VizManager.getVizs()[1] // dunno
        .getWorkbook().getActiveSheet().getWorksheets() // get all worksheets
        .find(s => s.getName() === 'labels (2)') // labels worksheet is the tests administered
        .getSummaryDataAsync(); // summary data is all the public has access to

    return data.getData().reduce((obj, [idx, date, tests]) => {
        // accumulate administed tests by date
        obj[date.value] = tests.value;
        return obj;
    }, {})
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
async function getPositives() {
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
}

/**
 * Set the date for data (last 7 days from this date)
 * @param {String} date in mm/dd/yyyy format 
 */
async function setDate(date) {
    return tableau.VizManager.getVizs()[1].getWorkbook().changeParameterValueAsync('Date slider', date);
}