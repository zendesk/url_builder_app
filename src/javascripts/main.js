$(function () {

  // Initialise the Zendesk JavaScript API client
  // https://developer.zendesk.com/apps/docs/apps-v2
  var client = ZAFClient.init()

  client.on('app.registered', () => {
    onAppCreated()

    // TODO: CSS resizing
    client.invoke('resize', { width: '100%', height: '300px' })

    // Used for App Name (primary, seconary apps)
    client.metadata().then(metadata => {
      switchView("header", metadata.settings.title)
    })
  })

  // On any change on zendesk instance
  // Reinitialize app
  // TODO: Test on changed event
  client.on('*.changed', (e) => {
    console.log('change event detected: ', e)
    if (_.contains(fieldsToWatch(), e.propertyName))
      return onAppCreated()
  })

  // TODO: Check for deprecation
  client.on('fetchUsers.done', () => {
    onFetchUsersDone()
  })

  async function getUriTemplatesFromSettings() {
    const rawURIs = await client.metadata().metadata.settings.uri_templates
    return JSON.parse(rawURIs)
  }

  var fieldsToWatch = _.memoize(function() {
    const uri_templates = getUriTemplatesFromSettings()
    return _.reduce(uri_templates, function (memo, uri) {
      const fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function (f) { return f.slice(2, -2) })
      return _.union(memo, fields)
    }, [])
  })

  // helper function that creates our request
  function fetchUsers(ids) {
    const url = null

    if (ids && ids.length) {
      url = `/api/v2/users/show_many.json?ids=${ids.join(',')}&include=organizations,groups`
    } else {
      url = '/api/v2/users/show_many.json?include=organizations,groups'
    }

    return {
      url: url,
      type: 'GET',
      dataType: 'json'
    }
  }

  function getTicketData(id) {
    return { 
      url: `/api/v2/tickets/${id}.json`,
      type: 'GET',
      dataType: 'json'
    }
  }

  function decorateUser(user) {
    if (name) {
      const name = (user.name || '').split(' ')

      user.firstname = name[0] || ''
      user.lastname = name[1] || ''

      return user
    }
  }

  function findUserById(users, user_id) {
    return _.find(users, user => {
      return user.id == user_id
    }, this)
  }

  function getContext(data, ticket, currentUser) {

    const context = []

    if (ticket.requester.id) {
      context.ticket = ticket
      context.ticket.requester = decorateUser(findUserById(data.users, ticket.requester.id))

      // this should be ticket.requester.organization_id
      if (context.ticket.requester.organization_id) {
        context.ticket.organization = _.find(data.organizations, org => {
          return org.id = context.ticket.requester.organization_id
        })
      }
    }

    if (ticket.assignee.id) {
      context.ticket.assignee = []
      console.log('ticket.assignee.id', ticket)
      context.ticket.assignee.user = decorateUser(findUserById(data.users, ticket.assignee.id))
    }

    context.ticket.id = ticket.id
    context.ticket.description = ticket.description

    context.current_user = decorateUser(findUserById(data.users, currentUser.id))
    return context
  }

  function switchView(templateName, viewData) {
    const target = "#" + templateName
    const source = $(target).html()
    const template = Handlebars.compile(source)
    const html = template()

    if (viewData) {
      html = template(viewData)
    }

    if (templateName == 'list') {
      $("#body-content").html(html)
    } else if (templateName == 'header') {
      $("#header-content").html(html)
    }
  }

  async function buildTemplateUrls(data) {
    const templateOptions = { interpolate: /\{\{(.+?)\}\}/g };
    const templateUris = await getUriTemplatesFromSettings();

    const { ticket, currentUser } = 
    const ticket = await client.get('ticket').ticket
    const currentUser = await client.get('currentUser').currentUser

    const ticketFields = await client.request(getTicketData(ticket.id))
    ticketFields.ticket.custom_fields.forEach(custom_field => {
      ticket[`custom_field_${custom_field.id}`] = custom_field.value
    });

    const context = getContext(data, ticket, currentUser)

    console.log('onFetchUsersDone context: ', context)

    const uris = _.map(templateUris, uri => {
        try {
          uri.url = _.template(uri.url, templateOptions)(context)
          uri.title = _.template(uri.title, templateOptions)(context)
        } catch (e) {
          console.error('Error occurred with URIs: ', e)
        }
        return uri
      }, this)

      switchView('list', { uris: uris })
  }

  async function onAppCreated() {
    const ticket = await client.get('ticket').ticket
    const assigneeId = ticket.assignee.user.id
    const requesterId = ticket.requester.id

    const userId = await client.get('currentUser').currentUser.id

    const userIds = _.compact(_.uniq([assigneeId, userId, requesterId]))
    const fetchedUserIds = await client.request(fetchUsers(userIds))

    buildTemplateUrls(fetchedUserIds)
  }
})