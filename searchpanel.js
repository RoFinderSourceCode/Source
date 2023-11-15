(async() => {
    console.log('uh here')
    function Element(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) resolve(document.querySelector(selector));
            const MutationObserver = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    MutationObserver.disconnect();
                }
            });
            MutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }
    const Div = document.createElement('div');
    Div.id = 'sbx-panel';
    Div.innerHTML = 
    `<!DOCTYPE html>
        <form autocomplete="off" id="sbx-panel">
        <div id="sbx-search-container">
        <div id="sbx-search-box">
        <input type="text" id="sbx-input" name="input" placeholder="Enter username">
        <input type="image" src="path_to_your_search_icon.png" alt="Search Icon" id="sbx-search" disabled>
        </div>
        <div class="scanning-label">Scanning</div>
    </div>
    </form>

    <div id='sbx-progress'>
    <div id='sbx-bar'></div>
    </div>

    <p id="sbx-status"></p>`
    
    //await fetch(chrome.runtime.getURL('panel.html')).then(res => res.text());
    if (document.body.classList.contains('dark-theme')) Div.classList.add('dark');
    const Break = document.createElement('br');
    const Container = await Element('#rbx-running-games');
    Container.parentNode.insertBefore(Div, Container);
    Container.parentNode.insertBefore(Break, Container);
})();