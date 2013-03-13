(function() {
  function NullUser(){
    this.id = function(){
      return "";
    };

    this.email = function(){
      return "";
    };

    this.name = function(){
      return "";
    };
    this.externalId = function(){
      return "";
    };
  }

  return {
    customFieldRegExp: /custom_field_[0-9]+/g,

    events: {
      'app.activated'           : 'onActivated',
      'ticket.status.changed'   : 'loadIfDataReady'
    },

    onActivated: function(data) {
      this.doneLoading = false;

      this.loadIfDataReady();
    },

    loadIfDataReady: function(){
      if(!this.doneLoading &&
         this.ticket() &&
         this.ticket().requester() &&
         this.ticket().assignee()){

        this.initialize();
      }
    },

    initialize: function(){
      var templateUris = this.getUriTemplatesFromSettings();
      var context = this.getContext();

      var parsedUris = _.map(templateUris,function(uri){
        var currentContext = context;

        if (this.uriHasCustomFields(uri.url)){
          var customFields = this.extractCustomFieldsFromUrl(uri.url);

          _.each(customFields, function(field){
            context[field] = this.ticket().customField(field);
          }, this);
        }
        if (uri.encode)
          currentContext = _.reduce(context, function(memo,value,key){
            memo[key] = _.reduce(value, function(rmemo,rvalue,rkey){
              if (!_.isEmpty(rvalue))
                rmemo[rkey] = encodeURIComponent(rvalue);
              return rmemo;
            }, {});
            return memo;
          }, {});

        uri.url = _.template(uri.url, currentContext, { interpolate : /\{\{(.+?)\}\}/g });

        return uri;
      }, this);

      this.switchTo('list', { uris: parsedUris });
    },

    getUriTemplatesFromSettings: function(){
      return JSON.parse(this.settings.uri_templates);
    },

    getContext: function(){
      return {
        ticket: { id: this.ticket().id() },
        assignee: this.userToHash(this.ticket().assignee().user()),
        requester: this.userToHash(this.ticket().requester())
      };
    },

    uriHasCustomFields: function(uri){
      return this.customFieldRegExp.test(uri);
    },

    extractCustomFieldsFromUrl: function(uri){
      return uri.match(this.customFieldRegExp);
    },

    userToHash: function(user){
      if (_.isUndefined(user))
        user = new NullUser();

      return {
        id: user.id(),
        name: user.name(),
        email: user.email(),
        externalId: user.externalId()
      };
    }
  };

}());
