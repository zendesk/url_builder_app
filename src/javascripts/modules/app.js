/**
 *  Example app
 **/

import I18n from '../../javascripts/lib/i18n'
import { resizeContainer, render } from '../../javascripts/lib/helpers'
import getDefaultTemplate from '../../templates/default'
import getHeaderTemplate from '../../templates/header'

const MAX_HEIGHT = '300px'
const API_ENDPOINTS = (id) => ({
  users: '/api/v2/users/show_many.json',
  tickets: `/api/v2/tickets/${id}.json`
});

class App {
  constructor (client, appData) {
    this._client = client

    // TODO: appData.metadata
    this._appData = appData

    this.states = {}

    // this.initializePromise is only used in testing
    // indicate app initilization(including all async operations) is complete
    this.initializePromise = this.init()
  }

  /**
   * Initialize module, render main template
   */
  async init () {
    // get current ticket
    const ticket = await client.get('ticket').ticket
    const assigneeId = ticket.assignee.user.id
    const requesterId = ticket.requester.id

    const userId = await client.get('currentUser').currentUser.id

    const userIds = _.compact(_.uniq([assigneeId, userId, requesterId]))
    const fetchedUserIds = await client.request(fetchUsers(userIds))
    buildTemplateUrls(fetchedUserIds);
    ///////

    const currentUser = (await this._client.get('currentUser')).currentUser
    this.states.currentUserName = currentUser.name

    I18n.loadTranslations(currentUser.locale)

    // async call to retrieve organizations
    const organizations = await this._client
      .request(API_ENDPOINTS.organizations)
      .catch(this._handleError.bind(this))

    
    if (organizations) {
      this.states.organizations = organizations.organizations

      // render application markup
      render('.header', getHeaderTemplate(this.states))
      render('.loader', getDefaultTemplate(this.states))

      return resizeContainer(this._client, MAX_HEIGHT)
    }
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
