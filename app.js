(function() {
  return {
    requests: {
      fetchUsers: function(ids) {
        return {
          url: helpers.fmt('/api/v2/users/show_many.json?ids=%@&include=organizations,groups', ids.join(',')),
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    events: {
      'app.created'             : 'onAppCreated',
      '*.changed'               : function(e) {
        if (_.contains(this.fieldsToWatch(), e.propertyName))
          return this.onAppActivated();
      },
      'fetchUsers.done' : 'onFetchUsersDone'
    },

    onAppCreated: function() {
      var userIds = _.compact(_.uniq([
        (this.ticket().assignee().user() && this.ticket().assignee().user().id()),
        this.currentUser().id(),
        (this.ticket().requester() && this.ticket().requester().id())
      ]));

      this.ajax('fetchUsers', userIds);
    },

    onFetchUsersDone: function(data) {
      var templateUris = this.getUriTemplatesFromSettings(),
          templateOptions = { interpolate : /\{\{(.+?)\}\}/g },
          context = this.getContext(data),
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

    getContext: function(data){
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

      context.ticket.description = this.ticket().description();
      context.current_user = this.decorateUser(this.findUserById(data.users,
                                                                 this.currentUser().id()));
      return context;
    },

    findUserById: function(users, user_id) {
      return _.find(users, function(user) {
        return user.id == user_id;
      }, this);
    },

    decorateUser: function(user){
      var name = (user.name || '').split(' ');

      user.firstname = name[0] || '';
      user.lastname = name[1] || '';

      return user;
    },

    fieldsToWatch: _.memoize(function(){
      return _.reduce(this.getUriTemplatesFromSettings(), function(memo, uri){
        var fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function(f){  return f.slice(2,-2); });

        return _.union(memo, fields);
      }, []);
    })
  };
}());
