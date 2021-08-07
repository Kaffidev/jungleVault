const jungleVault = "ekceecjjlhbchgkocobiebalgbhokjin"

function requestTransaction(toAddress, amount) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(jungleVault ,{toSend: toAddress, amount: amount}, function(response) {
      resolve(response)
    })
  })
}