// ==UserScript==
// @id           autodarts-plus@https://github.com/sebudde/autodarts-plus
// @name         Autodarts Plus (caller & other stuff)
// @namespace    https://github.com/sebudde/autodarts-plus
// @version      0.5.5
// @description  Userscript for Autodarts
// @author       sebudde
// @match        https://play.autodarts.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autodarts.io
// @license      MIT
// @downloadURL  https://github.com/sebudde/autodarts-plus/raw/main/autodarts-plus.user.js
// @updateURL    https://github.com/sebudde/autodarts-plus/raw/main/autodarts-plus.user.js
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(async function() {
    'use strict';

    //////////////// CONFIG END ////////////////////

    const readyClasses = {
        play: 'css-1lua7td',
        lobbies: 'css-1q0rlnk',
        table: 'css-p3eaf1', // matches & boards
        match: 'css-ul22ge',
        matchHistory: 'css-10z204m'
    };

    let firstLoad = true;

    let configPathName = '/config';
    const pageContainer = document.createElement('div');

    const observeDOM = (function() {
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        return function(obj, callback) {
            if (!obj || obj.nodeType !== 1) return;
            const mutationObserver = new MutationObserver(callback);
            mutationObserver.observe(obj, {
                attributes: true,
                childList: true,
                subtree: true
            });
            return mutationObserver;
        };
    })();

    //////////////// CSS classes start ////////////////////
    const adp_style = document.createElement('style');
    adp_style.type = 'text/css';
    adp_style.innerHTML = `
        .adp_points-small { font-size: 3em!important; }
        .adp_config-header {
              font-weight: 700;
              align-self: flex-start;
        }
        h2.adp_config-header { font-size: 1.5em; }
        h3.adp_config-header { font-size: 1.2em; }
        button.adp_config-btn {
            border-radius: var(--chakra-radii-md);
            background: var(--chakra-colors-whiteAlpha-200);
            font-weight: var(--chakra-fontWeights-semibold);
            height: var(--chakra-sizes-8);
            min-width: var(--chakra-sizes-16);
            padding: 0 var(--chakra-space-4);
            font-size: var(--chakra-fontSizes-md);
        }
        button.adp_config-btn:active:not(:disabled), button.adp_config-btn.active:not(:disabled) {
            background: var(--chakra-colors-whiteAlpha-400);
        }
        button.adp_config-btn:disabled {
            cursor: default;
            opacity: 0.5;
            // background: var(--chakra-colors-whiteAlpha-50);
            // color:
        }
        .adp_config-btn--label {
            width: 350px;
        }
        .adp_cricket-rownumber {
            font-size: var(--chakra-fontSizes-xl);
            position: absolute;
            left: calc(var(--chakra-space-2)* -1);
            text-align: center;
            width: var(--chakra-sizes-10);
            border-radius: 3px;
            color: var(--chakra-colors-white);
            border: white;
            opacity: 1;
            background: var(--chakra-colors-gray-500);
        }
    `;
    document.getElementsByTagName('head')[0].appendChild(adp_style);

    let callerData = {};
    let winnerSoundData = {};
    let inactiveSmall;
    let showTotalDartsAtLegFinish;
    let showTotalDartsAtLegFinishLarge;

    let headerEl;
    let mainContainerEl;

    const setActiveAttr = (el, isActive) => {
        if (isActive) {
            el.setAttribute('data-active', '');
            el.classList.add('active');
        } else {
            el.removeAttribute('data-active');
            el.classList.remove('active');
        }
    };

    ////////////////   ////////////////////

    const setAdpData = async (name, value) => {

        const data = name.split('-');

        if (data[0].startsWith('caller')) {
            const gmCallerData = await GM.getValue('callerData') || {};
            const gmCallerValue = gmCallerData[data[0]] || {};
            const newCallerValue = {[data[1]]: value};
            callerData = {
                ...gmCallerData,
                [data[0]]: {...gmCallerValue, ...newCallerValue}
            };
            await GM.setValue('callerData', callerData);

        } else if (data[0].startsWith('winnerSound')) {
            const gmWinnerSoundData = await GM.getValue('winnerSoundData') || {};
            const gmWinnerSoundValue = gmWinnerSoundData[data[0]] || {};
            const newWinnerSoundValue = {[data[1]]: value};
            winnerSoundData = {
                ...gmWinnerSoundData,
                [data[0]]: {...gmWinnerSoundValue, ...newWinnerSoundValue}
            };
        }
        await GM.setValue('winnerSoundData', winnerSoundData);
    };

    const callerObj = {
        caller1: {
            folder: '0',
            name: 'Caller OFF'
        },
        caller2: {
            folder: '1_male_eng',
            name: 'Male eng',
            server: 'https://autodarts.x10.mx',
            fileExt: '.mp3'
        },
        caller3: {
            folder: 'google_eng',
            name: 'Google eng'
        },
        caller4: {
            folder: 'google_de',
            name: 'Google de'
        }
    };

    const getPlayerCount = () => {
        return document.querySelectorAll('.css-3dp02s').length;
    };

    const onDOMready = async () => {
        console.log('firstLoad', firstLoad);
        headerEl = document.querySelector('.css-gmuwbf');
        mainContainerEl = document.querySelectorAll('#root > div')[1];

        let hideHeaderGM = await GM.getValue('hideHeader');
        if (hideHeaderGM) {
            headerEl.style.display = 'none';
            mainContainerEl.style.height = '100vh';
        }

        if (firstLoad) {
            firstLoad = false;

            const hideHeaderBtn = document.createElement('button');
            hideHeaderBtn.id = 'hideHeader';
            hideHeaderBtn.innerText = 'Header';
            hideHeaderBtn.classList.add('adp_config-btn');
            hideHeaderBtn.style.position = 'fixed';
            hideHeaderBtn.style.bottom = '20px';
            hideHeaderBtn.style.right = '20px';

            setActiveAttr(hideHeaderBtn, !hideHeaderGM);

            hideHeaderBtn.addEventListener('click', async (event) => {
                const isActive = event.target.classList.contains('active');
                setActiveAttr(hideHeaderBtn, !isActive);
                headerEl.style.display = isActive ? 'none' : 'flex';
                mainContainerEl.style.height = isActive ? '100vh' : 'calc(100vh - 72px)';

                await GM.setValue('hideHeader', isActive);
            }, false);

            document.getElementById('root').appendChild(hideHeaderBtn);

            //////////////// winner sound data  ////////////////////

            winnerSoundData = await GM.getValue('winnerSoundData') || {};

            //////////////// caller data  ////////////////////

            const gmCallerData = await GM.getValue('callerData') || {};

            callerData = {
                ...gmCallerData, ...callerObj
            };

            await GM.setValue('callerData', callerData);

            const callerObjLength = Object.keys(callerObj).length;

            //////////////// add config page  ////////////////////

            inactiveSmall = (await GM.getValue('inactiveSmall')) ?? true;
            showTotalDartsAtLegFinish = (await GM.getValue('showTotalDartsAtLegFinish')) ?? true;
            showTotalDartsAtLegFinishLarge = (await GM.getValue('showTotalDartsAtLegFinishLarge')) ?? false;

            pageContainer.classList.add('css-gmuwbf');
            const configContainer = document.createElement('div');
            configContainer.classList.add('css-10z204m');
            pageContainer.appendChild(configContainer);
            pageContainer.style.display = 'none';

            const configHeader = document.createElement('h2');
            configHeader.classList.add('adp_config-header');
            configHeader.innerText = 'Config';
            configContainer.appendChild(configHeader);

            const configContentHeader = document.createElement('h3');
            configContentHeader.classList.add('adp_config-header');
            configContentHeader.innerText = 'Match';
            configContainer.appendChild(configContentHeader);

            const configContentRow1 = document.createElement('div');
            configContentRow1.classList.add('css-1p4eqnd');
            configContentRow1.style.gap = '2rem';

            configContentRow1.innerHTML = `
            <div class="adp_config-btn--label">Show points of inactive player</div>
            <button id="inactiveSmall" class="css-1xbmrf2 adp_config-btn${inactiveSmall ? ' active' : ''}">${inactiveSmall ? 'ON' : 'OFF'}</button>
            `;

            configContentRow1.querySelector('button#inactiveSmall').addEventListener('click', async (event) => {
                const isInactiveSmall = event.target.classList.contains('active');
                event.target.classList.toggle('active');
                inactiveSmall = !isInactiveSmall;
                await GM.setValue('inactiveSmall', !isInactiveSmall);
                event.target.innerText = !isInactiveSmall ? 'ON' : 'OFF';
            }, false);

            const configContentRow2 = document.createElement('div');
            configContentRow2.classList.add('css-1p4eqnd');
            configContentRow2.style.gap = '2rem';

            configContentRow2.innerHTML = `
            <div class="adp_config-btn--label">Show total darts thrown at end of leg</div>
            <button id="showTotalDartsAtLegFinish" class="css-1xbmrf2 adp_config-btn${showTotalDartsAtLegFinish ? ' active' : ''}">${showTotalDartsAtLegFinish ? 'ON' : 'OFF'}</button>
            <button id="showTotalDartsAtLegFinishLarge" ${showTotalDartsAtLegFinish ? '' : 'disabled'} class="css-1xbmrf2 adp_config-btn${showTotalDartsAtLegFinishLarge
                ? ' active'
                : ''}">${showTotalDartsAtLegFinishLarge ? 'LARGE' : 'SMALL'}</button>
            `;

            configContentRow2.querySelector('button#showTotalDartsAtLegFinish').addEventListener('click', async (event) => {
                const isShowTotalDartsAtLegFinish = event.target.classList.contains('active');
                event.target.classList.toggle('active');
                showTotalDartsAtLegFinish = !isShowTotalDartsAtLegFinish;
                await GM.setValue('showTotalDartsAtLegFinish', !isShowTotalDartsAtLegFinish);
                event.target.innerText = !isShowTotalDartsAtLegFinish ? 'ON' : 'OFF';
                configContentRow2.querySelector('button#showTotalDartsAtLegFinishLarge').toggleAttribute('disabled', isShowTotalDartsAtLegFinish);
            }, false);

            configContentRow2.querySelector('button#showTotalDartsAtLegFinishLarge').addEventListener('click', async (event) => {
                const isShowTotalDartsAtLegFinishLarge = event.target.classList.contains('active');
                event.target.classList.toggle('active');
                showTotalDartsAtLegFinishLarge = !isShowTotalDartsAtLegFinishLarge;
                await GM.setValue('showTotalDartsAtLegFinishLarge', !isShowTotalDartsAtLegFinishLarge);
                event.target.innerText = !isShowTotalDartsAtLegFinishLarge ? 'LARGE' : 'SMALL';
            }, false);

            configContainer.appendChild(configContentRow1);
            configContainer.appendChild(configContentRow2);

            const callerHeader = document.createElement('h3');
            callerHeader.classList.add('adp_config-header');
            callerHeader.innerText = 'Caller';
            configContainer.appendChild(callerHeader);

            for (let callerCount = callerObjLength + 1; callerCount <= callerObjLength + 5; callerCount++) {
                const callerContainer = document.createElement('div');
                callerContainer.classList.add('css-1p4eqnd');
                callerContainer.style.gap = '30px';
                const callerServer = callerData[`caller${callerCount}`]?.server || '';
                const callerName = callerData[`caller${callerCount}`]?.name || '';
                const callerFolder = callerData[`caller${callerCount}`]?.folder || '';
                const callerFileExt = callerData[`caller${callerCount}`]?.fileExt || '';

                callerContainer.innerHTML = `
                        <div class="css-1igwmid" style="margin-right: 2em">
                            <b>Caller ${callerCount - callerObjLength}</b>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy" style="width: 240px"><div class="css-1igwmid"><input placeholder="Server" class="adp_caller--server css-1ndqqtl" name="caller${callerCount}-server" value="${callerServer}"></div></div>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy"><div class="css-1igwmid"><input placeholder="Name" class="adp_caller--name css-1ndqqtl" name="caller${callerCount}-name" value="${callerName}"></div></div>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy" style="width: 180px"><div class="css-1igwmid"><input placeholder="Folder"  class="adp_caller--folder css-1ndqqtl" name="caller${callerCount}-folder" value="${callerFolder}"></div></div>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy" style="width: 100px"><div class="css-1igwmid"><input placeholder="File ext"  class="adp_caller--folder css-1ndqqtl" name="caller${callerCount}-fileExt" value="${callerFileExt}"></div></div>
                        </div>`;
                configContainer.appendChild(callerContainer);
            }

            const winnerSoundHeader = document.createElement('h3');
            winnerSoundHeader.classList.add('adp_config-header');
            winnerSoundHeader.innerText = 'Winner sound';
            configContainer.appendChild(winnerSoundHeader);

            for (let winnerSoundCount = 1; winnerSoundCount <= 2; winnerSoundCount++) {
                const winnerSoundContainer = document.createElement('div');
                winnerSoundContainer.classList.add('css-1p4eqnd');
                winnerSoundContainer.style.gap = '30px';
                const winnerSoundPlayername = winnerSoundData[`winnerSound${winnerSoundCount}`]?.playername || '';
                const winnerSoundSoundUrl = winnerSoundData[`winnerSound${winnerSoundCount}`]?.soundurl || '';

                winnerSoundContainer.innerHTML = `
                        <div class="css-1igwmid" style="margin-right: 2em">
                            <b>Player ${winnerSoundCount}</b>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy" style="width: 240px"><div class="css-1igwmid"><input placeholder="Player name" class="adp_winnerSound--playername css-1ndqqtl" name="winnerSound${winnerSoundCount}-playername" value="${winnerSoundPlayername}"></div></div>
                        </div>
                        <div class="css-1igwmid">
                            <div class="css-u4ybgy" style="width: 500px"><div class="css-1igwmid"><input placeholder="Sound URL" class="adp_winnerSound--soundurl css-1ndqqtl" name="winnerSound${winnerSoundCount}-soundurl" value="${winnerSoundSoundUrl}"></div></div>
                        </div>`;
                configContainer.appendChild(winnerSoundContainer);
            }

            const input = configContainer.querySelectorAll('input');
            [...input].forEach((el) => (el.addEventListener('blur', (e) => {
                setAdpData(e.target.name, e.target.value);
            })));

            document.getElementById('root').appendChild(pageContainer);

            //////////////// add menu  ////////////////////
            const menuBtn = document.createElement('a');
            menuBtn.classList.add('css-1nlwyv4');
            menuBtn.classList.add('adp_menu-btn');
            menuBtn.innerText = 'Config';
            menuBtn.style.cursor = 'pointer';
            const menuContainer = document.querySelector('.css-1igwmid');
            menuContainer.appendChild(menuBtn);

            [...document.querySelectorAll('.css-1nlwyv4')].forEach((el) => (el.addEventListener('click', async (event) => {
                document.querySelector('#root > div:nth-of-type(2)').style.display = 'flex';
                pageContainer.style.display = 'none';
                if (event.target.classList.contains('adp_menu-btn')) {
                    // switch to page "Matches History" because we need its CSS
                    menuContainer.querySelector('a:nth-of-type(4)').click();
                    window.history.pushState(null, '', configPathName);
                }

            }, false)));

        }

        console.log('DOM ready');
    };

    const showConfig = () => {
        console.log('showConfig');
    };

    ////////////////  end ////////////////////

    const handleConfigPage = () => {
        console.log('config ready');
        document.querySelector('#root > div:nth-of-type(2)').style.display = 'none';
        pageContainer.style.display = 'flex';
    };

    const handlePlay = () => {
        console.log('play ready');
    };

    const handleMatchHistory = () => {
        console.log('matchHistory ready');
        if (location.pathname === configPathName) {
            handleConfigPage();
        }
    };

    const handleMatches = () => {
        console.log('matches ready');
    };

    const handleMatch = async () => {
        console.log('match ready!');

        const isiOS = [
                'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) || // iPad on iOS 13 detection
            (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

        const isSmallDisplay = window.innerHeight < 900;

        let playerCount = getPlayerCount();

        // iOS fix
        // https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari
        const soundEffect1 = new Audio();
        soundEffect1.autoplay = true;
        const soundEffect2 = new Audio();
        soundEffect2.autoplay = true;

        const matchMenuRow = document.createElement('div');
        matchMenuRow.classList.add('css-k008qs');
        matchMenuRow.style.marginTop = 'calc(var(--chakra-space-2) * -1 - 4px)';

        const matchMenuContainer = document.createElement('div');
        matchMenuContainer.classList.add('css-a6m3v9');

        matchMenuRow.appendChild(matchMenuContainer);

        document.querySelector('.css-k008qs').after(matchMenuRow);

        // PR font-size larger
        [...document.querySelectorAll('.css-1n5vwgq .css-qqfgvy')].forEach((el) => (el.style.fontSize = 'var(--chakra-fontSizes-xl)'));

        //
        [...document.querySelectorAll('.css-1memit')].forEach((el) => {
            el.style.margin = '0';
            el.style.padding = '0.5rem 0';
            el.style.height = '100%';
            el.style.justifyContent = 'space-between';
        });
        [...document.querySelectorAll('.css-3dp02s .css-x3m75h')].forEach((el) => (el.style.lineHeight = '9rem'));

        const matchVariant = document.querySelector('.css-1xbroe7').innerText.split(' ')[0];
        // console.log('matchVariant', matchVariant);
        const matchVariantArr = ['X01', 'Cricket'];
        if (!matchVariantArr.includes(matchVariant)) return;

        let cricketClosedPoints = [];

        const setCricketClosedPoints = () => {
            const cricketPointTable = document.querySelector('.css-1gy113g').children[2];

            if (!cricketPointTable?.children) return;
            cricketClosedPoints = [];

            [...cricketPointTable.children].forEach((el, i) => {
                if (i % playerCount === 0) {
                    const rowCount = (i / playerCount) + 1;
                    const rowPoints = (rowCount === 7 ? 25 : 21 - rowCount).toString(); // Bulls fix
                    if (el.querySelector('.css-cogxfh')) {
                        cricketClosedPoints.push(rowPoints);
                    }

                    if (!el.children.length) {
                        const numberHolder = document.createElement('p');
                        numberHolder.classList.add('adp_cricket-rownumber');
                        numberHolder.innerText = (rowCount === 7 ? 'Bull' : 21 - rowCount);
                        el.appendChild(numberHolder);
                    }
                }
            });
        };

        if (matchVariant === 'Cricket') {
            document.querySelector('.css-1gy113g').style.minHeight = 0;
            if (isSmallDisplay) {
                const cricketPointContainer = document.querySelector('.css-1gy113g .css-99py2g');
                cricketPointContainer.style.minHeight = '195px';

                [...cricketPointContainer.querySelectorAll('.css-x3m75h')].forEach((el) => (el.style.lineHeight = '80pt'));
                [...cricketPointContainer.querySelectorAll('.css-x3m75h')].forEach((el) => (el.style.fontSize = '80pt'));
                [...cricketPointContainer.querySelectorAll('.css-1mxmf5a, .css-g6rh15')].forEach((el) => (el.style.fontSize = '1.25rem'));
            }

            setCricketClosedPoints();

            const buttons = [...document.querySelectorAll('button.css-1x1xjw8')];
            buttons.forEach((button) => {
                if (button.innerText === 'Undo') {
                    button.addEventListener('click', async (event) => {
                        setCricketClosedPoints();
                    }, false);
                }
            });
        }

        const counterContainer = document.querySelector('.css-oyptjf');

        let callerActive = (await GM.getValue('callerActive')) || '0';
        let triplesound = (await GM.getValue('triplesound')) || '0';
        let boosound = (await GM.getValue('boosound')) || false;
        let nextLegAfterSec = (await GM.getValue('nextLegAfterSec')) || 'OFF';

        const onSelectChange = (event) => {
            (async () => {
                eval(event.target.id + ' = event.target.value');
                await GM.setValue(event.target.id, event.target.value);
            })();
        };

        const tripleSoundArr = [
            {
                value: '0',
                name: 'Triple OFF'
            }, {
                value: '1',
                name: 'Beep'
            }, {
                value: '2',
                name: 'Löwen'
            }];

        const nextLegSecArr = [
            {
                value: 'OFF'
            }, {
                value: '0'
            }, {
                value: '5'
            }, {
                value: '10'
            }, {
                value: '20'
            }];

        const callerSelect = document.createElement('select');
        callerSelect.id = 'callerActive';
        callerSelect.classList.add('css-1xbroe7');
        callerSelect.style.padding = '0 5px';
        callerSelect.onchange = onSelectChange;

        matchMenuContainer.appendChild(callerSelect);

        for (const [caller, data] of Object.entries(callerData)) {
            if (!data.folder) continue;
            const optionEl = document.createElement('option');
            optionEl.value = caller;
            optionEl.text = data.name || data.folder;
            optionEl.style.backgroundColor = '#353d47';
            if (callerActive === caller) optionEl.setAttribute('selected', 'selected');
            callerSelect.appendChild(optionEl);
        }

        const tripleSoundSelect = document.createElement('select');
        tripleSoundSelect.id = 'triplesound';
        tripleSoundSelect.classList.add('css-1xbroe7');
        tripleSoundSelect.style.padding = '0 5px';
        tripleSoundSelect.onchange = onSelectChange;

        matchMenuContainer.appendChild(tripleSoundSelect);

        tripleSoundArr.forEach((triple) => {
            const optionEl = document.createElement('option');
            optionEl.value = triple.value;
            optionEl.text = triple.name;
            optionEl.style.backgroundColor = '#353d47';
            if (triplesound === triple.value) optionEl.setAttribute('selected', 'selected');
            tripleSoundSelect.appendChild(optionEl);
        });

        const booBtn = document.createElement('button');
        booBtn.id = 'boosound';
        booBtn.innerText = 'BOO';
        booBtn.classList.add('adp_config-btn');
        setActiveAttr(booBtn, boosound);
        matchMenuContainer.appendChild(booBtn);

        booBtn.addEventListener('click', async (event) => {
            const isActive = event.target.hasAttribute('data-active');
            setActiveAttr(booBtn, !isActive);
            boosound = !isActive;
            await GM.setValue('boosound', !isActive);
        }, false);

        const nextLegSecSelect = document.createElement('select');
        nextLegSecSelect.id = 'nextLegAfterSec';
        nextLegSecSelect.classList.add('css-1xbroe7');
        nextLegSecSelect.style.padding = '0 5px';
        nextLegSecSelect.onchange = onSelectChange;

        matchMenuContainer.appendChild(nextLegSecSelect);

        nextLegSecArr.forEach((sec) => {
            const optionEl = document.createElement('option');
            optionEl.value = sec.value;
            optionEl.text = `Next Leg ${sec.value}${sec.value === 'OFF' ? '' : ' sec'}`;
            optionEl.style.backgroundColor = '#353d47';
            if (nextLegAfterSec === sec.value) optionEl.setAttribute('selected', 'selected');
            nextLegSecSelect.appendChild(optionEl);
        });

        // ######### start iOS fix #########
        // https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari

        if (isiOS) {
            const startBtnContainer = document.createElement('div');
            startBtnContainer.style.position = 'absolute';
            startBtnContainer.style.height = '100%';
            startBtnContainer.style.width = '100%';
            startBtnContainer.style.top = '0';
            startBtnContainer.style.left = '0';
            startBtnContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            startBtnContainer.style.display = 'flex';
            startBtnContainer.style.justifyContent = 'center';
            startBtnContainer.style.alignItems = 'center';

            document.querySelector('#root').appendChild(startBtnContainer);

            const startBtn = document.createElement('button');
            startBtn.id = 'startBtn';
            startBtn.innerText = 'START';
            startBtn.classList.add('css-1xbmrf2');
            startBtn.style.background = '#ffffff';
            startBtn.style.color = '#646464';
            startBtn.style.fontSize = '36px';
            startBtn.style.padding = '36px 24px';
            startBtnContainer.appendChild(startBtn);

            startBtn.addEventListener('click', async (event) => {
                soundEffect1.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                startBtnContainer.remove();
            }, false);

            // ######### end iOS fix #########
        }

        function playSound1(fileName) {
            // console.log('fileName1', fileName);
            soundEffect1.src = fileName;
        }

        function playSound2(fileName) {
            // console.log('fileName2', fileName);
            soundEffect2.src = fileName;
        }

        const caller = async () => {
            const soundServerUrl = 'https://autodarts-plus.x10.mx';

            const callerFolder = callerData[callerActive]?.folder || '';
            const callerServerUrl = callerData[callerActive]?.server || '';
            const fileExt = callerData[callerActive]?.fileExt || '.mp3';

            const turnPoints = counterContainer.firstChild.innerText.trim();
            const throwPointsArr = [...counterContainer.querySelectorAll('.css-dfewu8, .css-rzdgh7, .css-ucdbhl')].map((el) => el.innerText);

            const curThrowPointsName = throwPointsArr.slice(-1)[0];

            const playPointsSound = () => {
                if (callerFolder.startsWith('google')) {
                    playSound1('https://autodarts.de.cool/mp3_helper.php?language=' + callerFolder.substring(7, 9) + '&text=' + turnPoints);
                } else {
                    if (callerFolder.length && callerServerUrl.length) playSound1(callerServerUrl + '/' + callerFolder + '/' + turnPoints + '.mp3');
                }
            };

            const winnerContainer = document.querySelector('.css-e9w8hh');

            let curThrowPointsNumber = -1;
            let curThrowPointsBed = '';
            let curThrowPointsMultiplier = 1;

            if (curThrowPointsName) {
                if (curThrowPointsName.startsWith('M')) {
                    curThrowPointsNumber = 0;
                    curThrowPointsBed = 'Outside';
                } else if (curThrowPointsName === 'Bull') {
                    curThrowPointsNumber = 25;
                    curThrowPointsBed = 'D';
                } else if (curThrowPointsName === '25') {
                    curThrowPointsNumber = 25;
                    curThrowPointsBed = 'S';
                } else {
                    curThrowPointsNumber = curThrowPointsName.slice(1);
                    curThrowPointsBed = curThrowPointsName.charAt(0);
                }

                if (curThrowPointsBed === 'D') curThrowPointsMultiplier = 2;
                if (curThrowPointsBed === 'T') curThrowPointsMultiplier = 3;
            }

            if (turnPoints === 'BUST') {
                if (callerFolder.length && callerServerUrl.length) playSound1(callerServerUrl + '/' + callerFolder + '/' + '0' + fileExt);
            } else {
                if (curThrowPointsName === 'BULL') {
                    if (triplesound === '1') {
                        playSound1(soundServerUrl + '/' + 'beep_1.mp3');
                    }
                    if (triplesound === '2') {
                        playSound1(soundServerUrl + '/' + 'beep_2_bullseye.mp3');
                    }
                } else if (curThrowPointsBed === 'Outside') {
                    if (boosound === true) {
                        const randomMissCount = Math.floor(Math.random() * 3) + 1;
                        playSound1(soundServerUrl + '/' + 'miss_' + randomMissCount + '.mp3');
                    }
                } else {
                    if (matchVariant === 'X01' || (matchVariant === 'Cricket' && curThrowPointsNumber >= 15)) {
                        if (curThrowPointsMultiplier === 3) {
                            if (triplesound === '1') {
                                playSound2(soundServerUrl + '/' + 'beep_1.mp3');
                            }
                            if (triplesound === '2' && curThrowPointsNumber >= 17) {
                                playSound2(soundServerUrl + '/' + 'beep_2_' + curThrowPointsNumber + '.wav');
                            }
                        }
                    }
                }
                //////////////// Cricket ////////////////////
                if (matchVariant === 'Cricket') {
                    if (curThrowPointsNumber >= 0) {
                        if (curThrowPointsNumber >= 15 && !cricketClosedPoints.includes(curThrowPointsNumber)) {
                            setCricketClosedPoints();
                            playSound2(soundServerUrl + '/' + 'bonus-points.mp3');
                        } else {
                            playSound2(soundServerUrl + '/' + 'sound_double_windart.wav');
                        }
                    }
                }
                //////////////// play Sound ////////////////////
                if (matchVariant === 'X01' || (matchVariant === 'Cricket' && turnPoints > 0)) {
                    if (throwPointsArr.length === 3 && callerFolder.length) {
                        playPointsSound();
                    }
                }
                //////////////// ATC ////////////////////

                ////////////////  ////////////////////

                if (winnerContainer) {
                    const waitForSumCalling = throwPointsArr.length === 3 ? 2500 : 0;
                    const winnerPlayer = winnerContainer.querySelector('span.css-1mxmf5a')?.innerText;

                    document.querySelector('.game-shot-animation .css-x3m75h').style.lineHeight = '1';
                    document.querySelector('.game-shot-animation .css-x3m75h').style.marginTop = '0.5rem';

                    setTimeout(() => {
                        const buttons = [...document.querySelectorAll('button.css-1x1xjw8, button.css-1vfwxw0')];
                        buttons.forEach((button) => {
                            // --- Leg finished ---
                            if (button.innerText === 'Next Leg') {
                                if (callerFolder.length && callerServerUrl.length) playSound1(callerServerUrl + '/' + callerFolder + '/' + 'gameshot.mp3');
                            }
                            // --- Match finished ---
                            if (button.innerText === 'Finish') {
                                console.log('finish');
                                if (callerFolder.length && callerServerUrl.length) playSound1(callerServerUrl + '/' + callerFolder + '/' + 'gameshot and the match.mp3');
                                setTimeout(() => {
                                    const winnerSoundurl = Object.values(winnerSoundData).find(winnersound => winnersound?.playername.toLowerCase() === winnerPlayer.toLowerCase())?.soundurl;
                                    if (winnerSoundurl) playSound2(winnerSoundurl);
                                }, 1000);
                            }
                        });
                    }, waitForSumCalling);
                }
            }
        };

        const onCounterChange = async () => {
            caller();

            inactiveSmall = (await GM.getValue('inactiveSmall')) ?? true;

            if (inactiveSmall) {
                [...document.querySelectorAll('.css-x3m75h')].forEach((el) => (el.classList.remove('adp_points-small')));
                [...document.querySelectorAll('.css-1a28glk .css-x3m75h')].forEach((el) => (el.classList.add('adp_points-small')));
            }

            if (showTotalDartsAtLegFinish || nextLegAfterSec !== 'OFF') {
                const winnerContainer = document.querySelector('.css-e9w8hh');

                if (winnerContainer) {
                    // --- Leg finished ---
                    console.log('Leg finished');

                    if (showTotalDartsAtLegFinish && matchVariant === 'X01') {
                        const throwRound = document.querySelector('.css-1tw9fat')?.innerText?.split('/')[0]?.substring(1);
                        const throwThisRound = document.querySelectorAll('.css-1chp9v4, .css-ucdbhl').length;

                        const throwsSum = (throwRound - 1) * 3 + throwThisRound;

                        const throwsSumEl = document.createElement('div');
                        if (!showTotalDartsAtLegFinishLarge) throwsSumEl.style.fontSize = '0.5em';
                        throwsSumEl.innerHTML = throwsSum + ' Darts';

                        const sumContainerEl = winnerContainer.querySelector('.css-x3m75h');
                        sumContainerEl.replaceChildren(throwsSumEl);
                    }

                    if (nextLegAfterSec !== 'OFF') {
                        const buttons = [...document.querySelectorAll('button.css-1vfwxw0')];
                        buttons.forEach((button) => {
                            if (button.innerText === 'Next Leg') {
                                if (!parseInt(nextLegAfterSec)) return;
                                setTimeout(() => {
                                    button.click();
                                }, parseInt(nextLegAfterSec) * 1000);
                            }
                        });
                    }
                }
            }
        };

        onCounterChange();

        observeDOM(counterContainer, async function(m) {
            onCounterChange();
        });

    };

    const handleBoards = () => {
        console.log('boards ready');
    };

    const readyClassesValues = Object.values(readyClasses);

    observeDOM(document.getElementById('root'), function(mutationrecords) {
        mutationrecords.some((record) => {
            if (record.addedNodes.length && record.addedNodes[0].classList?.length) {
                const elemetClassList = [...record.addedNodes[0].classList];
                return elemetClassList.some((className) => {
                    if (className.startsWith('css-')) {
                        // console.log('className', className);
                        if (!readyClassesValues.includes(className)) return false;
                        const key = Object.keys(readyClasses).find((key) => readyClasses[key] === className);
                        if (key) {
                            onDOMready();
                            switch (key) {
                                case 'play':
                                    handlePlay();
                                    break;
                                case 'table':
                                    document.querySelector('.' + className).children[0].classList.contains('css-12pccnb') && handleBoards();
                                    document.querySelector('.' + className).children[0].classList.contains('css-5605sr') && handleMatches();
                                    break;
                                case 'match':
                                    handleMatch();
                                    break;
                                case 'boards':
                                    handleBoards();
                                    break;
                                case 'matchHistory':
                                    handleMatchHistory();
                                    break;
                            }
                            return true;
                        }
                    }
                });
            }
        });
    });
})();
