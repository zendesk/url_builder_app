import App from '../modules/app'

/* global ZAFClient */
var client = ZAFClient.init()

client.on('app.registered', (appData) => {
  return new App(client, appData)
})
