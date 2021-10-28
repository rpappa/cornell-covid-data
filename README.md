# cornell-covid-data

This project scrapes and processes historical data from https://covid.cornell.edu/testing/dashboard/

## Methods

This is driven by [puppeteer](https://github.com/puppeteer/puppeteer). Ideally it would be request 
based to reduce resoruce requirements, but reverse engineering Tableau's API proved to be difficult.

Instead, it uses Javascript executed on the dashboard page to interact with and pull data from the
dashboard. The helper functions used are provied in `tableau.js` and reproduced in `Scraper.js`

## Usage

1. This requires [node](https://nodejs.org/en/) if you don't already have it
2. Install dependencies with
```
npm install
```
3. Run with
```
node scrape.js
```
4. It will take a few minutes to scrape all the data, once it is done it will output a CSV to `./output`, creating the folder if it doesn't exist.