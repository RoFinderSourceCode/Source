chrome.tabs.onUpdated.addListener((tabId, RoFinderInfo, { url }) => {
  if (RoFinderInfo.status !== 'complete' || !/https:\/\/.+roblox.com\/games/g.test(url)) return;

  const target = { tabId };

  chrome.scripting.executeScript({ target, func: () => Boolean(document.getElementById('sbx-panel')) }, async ([{ result }]) => {
    if (result) return;

    await chrome.scripting.insertCSS({ target, files: ['styles.css'] });

    await chrome.scripting.executeScript({ target, files: ['searchpanel.js'] });
    chrome.scripting.executeScript({ target, files: ['searcher.js'] });
  });
});

const func = (place, id) => window.Roblox.GameLauncher.joinGameInstance(place, id);
chrome.runtime.onMessage.addListener(({ message }, { tab }) => chrome.scripting.executeScript(
  {
    target: { tabId: tab.id }, func, args: [message.place, message.id], world: 'MAIN',
  },
));
