(function() {
  return {
    requests: {
      fetchUsers: function(ids) {
        return {
          url: helpers.fmt('/api/v2/users/show_many.json?ids=%@&include=organizations', ids.join(',')),
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    events: {
      'app.created': 'onAppCreated',
      '*.changed'  : function(e) {
        if (_.contains(this.fieldsToWatch(), e.propertyName))
          return this.onAppCreated();
      }
    },

    onAppCreated: function() {
      switch (this.currentLocation()) {
        case "user_sidebar":
          this.prepareTemplateForUser();
          break;
        case "ticket_sidebar":
          this.prepareTemplateForTicket();
          break;
      }
    },

    prepareTemplateForUser: function() {
      this.ajax('fetchUsers', [this.user().id()]).done(function(data) {
        var context = this.getUserContext(data);
        this.prepareTemplate(context);
      });
    },

    prepareTemplateForTicket: function() {
      var userIds = _.compact(_.uniq([
        (this.ticket().assignee().user() && this.ticket().assignee().user().id()),
        this.currentUser().id(),
        (this.ticket().requester() && this.ticket().requester().id())
      ]));

      this.ajax('fetchUsers', userIds).done(function(data) {
        var context = this.getTicketContext(data);
        this.prepareTemplate(context);
      });
    },

    prepareTemplate: function(context) {
      var templateUris = this.getUriTemplatesFromSettings(),
          templateOptions = { interpolate : /\{\{(.+?)\}\}/g },
          uris = _.map(templateUris, function(uri){
            try {
              uri.url = _.template(uri.url, templateOptions)(context);
              uri.title = _.template(uri.title, templateOptions)(context);
            } catch(e) {
              console.log('[URL_BUILDER_APP] ' + e);
            }
            return uri;
          }, this);

      this.switchTo('list', { uris: uris });
    },

    getUriTemplatesFromSettings: function(){
      return JSON.parse(this.settings.uri_templates);
    },

    getUserContext: function(data) {
      var context = _.clone(this.containerContext());
      context.user = this.decorateUser(data.users[0]);

      if (context.user.organization_id) {
        context.user.organization = _.find(data.organizations, function(org) {
          return org.id == context.user.organization_id;
        });
      }

      return context;
    },

    getTicketContext: function(data) {
      var context = _.clone(this.containerContext());

      if (context.ticket.requester.id) {
        context.ticket.requester = this.decorateUser(this.findUserById(data.users, context.ticket.requester.id));

        if (context.ticket.requester.organization_id) {
          context.ticket.organization = _.find(data.organizations, function(org) {
            return org.id == context.ticket.requester.organization_id;
          });
        }
      }

      if (context.ticket.assignee.user.id) {
        context.ticket.assignee.user = this.decorateUser(this.findUserById(data.users, context.ticket.assignee.user.id));
      }

      //copying data not available on this.containerContext()
      context.ticket.id = this.ticket().id();
      context.ticket.description = this.ticket().description();

      context.current_user = this.decorateUser(this.findUserById(data.users, this.currentUser().id()));

      return context;
    },

    findUserById: function(users, user_id) {
      return _.find(users, function(user) {
        return user.id == user_id;
      }, this);
    },

    decorateUser: function(user) {
      var name = (user.name || '').split(' ');

      user.firstname = name[0] || '';
      user.lastname = name[1] || '';

      return user;
    },

    fieldsToWatch: _.memoize(function() {
      return _.reduce(this.getUriTemplatesFromSettings(), function(memo, uri){
        var fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function(f){  return f.slice(2,-2); });

        return _.union(memo, fields);
      }, []);
    })
  };
}());
