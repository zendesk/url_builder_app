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
      return _.extend(this.containerContext(),
                      this.currentUserContext());
    },

    currentUserContext: function(){
      var context = { current_user: {} };

      if (this.currentUser()){
        context.current_user = {
          id: this.currentUser().id(),
          email: this.currentUser().email(),
          name: this.currentUser().name(),
          externalId: this.currentUser().externalId()
        };
      }
      return context;
    },

    fieldsToWatch: _.memoize(function(){
      return _.reduce(this.getUriTemplatesFromSettings(), function(memo, uri){
        var fields = _.map(uri.url.match(/\{\{(.+?)\}\}/g), function(f){  return f.slice(2,-2); });
        return _.union(memo, fields);
      }, []);
    })
  };
}());
