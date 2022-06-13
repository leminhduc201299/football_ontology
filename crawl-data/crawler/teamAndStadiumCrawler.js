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
    await page.goto('https://www.premierleague.com/clubs', { waitUntil: 'networkidle2' });
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
    const filterButton = await page.$('#mainContent > div.clubIndex > div > section > div.dropDown.mobile.active > div.current');
    await filterButton.click();
    await sleep(300);
    const filterItem = await page.$x('//*[@id="mainContent"]/div[2]/div/section/div[1]/ul/li[2]');
    await filterItem[0].click();
    await page.waitForNavigation()
    await sleep(1500);

    const clubLinks = await page.evaluate(() => {
        let clubElements = document.querySelectorAll('div.clubIndex div.indexSection ul.dataContainer li a');
        clubElements = [...clubElements];
        let clubLinks = clubElements.map(i => i.getAttribute('href'));
        return clubLinks;
    });

    let clubData = [];
    // Crawl data của từng câu lạc bộ
    for (const clubLink of clubLinks) {
        let clubPage = await browser.newPage();

        await clubPage.goto(`https:${clubLink}`, { waitUntil: 'networkidle2' });
        await sleep(1000);
        await clubPage.setViewport({
            width: 1200,
            height: 800
        });

        // Đóng quảng cáo
        await sleep(1000);
        const closeAd = await clubPage.$('#advertClose');
        if (closeAd) {
            try {
                await closeAd.click();
                await sleep(300);
            }
            catch {
                
            }
        }

        // Tab stats
        try {
            const statsButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[5]/a');
            await statsButton[0].click();
            await clubPage.waitForNavigation()
        } catch (error) {
            const statsButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[5]/a');
            await statsButton[0].click();
            await clubPage.waitForNavigation()
        }
        // Đóng quảng cáo
        await sleep(1000);
        const closeAdStats = await clubPage.$('#advertClose');
        if (closeAdStats) {
            try {
                await closeAdHistory.click();
                await sleep(300);
            }
            catch {
                
            }
        }
        const clubInfo = await clubPage.evaluate(() => {
            let name = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > h1')?.innerText;

            let stadium = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > div.stadiumName > a > span')?.innerText;
            let website = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > div.website > a')?.innerText;

            let matchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(1) > span > span')?.innerText;
            matchNumber = matchNumber ? parseInt(matchNumber.replace(/,/g, '')) : 0;

            let winMatchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(2) > span > span')?.innerText;
            winMatchNumber = winMatchNumber ? parseInt(winMatchNumber.replace(/,/g, '')) : 0;

            let lossMatchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(3) > span > span')?.innerText;
            lossMatchNumber = lossMatchNumber ? parseInt(lossMatchNumber.replace(/,/g, '')) : 0;

            let goalConceded = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(5) > span > span')?.innerText;
            goalConceded = goalConceded ? parseInt(goalConceded.replace(/,/g, '')) : 0;

            let cleanSheetMatch = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(6) > span > span')?.innerText;
            cleanSheetMatch = cleanSheetMatch ? parseInt(cleanSheetMatch.replace(/,/g, '')) : 0;

            let goal = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(4) > span > span')?.innerText;
            goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

            let clubInfo = {
                name,
                stadium,
                website,
                matchNumber,
                winMatchNumber,
                lossMatchNumber,
                goalConceded,
                cleanSheetMatch,
                goal
            }

            return clubInfo;
        });

        // Tab season history
        try {
            const historyButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[8]/a');
            await historyButton[0].click();
            await clubPage.waitForNavigation()
        } catch (error) {
            const historyButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[8]/a');
            await historyButton[0].click();
            await clubPage.waitForNavigation()
        }
        // Đóng quảng cáo
        await sleep(2000);
        const closeAdHistory = await clubPage.$('#advertClose');
        if (closeAdHistory) {
            try {
                await closeAdHistory.click();
                await sleep(300);
            }
            catch {

            }
        }

        const leaguePosition = await clubPage.evaluate(() => {
            let leaguePosition = document.querySelector('#mainContent > div.wrapper.col-12 > section:nth-child(1) > div > div.club-archive__season-stats > div > dl:nth-child(1) > dd')?.innerText;
            leaguePosition = leaguePosition?.match(/\d+/)[0];
            if (leaguePosition) {
                leaguePosition = parseInt(leaguePosition)
            }

            return leaguePosition;
        });

        clubInfo.leaguePosition = leaguePosition;
        console.log('clubInfo: ', clubInfo)
        clubData.push(clubInfo);

        await clubPage.close();
    }

    // Write to csv team file
    const fields = ['name', 'stadium', 'website', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'goalConceded', 'cleanSheetMatch', 'goal', 'leaguePosition'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(clubData);
        fs.writeFileSync('crawl-data/data/club.csv', csv);

        console.log('Crawl team data successfully!');
    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();



// const puppeteer = require('puppeteer');
// const { Parser } = require('json2csv');
// const fs = require('fs');
// const autoScroll = require('../../utils/autoScroll.js');
// const sleep = require('../../utils/sleep.js');

// (async () => {
//     const browser = await puppeteer.launch({
//         headless: false
//     });
//     const page = await browser.newPage();

//     /**
//      * Crawl player data
//      */
//     await page.goto('https://www.premierleague.com/clubs', { waitUntil: 'networkidle2' });
//     await page.setViewport({
//         width: 1200,
//         height: 800
//     });

//     // Click accept cookie button
//     await sleep(1000);
//     const acceptCookieButton = await page.$('button.js-accept-all-close');
//     await acceptCookieButton.click();

//     const clubLinks = await page.evaluate(() => {
//         let clubElements = document.querySelectorAll('div.clubIndex div.indexSection ul.dataContainer li a');
//         clubElements = [...clubElements];
//         let clubLinks = clubElements.map(i => i.getAttribute('href'));
//         return clubLinks;
//     });

//     let clubData = [];
//     let stadiumData = [];
//     // Crawl data của từng cầu thủ
//     for (const clubLink of clubLinks) {
//         let clubPage = await browser.newPage();

//         await clubPage.goto(`https://www.premierleague.com/${clubLink}`, { waitUntil: 'networkidle2' });
//         await sleep(1000);
//         await clubPage.setViewport({
//             width: 1200,
//             height: 800
//         });

//         // Tab stats
//         try {
//             const statsButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[5]/a');
//             await statsButton[0].click();
//             await clubPage.waitForNavigation()
//         } catch (error) {
//             const statsButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[5]/a');
//             await statsButton[0].click();
//             await clubPage.waitForNavigation()
//         }
//         await sleep(1000);
//         const clubInfo = await clubPage.evaluate(() => {
//             let name = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > h1')?.innerText;
            
//             let stadium = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > div.stadiumName > a > span')?.innerText;
//             let website = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > div.website > a')?.innerText;

//             let matchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(1) > span > span')?.innerText;
//             matchNumber = matchNumber ? parseInt(matchNumber.replace(/,/g, '')) : 0;

//             let winMatchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(2) > span > span')?.innerText;
//             winMatchNumber = winMatchNumber ? parseInt(winMatchNumber.replace(/,/g, '')) : 0;

//             let lossMatchNumber = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(3) > span > span')?.innerText;
//             lossMatchNumber = lossMatchNumber ? parseInt(lossMatchNumber.replace(/,/g, '')) : 0;

//             let goalConceded = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(5) > span > span')?.innerText;
//             goalConceded = goalConceded ? parseInt(goalConceded.replace(/,/g, '')) : 0;

//             let cleanSheetMatch = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(6) > span > span')?.innerText;
//             cleanSheetMatch = cleanSheetMatch ? parseInt(cleanSheetMatch.replace(/,/g, '')) : 0;

//             let goal = document.querySelector('#mainContent > div.wrapper.col-12 > div > div > div > div:nth-child(4) > span > span')?.innerText;
//             goal = goal ? parseInt(goal.replace(/,/g, '')) : 0;

//             let clubInfo = {
//                 name,
//                 stadium,
//                 website,
//                 matchNumber,
//                 winMatchNumber,
//                 lossMatchNumber,
//                 goalConceded,
//                 cleanSheetMatch,
//                 goal
//             }

//             return clubInfo;
//         });

//         clubData.push(clubInfo);



//         /**
//          * Tab stadium
//          */
//         try {
//             const stadiumButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[7]/a');
//             await stadiumButton[0].click();
//             await clubPage.waitForNavigation()
//         } catch (error) {
//             const stadiumButton = await clubPage.$x('//*[@id="mainContent"]/nav/ul/li[7]/a');
//             await stadiumButton[0].click();
//             await clubPage.waitForNavigation()
//         }
//         // Click stadium info button
//         await sleep(3000);
//         try {
//             const stadiumInfoButton = await clubPage.$x('//*[@id="mainContent"]/div[3]/div[2]/div/ul/li[2]');
//             await stadiumInfoButton[0].click();
//         } catch (error) {
//             const stadiumInfoButton = await clubPage.$x('//*[@id="mainContent"]/div[3]/div[2]/div/ul/li[2]');
//             await stadiumInfoButton[0].click();
//         }
//         let stadiumName = await clubPage.evaluate(() => {
//             return document.querySelector('#mainContent > div.wrapper.col-12 > div.pageHeader.stadiumHeader > div > h2')?.innerText;
//         });
//         if (!stadiumName) {
//             await sleep(2000);
//         }

//         const stadiumInfo = await clubPage.evaluate(() => {
//             let name = document.querySelector('#mainContent > div.wrapper.col-12 > div.pageHeader.stadiumHeader > div > h2')?.innerText;
//             let team = document.querySelector('#mainContent > header > div.wrapper > div > div > div.clubDetails > h1')?.innerText;

//             let phone = '';
//             let address = '';
//             let pitchSize = '';
//             let capacity = '';
//             let builtYear = '';

//             let infoElements = document.querySelectorAll('div.articleTabContent > div.articleTab.active p');

//             for (const infoElement of infoElements) {
//                 let infoTextFull = infoElement?.innerText;

//                 if (infoTextFull && infoTextFull.indexOf(':') >= 0) {
//                     if (infoTextFull.toLowerCase().indexOf('phone') >= 0) {
//                         phone = infoTextFull ? infoTextFull.substring(infoTextFull.indexOf(":") + 1).trim() : '';
//                     }
//                     else if (infoTextFull.toLowerCase().indexOf('address') >= 0) {
//                         address = infoTextFull ? infoTextFull.substring(infoTextFull.indexOf(":") + 1).trim() : '';
//                     }
//                     else if (infoTextFull.toLowerCase().indexOf('pitch') >= 0) {
//                         pitchSize = infoTextFull ? infoTextFull.substring(infoTextFull.indexOf(":") + 1).trim() : '';
//                     }
//                     else if (infoTextFull.toLowerCase().indexOf('capacity') >= 0) {
//                         capacity = infoTextFull ? infoTextFull.substring(infoTextFull.indexOf(":") + 1).trim() : '';
//                         capacity = capacity ? parseInt(capacity.replace(/,/g, '')) : 0;
//                     }
//                     else if (infoTextFull.toLowerCase().indexOf('built') >= 0 || infoTextFull.toLowerCase().indexOf('opened') >= 0) {
//                         builtYear = infoTextFull ? infoTextFull.substring(infoTextFull.indexOf(":") + 1).trim() : '';
//                         builtYear = builtYear ? parseInt(builtYear) : 0;
//                     }
//                 }
//             }

//             let stadiumInfo = {
//                 name,
//                 phone,
//                 address,
//                 pitchSize,
//                 capacity,
//                 builtYear,
//                 team
//             }

//             return stadiumInfo;
//         });

//         stadiumData.push(stadiumInfo);
//         console.log('clubInfo - stadiumInfo:********************\n', stadiumInfo);

//         await clubPage.close();
//     }

//     // Write to csv team file
//     const fields = ['name', 'stadium', 'website', 'matchNumber', 'winMatchNumber', 'lossMatchNumber', 'goalConceded', 'cleanSheetMatch', 'goal'];
//     const opts = { fields };
//     try {
//         const parser = new Parser(opts);
//         const csv = parser.parse(clubData);
//         fs.writeFileSync('crawl-data/data/club.csv', csv);

//         console.log('Crawl team data successfully!');
//     } catch (err) {
//         console.error(err);
//     }

//     // Write to csv stadium file
//     const otherFields = ['name', 'phone', 'address', 'pitchSize', 'capacity', 'builtYear', 'team'];
//     const otherOpts = { otherFields };
//     try {
//         const otherParser = new Parser(otherOpts);
//         const otherCsv = otherParser.parse(stadiumData);
//         fs.writeFileSync('crawl-data/data/stadium.csv', otherCsv);

//         console.log('Crawl stadium data successfully!');
//     } catch (err) {
//         console.error(err);
//     }

//     await browser.close();
// })();
