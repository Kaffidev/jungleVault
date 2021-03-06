let bananojs, account, walletSeed, bPriceUSD

const url = new URL(location)

document.addEventListener('DOMContentLoaded', function (event) {
  bananojs = window.bananocoinBananojs
  bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api')

  const bPriceChecker = new XMLHttpRequest()
  bPriceChecker.open('GET', 'https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=usd', true)
  bPriceChecker.onload = function (e) {
    if (bPriceChecker.status === 200) {
      bPriceUSD = JSON.parse(bPriceChecker.responseText).banano.usd
    } else {
      bPriceUSD = 0.00
    }
  }
  bPriceChecker.send(null)

  chrome.storage.local.get('seed', function (seed) {
    if (typeof seed.seed === 'undefined') {
      show('welcomer')
      setTimeout(() => {
        document.getElementById('loader').classList = 'pageloader'
      }, 300)
    } else {
      if (url.searchParams.has('recipient')) {
        if (url.searchParams.get('amount') !== 'null') {
          const transactionAmount = parseBananoAmount(url.searchParams.get('amount'))
          waitForConfirm(url.searchParams.get('recipient'), transactionAmount).then(() => {
            bananojs.sendBananoWithdrawalFromSeed(walletSeed, 0, url.searchParams.get('recipient'), transactionAmount).then(hash => {
              document.getElementById('toSend').value = ''
              document.getElementById('toSendAmount').value = ''
              window.close()
            }).catch(err => {
              window.close()
            })
          }).catch(err => {
            window.close()
          })
        } else {
          document.getElementById('toSend').value = url.searchParams.get('recipient')
          hide('openSettings')
          show('optionsList')
          show('sendMenu')
        }

        window.onresize = function () {
          window.resizeTo(335, 460)
        }

        document.addEventListener('visibilitychange', async function (event) {
          window.close()
        })
      }

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
  document.getElementById('walletBalance').onclick = () => {
    updateBalance()
  }

  document.getElementById('walletBalance').addEventListener('mouseover', showTip, false)
  document.getElementById('walletBalance').addEventListener('mouseout', hideTip, false)

  document.addEventListener('mousemove', function (e) {
    if (document.getElementById('tip')) {
      document.getElementById('tip').style.left = e.pageX + 'px'
      document.getElementById('tip').style.top = (e.pageY - 30) + 'px'
    }
  })
})

window.addEventListener('contextmenu', function (e) { e.preventDefault() })

function showTip () {
  const tip = document.createElement('span')
  tip.className = 'has-text-warning'
  tip.id = 'tip'
  tip.innerHTML = (parseFloat(document.getElementById('walletBalance').innerHTML.replace('BAN', '')) * bPriceUSD).toFixed(2) + ' $'
  tip.style.position = 'absolute'
  document.getElementById('walletInterface').appendChild(tip)
  tip.style.opacity = '0'
  const intId = setInterval(function () {
    newOpacity = parseFloat(tip.style.opacity) + 0.1
    tip.style.opacity = newOpacity.toString()
    if (tip.style.opacity === '1') {
      clearInterval(intId)
    }
  }, 25)
}

function hideTip () {
  const tip = document.getElementById('tip')
  const intId = setInterval(function () {
    newOpacity = parseFloat(tip.style.opacity) - 0.1
    tip.style.opacity = newOpacity.toString()
    if (tip.style.opacity === '0') {
      clearInterval(intId)
      tip.remove()
    }
  }, 25)
  tip.remove()
}

function parseBananoAmount (raw) {
  return parseFloat(bananojs.getBananoPartsAsDecimal(bananojs.bananoUtil.getAmountPartsFromRaw(raw, 'ban_'))).toFixed(2) + ''
}

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

  waitForConfirm(toSend, toSendAmount).then(() => {
    bananojs.sendBananoWithdrawalFromSeed(walletSeed, 0, toSend, toSendAmount).then(hash => {
      updateBalance()
      document.getElementById('toSend').value = ''
      document.getElementById('toSendAmount').value = ''
      sendNotification(`Banano send successfully!\nView on <a target="_blank" href="https://creeper.banano.cc/explorer/block/${hash}">creeper</a>`)
      if (url.searchParams.has('recipient')) { window.close() }
    }).catch(err => {
      if (err.stack.includes('balance') && err.stack.includes('small')) {
        sendNotification('Insufficent balance!')
        if (url.searchParams.has('recipient')) { window.close() }
      } else {
        sendNotification(err)
        if (url.searchParams.has('recipient')) { window.close() }
      }
    })
  }).catch(err => {
    sendNotification('Transaction cancelled by user.')
    if (url.searchParams.has('recipient')) { window.close() }
  })
}

function receiveBananos () {
  bananojs.receiveBananoDepositsForSeed(walletSeed, 0, account).then(output => {
    sendNotification('Received Bananos!')
    updateBalance()
  })
}

function updateBalance () {
  bananojs.getAccountBalanceAndPendingRaw(account, true).then(accountInfo => {
    if (accountInfo.error) {
      document.getElementById('walletBalance').innerHTML = '0 BAN'
    } else {
      document.getElementById('walletBalance').innerHTML = `${parseBananoAmount(accountInfo.balance)} BAN (${parseBananoAmount(accountInfo.pending)} Pending)`
    }
  })
}

function importFromSeed () {
  const seedKey = document.getElementById('seedKeyBox').value
  if (bananojs.bananoUtil.isSeedValid(seedKey).valid === false) return sendNotification('Invalid seed!')
  chrome.storage.local.set({ seed: seedKey }, function () {
    showLoadingScreen()

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

function createWallet () {
  showLoadingScreen()

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

function waitForConfirm (toAddress, amount) {
  return new Promise((resolve, reject) => {
    showLoadingScreen()

    document.getElementById('transactionSendingTo').value = `${toAddress}`
    document.getElementById('transactionSendingAmount').innerHTML = `Amount: ${amount} BAN`
    hide('representativeChangeMenu')
    hide('openSettings')
    hide('sendMenu')
    show('transactionAcceptMenu')

    document.getElementById('confirmTransaction').onclick = () => {
      hide('transactionAcceptMenu')
      show('openSettings')
      document.getElementById('transactionSendingTo').value = ''
      document.getElementById('transactionSendingAmount').innerHTML = 'Amount:'
      resolve()
    }

    document.getElementById('cancelTransaction').onclick = () => {
      hide('transactionAcceptMenu')
      show('openSettings')
      document.getElementById('transactionSendingTo').value = ''
      document.getElementById('transactionSendingAmount').innerHTML = 'Amount:'
      reject('TRANSACTION_CANCELLED_BY_USER')
    }
  })
}

const getRandomHex32 = () => {
  const array = new Uint32Array(32)
  window.crypto.getRandomValues(array)
  const hex = getByteArrayAsHexString(array)
  return hex
}

function showLoadingScreen () {
  document.getElementById('loader').classList = 'pageloader is-active'
  setTimeout(() => {
    document.getElementById('loader').classList = 'pageloader'
  }, 350)
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
