const observeDOM = (function() {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    return function(obj, config, callback) {
        if (!obj || obj.nodeType !== 1) return;
        const mutationObserver = new MutationObserver(callback);
        const mutConfig = {
            ...{
                attributes: true,
                childList: true,
                subtree: true
            }, ...config
        };
        mutationObserver.observe(obj, mutConfig);
        return mutationObserver;
    };
})();

const readyClasses = {
    play: 'css-1lua7td',
    lobbies: 'css-1q0rlnk',
    table: 'css-p3eaf1', // matches & boards
    match: 'css-ul22ge',
    matchHistory: 'css-10z204m'
};

let headerEl;
let mainContainerEl;
let matchMenuRow;

console.log('sharedStuff');
