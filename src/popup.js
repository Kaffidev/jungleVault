let bananojs

let account
let walletSeed

document.addEventListener('DOMContentLoaded', function (event) {
  bananojs = window.bananocoinBananojs
  bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api')

  chrome.storage.local.get('seed', function (seed) {
    if (typeof seed.seed === 'undefined') {
      show('welcomer')
      setTimeout(() => {
        document.getElementById('loader').classList = 'pageloader'
      }, 300)
    } else {
      show('walletInterface')
      const privKey = bananojs.getPrivateKey(seed.seed, 0)
      bananojs.getPublicKey(privKey).then(publicKey => {
        account = bananojs.getBananoAccount(publicKey)
        walletSeed = seed.seed
        document.getElementById('walletAddress').innerHTML = '<span class="tag is-rounded is-link">Copy</span> ' + account.split('', 18).join('') + '...'
        document.getElementById('monKey').src = `http://monkey.banano.cc/api/v1/monkey/${account}`
        updateBalance()
        setTimeout(() => {
          document.getElementById('loader').classList = 'pageloader'
        }, 300)
      })
    }
  })

  document.getElementById('createWallet').onclick = createWallet
  document.getElementById('deleteWallet').onclick = deleteWallet
  document.getElementById('importFromSeed').onclick = () => {
    hide('helloPage')
    show('importFromSeedDialog')
  }
  document.getElementById('importFromSeedSubmit').onclick = importFromSeed
  document.getElementById('receiveBananos').onclick = receiveBananos
  document.getElementById('sendBananos').onclick = () => {
    if (document.getElementById('sendMenu').style.display === 'none') {
      hide('openSettings')
      hide('optionsMenu')
      hide('representativeChangeMenu')
      show('optionsList')
      show('sendMenu')
    } else {
      show('openSettings')
      hide('sendMenu')
    }
  }
  document.getElementById('sendBananoConfirm').onclick = sendBananos
  document.getElementById('walletAddress').onclick = copyWalletAddress
  document.getElementById('backToHelloPage').onclick = () => {
    hide('importFromSeedDialog')
    show('helloPage')
  }
  document.getElementById('openSettings').onclick = () => {
    if (document.getElementById('optionsMenu').style.display === 'none') {
      show('optionsMenu')
    } else {
      hide('optionsMenu')
    }
  }
  document.getElementById('changeRepresentative').onclick = () => {
    show('representativeChangeMenu')
    hide('optionsList')
    hide('openSettings')
  }
  document.getElementById('backToOptions').onclick = () => {
    hide('representativeChangeMenu')
    show('openSettings')
    show('optionsList')
  }
  document.getElementById('changePresentativeConfirm').onclick = changeRepresentative
})

// window.addEventListener("contextmenu", function(e) { e.preventDefault() })

function changeRepresentative () {
  bananojs.changeBananoRepresentativeForSeed(walletSeed, 0, document.getElementById('presentativeAccount').value).then(hash => {
    hide('representativeChangeMenu')
    show('optionsList')
    hide('optionsMenu')
    document.getElementById('presentativeAccount').value = ''
    sendNotification('Representative changed success!')
  })
}

function copyWalletAddress () {
  copyToClipboard(account)
  sendNotification('Copy success!')
}

function sendBananos () {
  const toSend = document.getElementById('toSend').value
  const toSendAmount = document.getElementById('toSendAmount').value

  bananojs.sendBananoWithdrawalFromSeed(walletSeed, 0, toSend, toSendAmount).then(hash => {
    updateBalance()
    document.getElementById('toSend').value = ''
    document.getElementById('toSendAmount').value = ''
    sendNotification(`Banano send successfully!\nView on <a target="_blank" href="https://creeper.banano.cc/explorer/block/${hash}">creeper</a>`)
  })
}

function updateBalance () {
  bananojs.getAccountBalanceAndPendingRaw(account, true).then(accountInfo => {
    if (accountInfo.error) {
      document.getElementById('walletBalance').innerHTML = '0 BAN'
    } else {
      document.getElementById('walletBalance').innerHTML = `${Number(bananojs.getBananoPartsFromRaw(accountInfo.balance).banano) + Number((bananojs.getBananoPartsFromRaw(accountInfo.balance).banoshi / 100))} BAN (${Number(bananojs.getBananoPartsFromRaw(accountInfo.pending).banano) + Number((bananojs.getBananoPartsFromRaw(accountInfo.pending).banoshi / 100))} Pending)`
    }
  })
}

function importFromSeed () {
  const seedKey = document.getElementById('seedKeyBox').value
  if (bananojs.bananoUtil.isSeedValid(seedKey).valid === false) return sendNotification('Invalid seed!')
  chrome.storage.local.set({ seed: seedKey }, function () {
    walletSeed = seedKey
    document.getElementById('seedKeyBox').value = ''
    sendNotification('Importing success!')
    hide('welcomer')
    show('walletInterface')
    const privateKey = bananojs.getPrivateKey(seedKey, 0)
    bananojs.getPublicKey(privateKey).then(publicKey => {
      account = bananojs.getBananoAccount(publicKey)
      document.getElementById('walletAddress').innerHTML = '<span class="tag is-rounded is-link">Copy</span> ' + account.split('', 18).join('') + '...'
      document.getElementById('monKey').src = `http://monkey.banano.cc/api/v1/monkey/${account}`
      updateBalance()
    })
  })
}

function receiveBananos () {
  bananojs.receiveBananoDepositsForSeed(walletSeed, 0, account).then(output => {
    sendNotification('Received Bananos!')
    updateBalance()
  })
}

function createWallet () {
  const seed = getRandomHex32()
  chrome.storage.local.set({ seed: seed }, function () {
    walletSeed = seed
    const privKey = bananojs.getPrivateKey(seed, 0)
    bananojs.getPublicKey(privKey).then(publicKey => {
      account = bananojs.getBananoAccount(publicKey)
      document.getElementById('walletAddress').innerHTML = '<span class="tag is-rounded is-link">Copy</span> ' + account.split('', 18).join('') + '...'
      document.getElementById('monKey').src = `http://monkey.banano.cc/api/v1/monkey/${bananojs.getBananoAccount(publicKey)}`
      updateBalance()
      hide('welcomer')
      show('walletInterface')
      copyToClipboard(seed)
      sendNotification('Wallet creation success!\nSeed saved to your clipboard, backup it for preventing loss of Bananos.')
    })
  })
}

function deleteWallet () {
  chrome.storage.local.remove('seed', function () {
    show('welcomer')
    hide('walletInterface')
  })
}

function sendNotification (text) {
  document.getElementById('notification').innerHTML = text
  document.getElementById('notification').style.display = 'block'
  setTimeout(() => {
    document.getElementById('notification').innerHTML = ''
    document.getElementById('notification').style.display = 'none'
  }, 3000)
}

const hide = (id) => {
  const elt = document.getElementById(id)
  if (elt) {
    elt.style.display = 'none'
  }
}

const show = (id) => {
  const elt = document.getElementById(id)
  if (elt) {
    elt.style.display = ''
  }
}

const getRandomHex32 = () => {
  const array = new Uint32Array(32)
  window.crypto.getRandomValues(array)
  const hex = getByteArrayAsHexString(array)
  return hex
}

const getByteArrayAsHexString = (byteArray) => {
  return Array.prototype.map.call(byteArray, (byte) => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
}

function copyToClipboard (text) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  document.execCommand('copy')

  document.body.removeChild(textArea)
}
