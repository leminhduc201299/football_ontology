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
        await sleep(1200);
        await page.setViewport({
            width: 1200,
            height: 800
        });
    }

    let playerList = await csv().fromFile('crawl-data/data/player.csv');

    for (const key in playerList) {
        let playerName = playerList[key].name;

        // Tìm khung search, gõ team name và bấm enter
        const searchBox = await page.$('#header-part > div.header-bar > div > div > div.menu > div > input[type=text]');
        await searchBox.type(playerName);
        await searchBox.press('Enter');

        // Chờ trang load xong, nhấn vào kết quả tìm kiếm đầu tiên
        try {
            await page.waitForNavigation();
        } catch (error) {
            await sleep(500);
        }
        await sleep(1400);
        const firstItem = await page.$('#search-results > div.playerList-panel > a:nth-child(1)');

        if (firstItem) {
            await firstItem.click();

            // Chờ trang load xong, crawl data
            try {
                await page.waitForNavigation();
            } catch (error) {
                await sleep(500);
            }
            await sleep(200);
            let playerValue = await page.evaluate(() => {
                let playerValue = document.querySelector('div.player-value.player-value-large.d-flex.align-items-center.lg-display > span.player-tag')?.innerText;

                if (playerValue) {
                    playerValue = parseFloat(playerValue.match(/[+-]?\d+(\.\d+)?/g)[0]) * 1000000;
                }

                return playerValue;
            });

            console.log(`${playerName}: `, playerValue)

            playerList[key].worth = playerValue;
        }
        else
        {
            playerList[key].worth = 0;
        }
    }

    await page.close();

    // Write to csv file
    const fields = ['name', 'birthday', 'height', 'weight', 'team', 'country', 'position', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'redCardNumber',
        'yellowCardNumber', 'foulNumber', 'goal', 'assist', 'cleanSheetMatch', 'worth'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(playerList);
        fs.writeFileSync('crawl-data/data/player.csv', csv);

        console.log('Crawl team data successfully!');
    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();