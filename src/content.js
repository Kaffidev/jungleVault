// Url banano: to jungleVault converter

const bananoLinker = document.querySelectorAll('a[href^="banano:"]')

bananoLinker.forEach(element => {
  const url = new URL(element.href)
  element.href = 'javascript:void(0);'
  element.onclick = () => {
    chrome.runtime.sendMessage({
      request: 'createTransaction',
      recipient: url.pathname,
      amount: url.searchParams.get('amount')
    })
  }
})

const observer = new MutationObserver(records => {
  for (const record of records) {
    for (const added of record.addedNodes) {
      if (added.nodeType === Node.ELEMENT_NODE && added.matches('a[href^="banano:"]')) {
        const url = new URL(added.href)
        added.href = 'javascript:void(0);'
        added.onclick = () => {
          chrome.runtime.sendMessage({
            request: 'createTransaction',
            recipient: url.pathname,
            amount: url.searchParams.get('amount')
          })
        }
      }
    }
  }
})

observer.observe(document, {
  childList: true,
  subtree: true,
  attributes: true
})

// Context menus

document.addEventListener('selectionchange', function () {
  const selection = window.getSelection().toString().trim()
  chrome.runtime.sendMessage({
    request: 'updateContextMenu',
    selection: selection
  })
})
