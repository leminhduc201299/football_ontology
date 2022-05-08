const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');
const fs = require('fs');
const autoScroll = require('../../utils/autoScroll.js');
const sleep = require('../../utils/sleep.js');

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    /**
     * Crawl player data
     */
    await page.goto('https://www.premierleague.com/results', { waitUntil: 'networkidle2' });
    await page.setViewport({
        width: 1200,
        height: 800
    });

    // Click accept cookie button
    await sleep(1000);
    const acceptCookieButton = await page.$('button.js-accept-all-close');
    await acceptCookieButton.click();

    // await autoScroll(page);


    const matchData = await page.evaluate(() => {
        let matchData = [];

        let matchByDays = document.querySelectorAll('section.fixtures div.fixtures__matches-list');
        for (const matchByDay of matchByDays) {
            let matchDay = matchByDay.getAttribute('data-competition-matches-list');

            let matchListByDay = matchByDay.querySelectorAll('ul.matchList li.matchFixtureContainer');
            for (const match of matchListByDay) {
                let homeTeam = match.querySelectorAll('span.teams span.team span.teamName span.shortname')[0]?.innerText;
                let guestTeam = match.querySelectorAll('span.teams span.team span.teamName span.shortname')[1]?.innerText;
                let score = match.querySelector('span.teams span.score')?.innerText;
                let stadium = match.querySelector('span.stadiumName')?.innerText;
                stadium = stadium.trim().split(',')[0];

                matchData.push({
                    matchDay,
                    homeTeam,
                    guestTeam,
                    score,
                    stadium
                })

                console.log('matchData: ********\n', {
                    matchDay,
                    homeTeam,
                    guestTeam,
                    score,
                    stadium
                });
            }
        }

        return matchData;
    });

    // Write to csv file
    const fields = ['matchDay', 'homeTeam', 'guestTeam', 'score', 'stadium'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(matchData);
        fs.writeFileSync('crawl-data/data/match.csv', csv);

        console.log('Crawl successfully');
    } catch (err) {
        console.error(err);
    }

    // await browser.close();
})();
