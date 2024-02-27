// ==UserScript==
// @id           autodarts-plus@https://github.com/sebudde/autodarts-plus
// @name         Autodarts Plus
// @namespace    https://github.com/sebudde/autodarts-plus
// @version      0.0.3
// @description  Userscript for Autodarts
// @author       sebudde / benebelter
// @match        https://play.autodarts.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autodarts.io
// @license      MIT
// @downloadURL  https://github.com/sebudde/autodarts-plus/raw/main/autodarts-plus.user.js
// @updateURL    https://github.com/sebudde/autodarts-plus/raw/main/autodarts-plus.user.js
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        match: {
            inactiveSmall: 1,
            caller: 1,
            showThrowSumAtLegFinish: 1,
            showNextLegAfter: 1
        }
    };

    //////////////// CONFIG END ////////////////////

    const apiUrl = 'https://api.autodarts.io/as/v0';

    const readyClasses = {
        play: 'css-1lua7td',
        lobbies: 'css-1q0rlnk',
        table: 'css-p3eaf1', // matches & boards
        match: 'css-ul22ge',
        matchHistory: 'css-10z204m'
    };

    let firstLoad = true;

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
    `;
    document.getElementsByTagName('head')[0].appendChild(adp_style);

    //////////////// add menu and page  ////////////////////

    const onDOMready = () => {
        if (firstLoad) {
            firstLoad = false;
            // init
        }
        console.log('DOM ready:');
    };

    ////////////////  end ////////////////////

    const handlePlay = () => {
        console.log('play ready');
    };

    const handleMatches = () => {
        console.log('matches ready');
    };

    const handleMatch = async () => {
        console.log('match ready!');

        // iOS fix
        // https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari
        const soundEffect1 = new Audio();
        soundEffect1.autoplay = true;
        const soundEffect2 = new Audio();
        soundEffect2.autoplay = true;

        const configRow = document.createElement('div');
        configRow.classList.add('css-k008qs');
        configRow.style.marginTop = 'calc(var(--chakra-space-2) * -1 - 4px)';

        const configContainer = document.createElement('div');
        configContainer.classList.add('css-a6m3v9');

        configRow.appendChild(configContainer);

        document.querySelector('.css-k008qs').after(configRow);

        // PR font-size larger
        [...document.querySelectorAll('.css-1n5vwgq .css-qqfgvy')].forEach((el) => (el.style.fontSize = 'var(--chakra-fontSizes-xl)'));
        [...document.querySelectorAll('.css-1memit')].forEach((el) => (el.style.marginTop = '-4px'));
        [...document.querySelectorAll('.css-x3m75h')].forEach((el) => (el.style.lineHeight = '148px'));

        const matchVariant = document.querySelector('.css-1xbroe7').innerText;
        if (matchVariant !== 'X01') return;
        let matchId = '';

        const counterContainer = document.querySelector('.css-oyptjf');

        const uuidLength = 36;
        const pathName = location.pathname;
        if (pathName.indexOf('matches/') >= 0) {
            matchId = pathName.split('matches/')[1];
            if (matchId) matchId = matchId.substring(0, uuidLength);
        }

        let callerName = (await GM.getValue('callerName')) || '0';
        let triplesound = (await GM.getValue('triplesound')) || '0';
        let boosound = (await GM.getValue('boosound')) || false;
        let nextLegAfterSec = (await GM.getValue('nextLegAfterSec')) || 'OFF';

        if (CONFIG.match.caller === 1) {
            const onSelectChange = (event) => {
                (async () => {
                    eval(event.target.id + ' = event.target.value');
                    await GM.setValue(event.target.id, event.target.value);
                })();
            };

            const setActiveAttr = (el, isActive) => {
                if (isActive) {
                    el.setAttribute('data-active', '');
                } else {
                    el.removeAttribute('data-active');
                }
            };

            const callerArr = [
                {
                    value: '0',
                    name: 'Caller OFF'
                }, {
                    value: '1_male_eng',
                    name: 'Male eng'
                }, {
                    value: 'google_eng',
                    name: 'Google eng'
                }, {
                    value: 'google_de',
                    name: 'Google de'
                }, {
                    value: 'russ_bray',
                    name: 'The Voice RB'
                }, {
                    value: 'georgeno',
                    name: 'The Puppy GN'
                }, {
                    value: 'shorty',
                    name: 'Shorty'
                }, {
                    value: 'haulpinks',
                    name: 'Flawless PH'
                }];

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
            callerSelect.id = 'callerName';
            callerSelect.classList.add('css-1xbroe7');
            callerSelect.style.padding = '0 5px';
            callerSelect.onchange = onSelectChange;

            configContainer.appendChild(callerSelect);

            callerArr.forEach((caller) => {
                const optionEl = document.createElement('option');
                optionEl.value = caller.value;
                optionEl.text = caller.name;
                optionEl.style.backgroundColor = '#353d47';
                if (callerName === caller.value) optionEl.setAttribute('selected', 'selected');
                callerSelect.appendChild(optionEl);
            });

            const tripleSoundSelect = document.createElement('select');
            tripleSoundSelect.id = 'triplesound';
            tripleSoundSelect.classList.add('css-1xbroe7');
            tripleSoundSelect.style.padding = '0 5px';
            tripleSoundSelect.onchange = onSelectChange;

            configContainer.appendChild(tripleSoundSelect);

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
            booBtn.classList.add('css-1xbmrf2');
            booBtn.style.height = 'var(--chakra-sizes-8)';
            booBtn.style.padding = '0 var(--chakra-space-4)';
            booBtn.style.margin = '0';
            setActiveAttr(booBtn, boosound);
            configContainer.appendChild(booBtn);

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

            configContainer.appendChild(nextLegSecSelect);

            nextLegSecArr.forEach((sec) => {
                const optionEl = document.createElement('option');
                optionEl.value = sec.value;
                optionEl.text = `Next Leg ${sec.value}s`;
                optionEl.style.backgroundColor = '#353d47';
                if (nextLegAfterSec === sec.value) optionEl.setAttribute('selected', 'selected');
                nextLegSecSelect.appendChild(optionEl);
            });

            const hideHeaderBtn = document.createElement('button');
            hideHeaderBtn.id = 'hideHeader';
            hideHeaderBtn.innerText = 'Header';
            hideHeaderBtn.classList.add('css-1xbmrf2');
            hideHeaderBtn.style.height = 'var(--chakra-sizes-8)';
            hideHeaderBtn.style.padding = '0 var(--chakra-space-4)';
            hideHeaderBtn.style.margin = 0;

            let hideHeaderGM = await GM.getValue('hideHeader');

            const headerEl = document.querySelector('.css-gmuwbf');
            const mainContainerEl = document.querySelector('.css-1lua7td');

            if (hideHeaderGM) {
                headerEl.style.display = 'none';
                mainContainerEl.style.height = '100vh';
            }

            setActiveAttr(hideHeaderBtn, !hideHeaderGM);

            configContainer.appendChild(hideHeaderBtn);

            hideHeaderBtn.addEventListener('click', async (event) => {
                const isActive = event.target.hasAttribute('data-active');
                setActiveAttr(hideHeaderBtn, !isActive);
                headerEl.style.display = isActive ? 'none' : 'flex';
                mainContainerEl.style.height = isActive ? '100vh' : 'calc(100vh - 72px)';

                await GM.setValue('hideHeader', isActive);
            }, false);

            // ######### start iOS fix #########
            // https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari

            const isiOS = [
                    'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) || // iPad on iOS 13 detection
                (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

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
                    // soundEffect1.src = 'https://autodarts.x10.mx' + '/' + 'chase_the_sun/chase_the_sun.mp3';
                    soundEffect1.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                    startBtnContainer.remove();
                }, false);

                // ######### end iOS fix #########
            }
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
            const callerServerUrl = 'https://autodarts.x10.mx';

            const fileExt = '.mp3';
            const turnPoints = counterContainer.firstChild.innerText.trim();
            const throwPointsArr = [...counterContainer.querySelectorAll('.css-dfewu8, .css-rzdgh7')].map((el) => el.innerText);

            const curThrowPointsName = throwPointsArr.slice(-1)[0];

            const winnerContainer = document.querySelector('.css-e9w8hh');

            let curThrowPointsNumber = 0;
            let curThrowPointsBed = '';
            let curThrowPointsMultiplier = 1;

            if (curThrowPointsName) {
                if (curThrowPointsName.startsWith('M')) {
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

            // const curThrowPointsValue = curThrowPointsNumber * curThrowPointsMultiplier;
            // console.log(curThrowPointsValue)
            // console.log(curThrowPointsBed)

            if (turnPoints === 'BUST') {
                playSound1(callerServerUrl + '/' + callerName + '/' + '0' + fileExt);
            } else {
                if (curThrowPointsName === 'BULL') {
                    if (triplesound === '1') {
                        playSound1(callerServerUrl + '/' + 'russ_bray' + '/' + 'triple_beep' + fileExt);
                    }
                    if (triplesound === '2') {
                        playSound1(callerServerUrl + '/' + 'triple' + '/' + 'bullseye' + fileExt);
                    }
                } else if (curThrowPointsBed === 'Outside') {
                    if (boosound === true) {
                        const missPrefix = ['1st', '2nd', '3rd'];
                        const randomMissPrefix = missPrefix[Math.floor(Math.random() * missPrefix.length)];
                        playSound1(callerServerUrl + '/' + 'russ_bray' + '/' + 'miss_' + randomMissPrefix + '_dart' + fileExt);
                    }
                } else {
                    if (curThrowPointsMultiplier === 3) {
                        if (triplesound === '1') {
                            playSound1(callerServerUrl + '/' + 'russ_bray' + '/' + 'triple_beep' + fileExt);
                        }
                        if (triplesound === '2' && curThrowPointsNumber >= 17) {
                            playSound1(callerServerUrl + '/' + 'russ_bray' + '/' + 'SoundHwTriple' + curThrowPointsNumber + '_old' + '.wav');
                        }
                    }
                }

                if (throwPointsArr.length === 3 && callerName.length) {
                    if (callerName.startsWith('google')) {
                        playSound1('https://autodarts.de.cool/mp3_helper.php?language=' + callerName.substring(7, 9) + '&text=' + turnPoints);
                    } else {
                        playSound1(callerServerUrl + '/' + callerName + '/' + turnPoints + fileExt);
                    }
                }

                if (winnerContainer) {
                    const waitForSumCalling = throwPointsArr.length === 3 ? 2500 : 0;

                    setTimeout(() => {
                        const buttons = [...document.querySelectorAll('button.css-1x1xjw8, button.css-1vfwxw0')];
                        buttons.forEach((button) => {
                            // --- Leg finished ---
                            if (button.innerText === 'Next Leg') {
                                playSound1(callerServerUrl + '/' + callerName + '/' + 'gameshot.mp3');
                            }
                            // --- Match finished ---
                            if (button.innerText === 'Finish') {
                                console.log('finish');
                                playSound1(callerServerUrl + '/' + callerName + '/' + 'gameshot and the match.mp3');
                                setTimeout(() => {
                                    playSound2(callerServerUrl + '/' + 'chase_the_sun/chase_the_sun.mp3');
                                }, 1000);
                            }
                        });
                    }, waitForSumCalling);
                }
            }
        };

        const onCounterChange = async () => {
            if (CONFIG.match.caller === 1) caller();

            if (CONFIG.match.inactiveSmall === 1) {
                [...document.querySelectorAll('.css-x3m75h')].forEach((el) => (el.classList.remove('adp_points-small')));
                [...document.querySelectorAll('.css-1a28glk .css-x3m75h')].forEach((el) => (el.classList.add('adp_points-small')));
            }

            if (CONFIG.match.showThrowSumAtLegFinish || CONFIG.match.showNextLegAfter) {
                const winnerContainer = document.querySelector('.css-e9w8hh');

                if (winnerContainer) {
                    // --- Leg finished ---

                    console.log('Leg finished');

                    if (CONFIG.match.showThrowSumAtLegFinish) {
                        const throwRound = document.querySelector('.css-1tw9fat')?.innerText?.split('/')[0]?.substring(1);
                        const throwThisRound = document.querySelectorAll('.css-1chp9v4, .css-ucdbhl').length;

                        // console.log(throwRound);
                        // console.log(throwThisRound);

                        const throwsSum = (throwRound - 1) * 3 + throwThisRound;

                        const throwsSumEl = document.createElement('span');
                        throwsSumEl.style.fontSize = '0.5em';
                        throwsSumEl.innerHTML = throwsSum + ' Darts';

                        const sumContainerEl = winnerContainer.querySelector('.css-x3m75h');
                        sumContainerEl.replaceChildren(throwsSumEl);
                    }

                    if (CONFIG.match.showNextLegAfter) {
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

        if (!matchId) {
            console.error('matchId could not be extracted from URL');
        } else {
            onCounterChange();

            observeDOM(counterContainer, async function(m) {
                onCounterChange();
            });
        }
    };

    const handleBoards = () => {
        console.log('boards ready');
    };

    const handleMatchHistory = () => {
        console.log('matchHistory ready');
    };

    const readyClassesValues = Object.values(readyClasses);

    observeDOM(document.getElementById('root'), function(mutationrecords) {
        mutationrecords.some((record) => {
            if (record.addedNodes.length && record.addedNodes[0].classList?.length) {
                const elemetClassList = [...record.addedNodes[0].classList];
                return elemetClassList.some((className) => {
                    if (className.startsWith('css-')) {
                        if (!readyClassesValues.includes(className)) return false;
                        // console.log('className', className);
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
