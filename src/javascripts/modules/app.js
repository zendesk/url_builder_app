/**
 *  Example app
 **/

import I18n from '../../javascripts/lib/i18n'
import { resizeContainer, render } from '../../javascripts/lib/helpers'
import getDefaultTemplate from '../../templates/default'
import getContext, { buildTemplatesFromContext, getUrisFromSettings } from './context'

const MAX_HEIGHT = '300px'

class App {
  constructor (client, appData) {
    this.client = client
    this.settings = appData.metadata.settings;

    this.init();
    /*
      // this.initializePromise is only used in testing
      // indicate app initilization(including all async operations) is complete
      this.initializePromise = this.init()
    */
  }

  /**
   * Initialize module, render main template
   */
  async init () {
    const uris = await getUrisFromSettings(this.settings);
    const context = await getContext(this.client);
    const templates = buildTemplatesFromContext(uris, context);

    return this.renderTemplates(templates);
  }

  renderTemplates(templates) {
    render('.loader', getDefaultTemplate(templates))

    return resizeContainer(this.client, MAX_HEIGHT)
  }
  /**
   * Handle error
   * @param {Object} error error object
   */
  _handleError (error) {
    console.log('An error is handled here: ', error.message)
  }
}

export default App
