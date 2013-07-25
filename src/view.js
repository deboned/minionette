Minionette.View = Backbone.View.extend({
    constructor: function(options) {
        this._initializeRegions(options || {});

        _.bindAll(this, '_jqueryRemove', '_viewHelper');
        Backbone.View.apply(this, arguments);

        // Have the view listenTo the model and collection.
        this._listenToEvents(this.model, _.result(this, 'modelEvents'));
        this._listenToEvents(this.collection, _.result(this, 'collectionEvents'));
    },

    // A default template that will clear this.$el.
    // Override this in a subclass to something useful.
    template: function() { return ''; },

    // A default function that will have it's return passed
    // to this.template
    // Override this in a subclass to something useful.
    serializeData: function() {
        return {view: this._viewHelper};
    },

    // When delegating events, bind this view to jQuery's special remove event.
    // Allows us to clean up the view, even if you remove this.$el with jQuery.
    // http://blog.alexmaccaw.com/jswebapps-memory-management
    delegateEvents: function() {
        Backbone.View.prototype.delegateEvents.apply(this, arguments);

        this.$el.on('remove.delegateEvents' + this.cid, this._jqueryRemove);
    },

    // A useful remove method to that triggers events.
    remove: function() {
        if (!this._isRemoving) {
            this._isRemoving = true;
            this.trigger('remove:before');

            this._removeFromParent();
            _.invoke(this._regions, 'remove');

            Backbone.View.prototype.remove.apply(this, arguments);

            this.trigger('remove');
        }
    },

    // A useful default render method.
    render: function() {
        this.trigger('render:before');

        // Detach all our regions, so they don't need to be re-rendered.
        _.invoke(this._regions, 'detach');

        this.$el.html(this.template(this.serializeData()));

        // Reattach all our regions
        _.invoke(this._regions, 'reattach', this.$el);

        this.trigger('render');
        return this;
    },

    // Adds the Region "name" to as this[name].
    // Also attaches it to this._regions[name], for
    // internal management.
    addRegion: function(name, view) {
        this[name] = this._regions[name] = new Minionette.Region({view: view});
        return this[name];
    },

    // A remove helper to remove this view from it's parent
    _removeFromParent: function() {
        if (this._parent && this._parent._removeView) {
            this._parent._removeView(this);
            this._parent = null;
        }
    },

    // A proxy method to #remove()
    // Done so we don't _.bindall() to
    // #remove()
    _jqueryRemove: function() {
        this.trigger('remove:jquery');
        this.remove();
    },

    // Loop through the events given, and listen to
    // entity's event.
    _listenToEvents: function(entity, events) {
        if (!entity) { return; }
        _.each(events, function(method, event) {
            if (!_.isFunction(method)) { method = this[method]; }
            this.listenTo(entity, event, method);
        }, this);
    },

    // Takes the #regions object and creates the regions,
    // using the keys as the name and the values as the original
    // view. Keys are all that is required, passing in a false-y
    // value will make Region use a placeholder span element.
    _initializeRegions: function(options) {
        // Initialize our regions object
        this._regions = {};

        // Pull regions from instantiated options.
        var regions = this.regions;
        if (options.regions) { regions = options.regions; }

        // Add the regions
        _.each(regions, function(view, name) {
            this.addRegion(name, view);
        }, this);
    },

    // A helper that is passed to #template() that will
    // render regions inline.
    _viewHelper: function(view) {
        var region = this._regions[view];
        if (region) {
            return region.render().el.outerHTML;
        }
        return '';
    }
});
