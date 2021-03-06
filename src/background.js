let cmid

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.request === 'createTransaction') {
    chrome.windows.create({
      url: chrome.extension.getURL(`popup.html?recipient=${msg.recipient}&amount=${msg.amount}`),
      type: 'popup',
      focused: true,
      width: 335,
      height: 500,
      top: 60,
      left: parseInt(window.screen.width)
    })
  }

  if (msg.request === 'updateContextMenu') {
    const type = msg.selection
    if (type.startsWith('ban_') && type.length === 64) {
      const options = {
        title: 'Wallet ' + type,
        contexts: ['selection'],
        id: 'parent'
      }
      if (cmid != null) {
        chrome.contextMenus.update(cmid, options)
      } else {
        cmid = chrome.contextMenus.create(options)
        chrome.contextMenus.create({
          title: 'Explore wallet on creeper',
          contexts: ['selection'],
          parentId: 'parent',
          id: 'showOnCreeper',
          onclick: showOnCreeper
        })
      }
    } else {
      if (cmid != null) {
        chrome.contextMenus.remove(cmid)
        cmid = null
      }
    }
  }
})

function showOnCreeper (clickData, tab) {
  chrome.tabs.create({
    url: `https://creeper.banano.cc/explorer/account/${clickData.selectionText}`
  })
}