let cmid

function showOnCreeper (clickData, tab) {
  chrome.tabs.create({
    url: `https://creeper.banano.cc/explorer/account/${clickData.selectionText}`
  })
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.request === 'createTransaction') {
    const transactionWindow = window.open(chrome.extension.getURL(`popup.html?recipient=${msg.recipient}&amount=${msg.amount}`), 'junglevaultpayment', 'width=335,height=540,resizable=no,scrollbars=0,top=50,left=1200')
    transactionWindow.madePayment = undefined
    const transactionChecker = setInterval(() => {
      if (transactionWindow.madePayment) {
        transactionWindow.close()
        clearInterval(transactionChecker)
      }
    }, 100)
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
