(function() {
  return {
    events: {
      'app.activated'           : 'onActivated',
      'ticket.status.changed'   : 'loadIfDataReady',
      '*.changed'               : function(e){
        if (_.contains(this.fieldsToWatch(), e.propertyName))
          return this.initialize();
      }
    },

    onActivated: function(data) {
      this.doneLoading = false;

      this.loadIfDataReady();
    },

    loadIfDataReady: function(){
      if(!this.doneLoading &&
         this.ticket()){
        this.initialize();
      }
    },

    initialize: function(){
      var templateUris = this.getUriTemplatesFromSettings();
      var context = this.getContext();

      var uris = _.map(templateUris, function(uri){
        uri.url = _.template(uri.url, context, { interpolate : /\{\{(.+?)\}\}/g });
        return uri;
      }, this);

      this.switchTo('list', { uris: uris });
    },

    getUriTemplatesFromSettings: function(){
      return JSON.parse(this.settings.uri_templates);
    },

    getContext: function(){
      return _.extend(this.customContainerContext(),
                      this.currentUserContext());
    },

    customContainerContext: function(){
      var context = this.containerContext();

      _.extend(context.ticket.requester,
               this.splitUsername(context.ticket.requester.name));

      if (!_.isEmpty(context.ticket.assignee.user.name)){
        _.extend(context.ticket.assignee.user,
                 this.splitUsername(context.ticket.assignee.user.name));
      }

      return context;
    },

    currentUserContext: function(){
      var context = { current_user: {} };

      if (this.currentUser()){
        var names = this.splitUsername(this.currentUser().name());

        context.current_user = {
          id: this.currentUser().id(),
          email: this.currentUser().email(),
          name: this.currentUser().name(),
          firstname: names.firstname,
          lastname: names.lastname,
          externalId: this.currentUser().externalId()
        };
      }
      return context;
    },

    splitUsername: function(username){
      var names = username.split(' ');
      var obj = {
        firstname: '',
        lastname: ''
      };

      if (!_.isEmpty(names)){
        obj.firstname = names.shift();

        if (!_.isEmpty(names)){
          obj.lastname = names.join(' ');
        }
      }

      return obj;
    },

    fieldsToWatch: _.memoize(function(){
      return _.reduce(this.getUriTemplatesFromSettings(), function(memo, uri){
        var fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function(f){  return f.slice(2,-2); });
        return _.union(memo, fields);
      }, []);
    })
  };
}());
