import App from '../modules/app'

/* global ZAFClient */
const client = ZAFClient.init()
let fieldsToWatch = [];
let app = {};

function getFieldsToWatchFromSettings({ uri_templates }) {
  console.log('uri_templates', uri_templates);
  return _.reduce(JSON.parse(uri_templates), function (memo, uri) {
    console.log('uri', uri)
    console.log('memo', memo);
    const fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function (f) { return f.slice(2, -2) })
    return _.union(memo, fields)
  }, [])
}

// TODO: Check out appData
client.on('app.registered', appData => {
  app = appData;
  fieldsToWatch = getFieldsToWatchFromSettings(appData.metadata.settings);

  return new App(client, appData)
});


// On any change on zendesk instance
// Reinitialize app
// TODO: Test on changed event
client.on('*.changed', e => {
  if (_.contains(fieldsToWatch(), e.propertyName)) {
    return new App(client, app);
  }
});

