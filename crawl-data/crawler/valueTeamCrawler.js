const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');
const fs = require('fs');
const autoScroll = require('../../utils/autoScroll.js');
const sleep = require('../../utils/sleep.js');
const csv = require('csvtojson');

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    /**
     * Crawl value Team
     */
    
    try {
        await page.goto('https://www.footballtransfers.com/en', { waitUntil: 'networkidle2' });
        await page.setViewport({
            width: 1200,
            height: 800
        });
    } catch (error) {
        await sleep(1500);
        await page.setViewport({
            width: 1200,
            height: 800
        });
    }

    let teamList = await csv().fromFile('crawl-data/data/club.csv');

    for (const key in teamList) {
        let teamName = teamList[key].name;

        // Tìm khung search, gõ team name và bấm enter
        const searchBox = await page.$('#header-part > div.header-bar > div > div > div.menu > div > input[type=text]');
        await searchBox.type(teamName);
        await searchBox.press('Enter');

        // Chờ trang load xong, nhấn vào kết quả tìm kiếm đầu tiên
        try {
            await page.waitForNavigation();
        } catch (error) {
            await page.waitForNavigation();
        }
        const firstItem = await page.$('#search-results > div.playerList-panel > a:nth-child(1)');
        await firstItem.click();

        // Chờ trang load xong, crawl data
        try {
            await page.waitForNavigation();
        } catch (error) {
            await page.waitForNavigation();
        }
        await sleep(200);
        let marketValue = await page.evaluate(() => {
            let marketValue = document.querySelector('div.player-value.player-value-large.d-flex.align-items-center.lg-display > span.player-tag')?.innerText;

            if (marketValue) {
                marketValue = marketValue.match(/\d+/)[0] * 1000000;
            }

            return marketValue;
        });

        console.log(`${teamName}: `, marketValue)

        teamList[key].marketValue = marketValue;
    }

    await page.close();

    // Write to csv file
    const fields = ['name', 'stadium', 'website', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'goalConceded', 'cleanSheetMatch', 'goal', 'leaguePosition', 'marketValue'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(teamList);
        fs.writeFileSync('crawl-data/data/club.csv', csv);

        console.log('Crawl team data successfully!');
    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();