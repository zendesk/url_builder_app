$(function () {

  // Initialise the Zendesk JavaScript API client
  // https://developer.zendesk.com/apps/docs/apps-v2
  var client = ZAFClient.init();

  client.on('app.registered', () => {
    onAppCreated();

    client.invoke('resize', { width: '100%', height: '300px' });

    client.metadata().then(metadata => {
      switchView("header", metadata.settings.title);
    });
  });

  client.on('*.changed', (e) => {
    console.log('change event detected: ', e);
    if (_.contains(fieldsToWatch(), e.propertyName))
      return onAppCreated();
  });

  client.on('fetchUsers.done', () => {
    onFetchUsersDone();
  });

  function getUriTemplatesFromSettings() {
    return new Promise((resolve, reject) => {
      client.metadata().then(metadata => {
        resolve(JSON.parse(metadata.settings.uri_templates));
      }, error => {
        reject (new Error("Error retrieving uri_templates: ", error));
      });
    });
  };

  var fieldsToWatch = _.memoize(function() {
    getUriTemplatesFromSettings().then(uri_templates => {
      console.log('fieldsToWatch templates: ', uri_templates);
      return _.reduce(uri_templates, function (memo, uri) {
        let fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function (f) { return f.slice(2, -2); });

        console.log('fieldsToWatch fields: ', fields);
        console.log('fieldsToWatch return: ', _.union(memo, fields));
        return _.union(memo, fields);
      }, []);
    }, error => {
      throw error;
    });
  });

  // helper function that creates our request
  function fetchUsers(ids) {
    let url = null;

    if (ids && ids.length) {
      url = `/api/v2/users/show_many.json?ids=${ids.join(',')}&include=organizations,groups`;
    } else {
      url = '/api/v2/users/show_many.json?include=organizations,groups';
    }

    return {
      url: url,
      type: 'GET',
      dataType: 'json'
    };
  };

  function getTicketData(id) {
    return { 
      url: `/api/v2/tickets/${id}.json`,
      type: 'GET',
      dataType: 'json'
    };
  };

  function decorateUser(user) {
    if (name) {
      let name = (user.name || '').split(' ');

      user.firstname = name[0] || '';
      user.lastname = name[1] || '';

      return user;
    }
  };

  function findUserById(users, user_id) {
    return _.find(users, user => {
      return user.id == user_id;
    }, this);
  };

  function getContext(data, ticket, currentUser) {

    let context = [];

    if (ticket.requester.id) {
      context.ticket = ticket;
      context.ticket.requester = decorateUser(findUserById(data.users, ticket.requester.id));

      // this should be ticket.requester.organization_id
      if (context.ticket.requester.organization_id) {
        context.ticket.organization = _.find(data.organizations, org => {
          return org.id = context.ticket.requester.organization_id;
        });
      }
    }

    if (ticket.assignee.id) {
      context.ticket.assignee = [];
      console.log('ticket.assignee.id', ticket);
      context.ticket.assignee.user = decorateUser(findUserById(data.users, ticket.assignee.id));
    }

    context.ticket.id = ticket.id;
    context.ticket.description = ticket.description;

    context.current_user = decorateUser(findUserById(data.users, currentUser.id));
    return context;
  };

  function switchView(templateName, viewData) {
    let target = "#" + templateName;
    let source = $(target).html();
    let template = Handlebars.compile(source);
    let html = template();

    if (viewData) {
      html = template(viewData);
    }

    if (templateName == 'list') {
      $("#body-content").html(html);
    } else if (templateName == 'header') {
      $("#header-content").html(html);
    }
  };

  function onFetchUsersDone(data) {
    let templateUris = null;
    let templateOptions = { interpolate: /\{\{(.+?)\}\}/g };
    let ticket = null;
    let currentUser = null;

    getUriTemplatesFromSettings().then(uri_templates => {
      templateUris = uri_templates;
      client.get('ticket').then(data => {
        ticket = data.ticket;
        return client.get('currentUser');
      }).then(currentUserResponse => {
        currentUser = currentUserResponse.currentUser;
        return client.get('ticket.assignee');
      }).then(assigneeResponse => {
        ticket.assignee.user = assigneeResponse['ticket.assignee'];
        let customFieldRequest = getTicketData(ticket.id);
        return client.request(customFieldRequest);
      }).then(ticketResponse => {
        ticketResponse.ticket.custom_fields.forEach(custom_field => {
          ticket[`custom_field_${custom_field.id}`] = custom_field.value;
        });

        let context = getContext(data, ticket, currentUser);

        console.log('onFetchUsersDone context: ', context);

        let uris = _.map(templateUris, uri => {
            try {
              uri.url = _.template(uri.url, templateOptions)(context);
              uri.title = _.template(uri.title, templateOptions)(context);
            } catch (e) {
              console.error('Error occurred with URIs: ', e);
            }
            return uri;
          }, this);
        switchView('list', { uris: uris });
      });
    }, error => {
      throw error;
    });
  };

  function onAppCreated() {

    let assigneeId = null;
    let requesterId = null;
    let userId = null;

    client.get('ticket').then(data => {
      if (data.ticket.assignee.user.id) {
        assigneeId = data.ticket.assignee.user.id;
      }

      if (data.ticket.requester.id) {
        requesterId = data.ticket.requester.id;
      }

      return client.get('currentUser');
    }).then(data => {
      userId = data.currentUser.id;

      let userIds = _.compact(_.uniq([assigneeId, userId, requesterId]));
      let settings = fetchUsers(userIds);
      client.request(settings).then(data => {
        onFetchUsersDone(data);
      });
    }).catch(error => {
      console.error("Error retrieving ids: ", error);
    });
  };
});