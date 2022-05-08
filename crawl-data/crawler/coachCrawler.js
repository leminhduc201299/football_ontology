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
     * Crawl coach data
     */
    await page.goto('https://www.premierleague.com/managers', { waitUntil: 'networkidle2' });
    await page.setViewport({
        width: 1200,
        height: 800
    });

    // Click accept cookie button
    await sleep(1000);
    const acceptCookieButton = await page.$('button.js-accept-all-close');
    await acceptCookieButton.click();

    await autoScroll(page);

    const coachLinks = await page.evaluate(() => {
        let coachElements = document.querySelectorAll('tbody.dataContainer tr td:nth-child(1) a');
        coachElements = [...coachElements];
        let coachLinks = coachElements.map(i => i.getAttribute('href'));
        return coachLinks;
    });

    let coachData = [];
    // Crawl data của từng cầu thủ
    for (const coachLink of coachLinks) {
        let coachPage = await browser.newPage();

        await coachPage.goto(`https:${coachLink}`, { waitUntil: 'networkidle2' });
        await coachPage.setViewport({
            width: 1200,
            height: 800
        });

        // Tab overview
        const coachInfo = await coachPage.evaluate(() => {
            let name = document.querySelector('.playerDetails .name')?.innerText;
            name = name ? name.replace(/\n/g, " ") : '';
            let country = document.querySelector('div.personalLists .pdcol1 .playerCountry')?.innerText;

            let status = document.querySelectorAll('div.personalLists .pdcol1 div.info')[1]?.innerText;
            let birthday = '';
            let dateJoinClub = '';
            let countSeason = '';
            let matchNumber = '';
            let winMatchNumber = '';
            let lossMatchNumber = '';
            let team = '';
            if (status === 'Active') {
                birthday = document.querySelectorAll('div.personalLists .pdcol2 div.info')[1]?.innerText;
                dateJoinClub = document.querySelectorAll('div.personalLists .pdcol1 div.info')[2]?.innerText;

                countSeason = document.querySelectorAll('div.personalLists .pdcol2 div.info')[2]?.innerText;
                countSeason = countSeason ? parseInt(countSeason.replace(/,/g, '')) : 0;

                matchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section:nth-child(2) > table > tbody > tr:nth-child(1) > td')?.innerText;
                matchNumber = matchNumber ? parseInt(matchNumber.replace(/,/g, '')) : 0;

                winMatchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section:nth-child(2) > table > tbody > tr:nth-child(2) > td')?.innerText;
                winMatchNumber = winMatchNumber ? parseInt(winMatchNumber.replace(/,/g, '')) : 0;

                lossMatchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section:nth-child(2) > table > tbody > tr:nth-child(4) > td')?.innerText;
                lossMatchNumber = lossMatchNumber ? parseInt(lossMatchNumber.replace(/,/g, '')) : 0;

                team = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section.sideWidget.playerIntro > div.info > a')?.innerText;
            }
            else if (status === 'Inactive') {
                birthday = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > div > div > div > section > div > ul.pdcol2 > li:nth-child(1) > div.info')?.innerText;

                countSeason = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > div > div > div > section > div > ul.pdcol2 > li:nth-child(2) > div.info')?.innerText;
                countSeason = countSeason ? parseInt(countSeason.replace(/,/g, '')) : 0;

                matchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section > table > tbody > tr:nth-child(1) > td')?.innerText;
                matchNumber = matchNumber ? parseInt(matchNumber.replace(/,/g, '')) : 0;

                winMatchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section > table > tbody > tr:nth-child(2) > td')?.innerText;
                winMatchNumber = winMatchNumber ? parseInt(winMatchNumber.replace(/,/g, '')) : 0;

                lossMatchNumber = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > div > section > table > tbody > tr:nth-child(4) > td')?.innerText;
                lossMatchNumber = lossMatchNumber ? parseInt(lossMatchNumber.replace(/,/g, '')) : 0;
            }            

            let coachInfo = {
                name,
                birthday,
                dateJoinClub,
                countSeason,
                matchNumber,
                winMatchNumber,
                lossMatchNumber,
                country,
                team
            }

            return coachInfo;
        });

        
        coachData.push(coachInfo);
        console.log('length: ', coachData.length)

        await coachPage.close();
    }

    // Write to csv file
    const fields = ['name', 'birthday', 'dateJoinClub', 'countSeason', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'country', 'team'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(coachData);
        fs.writeFileSync('crawl-data/data/coach.csv', csv);

        console.log('Crawl successfully');
    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();
