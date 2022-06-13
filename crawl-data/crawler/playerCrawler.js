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
    await page.goto('https://www.premierleague.com/players', { waitUntil: 'networkidle2' });
    await page.setViewport({
        width: 1200,
        height: 800
    });

    // Click accept cookie button
    await sleep(1000);
    const acceptCookieButton = await page.$('button.js-accept-all-close');
    await acceptCookieButton.click();

    // Filter 2021-2022 season
    await sleep(300);
    const filterButton = await page.$('#mainContent > div.playerIndex > div.wrapper > div > section > div.dropDown.active > div.current');
    await filterButton.click();
    await sleep(300);
    const filterItem = await page.$x('//*[@id="mainContent"]/div[2]/div[1]/div/section/div[1]/ul/li[2]');
    await filterItem[0].click();
    await page.waitForNavigation()
    await sleep(500);

    await autoScroll(page);

    const playerLinks = await page.evaluate(() => {
        let playerElements = document.querySelectorAll('tbody.dataContainer tr a');
        playerElements = [...playerElements];
        let playerLinks = playerElements.map(i => i.getAttribute('href'));
        return playerLinks;
    });

    let playerData = [];
    // Crawl data của từng cầu thủ
    for (const playerLink of playerLinks) {
        let playerPage = await browser.newPage();

        await playerPage.goto(`https:${playerLink}`, { waitUntil: 'networkidle2' });
        await playerPage.setViewport({
            width: 1200,
            height: 800
        });

        // Đóng quảng cáo
        await sleep(500);
        const closeAd = await playerPage.$('#advertClose');
        if (closeAd) {
            try {
                await closeAd.click();
                await sleep(300);
            }
            catch {
                
            }
        }

        // Tab overview
        const playerInfoOverview = await playerPage.evaluate(() => {
            let name = document.querySelector('.playerDetails div.name')?.innerText;
            let birthday = document.querySelector('div.personalLists .pdcol2 div.info')?.innerText;
            let height = document.querySelector('div.personalLists .pdcol3 div.info')?.innerText;
            height = height ? parseInt(height.match(/(\d+)/)[0].replace(/,/g, '')) : 0;

            let weight = document.querySelector('div.personalLists .u-hide div.info')?.innerText;
            weight = weight ? parseInt(weight.match(/(\d+)/)[0].replace(/,/g, '')) : 0;

            let team = document.querySelector('div.playerClubHistory tr.table td.team')?.innerText;
            let country = document.querySelector('div.personalLists .pdcol1 .playerCountry')?.innerText;
            let position = document.querySelectorAll('section.playerIntro div.info')[1]?.innerText;

            let playerInfoOverview = {
                name,
                birthday,
                height,
                weight,
                team,
                country,
                position
            }

            return playerInfoOverview;
        });

        try {
            const statsButton = await playerPage.$x('//*[@id="mainContent"]/div[2]/nav/ul/li[2]/a');
            await statsButton[0].click();
            await playerPage.waitForNavigation()
        } catch (error) {
            const statsButton = await playerPage.$x('//*[@id="mainContent"]/div[2]/nav/ul/li[2]/a');
            await statsButton[0].click();
            await playerPage.waitForNavigation()
        }

        // Đóng quảng cáo
        await sleep(500);
        const closeAdStats = await playerPage.$('#advertClose');
        if (closeAdStats) {
            try {
                await closeAdStats.click();
                await sleep(300);
            }
            catch {
                
            }
        }
        // Tab stats
        const playerStats = await playerPage.evaluate(() => {
            let matchNumber = document.querySelector('div.topStatList div.topStat .statappearances')?.innerText;
            matchNumber = matchNumber ? parseInt(matchNumber.replace(/,/g, '')) : 0;

            let winMatchNumber = document.querySelector('div.topStatList div.topStat .statwins')?.innerText;
            winMatchNumber = winMatchNumber ? parseInt(winMatchNumber.replace(/,/g, '')) : 0;

            let lossMatchNumber = document.querySelector('div.topStatList div.topStat .statlosses')?.innerText;
            lossMatchNumber = lossMatchNumber ? parseInt(lossMatchNumber.replace(/,/g, '')) : 0;

            let redCardNumber = document.querySelector('div.statsListBlock div.normalStat .statred_card')?.innerText;
            redCardNumber = redCardNumber ? parseInt(redCardNumber.replace(/,/g, '')) : 0;

            let yellowCardNumber = document.querySelector('div.statsListBlock div.normalStat .statyellow_card')?.innerText;
            yellowCardNumber = yellowCardNumber ? parseInt(yellowCardNumber.replace(/,/g, '')) : 0;

            let foulNumber = document.querySelector('div.statsListBlock div.normalStat .statfouls')?.innerText;
            foulNumber = foulNumber ? parseInt(foulNumber.replace(/,/g, '')) : 0;

            // goal, assist, clean sheet
            let goal = 0, assist = 0, cleanSheetMatch = 0;
            let position = document.querySelectorAll('section.playerIntro div.info')[1]?.innerText;

            switch (position) {
                case 'Forward':
                    goal = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(2) > td')?.innerText;
                    goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

                    assist = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(3) > td')?.innerText;
                    assist = assist ? parseInt(assist.replace(/,/g, '')) : 0;
                    break;

                case 'Midfielder':
                    goal = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(2) > td')?.innerText;
                    goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

                    assist = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(3) > td')?.innerText;
                    assist = assist ? parseInt(assist.replace(/,/g, '')) : 0;
                    break;

                case 'Defender':
                    goal = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(2) > td')?.innerText;
                    goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

                    assist = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(3) > td')?.innerText;
                    assist = assist ? parseInt(assist.replace(/,/g, '')) : 0;

                    cleanSheetMatch = document.querySelector('section.sideWidget.playerSidebarTable > table > tbody > tr:nth-child(4) > td')?.innerText;
                    cleanSheetMatch = cleanSheetMatch ? parseInt(cleanSheetMatch.replace(/,/g, '')) : 0;
                    break;

                case 'Goalkeeper':
                    goal = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > section:nth-child(2) > table > tbody > tr:nth-child(3) > td')?.innerText;
                    goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

                    assist = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > section:nth-child(2) > table > tbody > tr:nth-child(4) > td')?.innerText;
                    assist = assist ? parseInt(assist.replace(/,/g, '')) : 0;

                    cleanSheetMatch = document.querySelector('#mainContent > div.wrapper.hasFixedSidebar > nav > div > section:nth-child(2) > table > tbody > tr:nth-child(2) > td')?.innerText;
                    cleanSheetMatch = cleanSheetMatch ? parseInt(cleanSheetMatch.replace(/,/g, '')) : 0;
                    break;

                default:
                    console.log('Khong tin thay position!');
                    break;
            }

            let playerStats = {
                matchNumber,
                winMatchNumber,
                lossMatchNumber,
                redCardNumber,
                yellowCardNumber,
                foulNumber,
                goal,
                assist,
                cleanSheetMatch
            }

            return playerStats;
        });

        let playerInfo = {
            ...playerInfoOverview,
            ...playerStats
        }
        // console.log('playerInfo: ', playerInfo)

        playerData.push(playerInfo);
        console.log(`playerInfo ${playerData.length}: `, playerInfo)

        await playerPage.close();
    }

    // Write to csv file
    const fields = ['name', 'birthday', 'height', 'weight', 'team', 'country', 'position', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'redCardNumber',
        'yellowCardNumber', 'foulNumber', 'goal', 'assist', 'cleanSheetMatch'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(playerData);
        fs.writeFileSync('crawl-data/data/player.csv', csv);

        console.log('Crawl successfully');
    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();

