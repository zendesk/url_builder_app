$(function () {

  function getUriTemplatesFromSettings() {
    return JSON.parse(this.settings.uri_templates);
  }

  _.memoize(function fieldsToWatch() {
    return _.reduce(getUriTemplatesFromSettings(), function (memo, uri) {
      var fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function (f) { return f.slice(2, -2); });

      return _.union(memo, fields);
    }, []);
  });

  // helper function that creates our request
  function fetchUsers(ids) {
    return {
      url: helpers.fmt('/api/v2/users/show_many.json?ids=%@&include=organizations,groups', ids.join(',')),
      type: 'GET',
      dataType: 'json'
    };
  }

  function decorateUser(user) {
    var name = (user.name || '').split(' ');

    user.firstname = name[0] || '';
    user.lastname = name[1] || '';

    return user;
  }

  function findUserById(users, user_id) {
    return _.find(users, function (user) {
      return user.id == user_id;
    }, this);
  }

  function getContext(data) {
    var context = _.clone(this.containerContext());

    if (context.ticket.requester.id) {
      context.ticket.requester = decorateUser(findUserById(data.users, context.ticket.requester.id));

      if (context.ticket.requester.organization_id) {
        context.ticket.organization = _.find(data.organizations, function (org) {
          return org.id == context.ticket.requester.organization_id;
        });
      }
    }

    if (context.ticket.assignee.user.id) {
      context.ticket.assignee.user = decorateUser(findUserById(data.users, context.ticket.assignee.user.id));
    }

    //copying data not available on this.containerContext()
    context.ticket.id = this.ticket().id();
    context.ticket.description = this.ticket().description();

    context.current_user = decorateUser(findUserById(data.users, this.currentUser().id()));

    return context;
  }

  function onFetchUsersDone(data) {
    var templateUris = getUriTemplatesFromSettings(),
      templateOptions = { interpolate: /\{\{(.+?)\}\}/g },
      context = getContext(data),
      uris = _.map(templateUris, function (uri) {
        try {
          uri.url = _.template(uri.url, templateOptions)(context);
          uri.title = _.template(uri.title, templateOptions)(context);
        } catch (e) {
          services.notify(e, 'error');
        }
        return uri;
      }, this);

    this.switchTo('list', { uris: uris });
  };

  function onAppCreated() {
    var userIds = _.compact(_.uniq([
      (this.ticket().assignee().user() && this.ticket().assignee().user().id()),
      this.currentUser().id(),
      (this.ticket().requester() && this.ticket().requester().id())
    ]));

    var settings = fetchUsers(userIds);

    client.request(settings).then(function (data) {
      onFetchUsersDone(data);
    });
  }

  // Initialise the Zendesk JavaScript API client
  // https://developer.zendesk.com/apps/docs/apps-v2
  var client = ZAFClient.init();

  client.on('app.registered', function () {
    onAppCreated()
  });

  client.on('*.changed', function (e) {
    if (_.contains(fieldsToWatch(), e.propertyName))
      return onAppCreated();
  });

  client.on('fetchUsers.done', function () {
    onFetchUsersDone()
  });
});