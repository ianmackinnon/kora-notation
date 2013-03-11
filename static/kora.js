"use strict";

/*global window, $, _, Backbone */



var k = {

  _templateCache: {},

  template: function (name, data) {
    var url = "/static/template/" + name;

    if (!(k._templateCache.hasOwnProperty(name))) {
      k._templateCache[name] = false;
    }
    if (k._templateCache[name] === false) {
      k._templateCache[name] = true;
      $.ajax({
        url: url,
        async: false,
        success: function (response) {
          k._templateCache[name] = response;
        },
        error: function (jqXHR, textStatus, errorThrown) {
          k.ajaxError(jqXHR, textStatus, errorThrown);
          k._templateCache[name] = null;
        }
      });
    }
    if (k._templateCache[name] === true) {
      var interval = setInterval(function () {
        if (k._templateCache[name] !== true) {
          clearInterval(interval);
        }
      }, 100);
    }
    return _.template(k._templateCache[name], data);
  }
};



(function ($) {


  var CordView = Backbone.View.extend({
    tagName: "span",
    className: "cord",
    templateName: "cord.html",

    events: {
      "click": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        if (this.model.get("state")) {
          this.model.set("state", 0);
          return;
        }
        var y = event.clientY - this.$el.offset().top;
        if (y > 8) {
          this.model.set("state", 1);
        } else {
          this.model.set("state", -1);
        }
      }
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render);
    },

    render: function() {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        cord: this.model.toJSON()
      }));

    }
  });

  var Cord = Backbone.Model.extend({
    defaults: {
      state: 0
    },

    initialize: function (attributes, options) {
    }
  });



  var CordCollectionView = Backbone.View.extend({
    tagName: "span",

    render: function() {
      var view = this;

      _.each(this.collection.models, function(cordModel) {
        var cordView = new CordView({
          model: cordModel
        });
        cordView.render();
        view.$el.append(cordView.$el);
      });
    }
  });

  var CordCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
      var collection = this;

      if (options.length) {
        for (var i = 0; i < options.length; i++) {
          models.push(new Cord());
        }
      }
      models = this.models;
    }
  });



  var RankView = Backbone.View.extend({
    tagName: "span",
    className: "rank",
    templateName: "rank.html",

    render: function() {
      var view = this;
      $(this.el).html(k.template(this.templateName, {
        bar: this.model.toJSON()
      }));

      var cordCollectionView = new CordCollectionView({
        collection: this.model.get("cordCollection")
      });
      cordCollectionView.render()
      this.$el.empty().append(cordCollectionView.$el);
    }
  });

  var Rank = Backbone.Model.extend();



  var RankCollectionView = Backbone.View.extend({
    tagName: "span",

    render: function() {
      var view = this;

      _.each(this.collection.models, function(rankModel) {
        var rankView = new RankView({
          model: rankModel
        });
        rankView.render();
        view.$el.append(rankView.$el);
      });

    }
  });

  var RankCollection = Backbone.Collection.extend({
  });



  var PeriodView = Backbone.View.extend({
    tagName: "div",
    className: "period",
    templateName: "period.html",

    render: function() {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        period: this.model.toJSON()
      }));

      var rankCollectionView = new RankCollectionView({
        collection: this.model.rankCollection
      });
      rankCollectionView.render()
      this.$el.find("span.notation").empty().append(rankCollectionView.$el);
    }
  });

  var Period = Backbone.Model.extend({
    defaults: {
      duration: 1/4
    },
    
    initialize: function (attributes, options) {
      var c1 = new CordCollection([], {
        length: 10
      });
      var leftRank = new Rank({
        name: "left",
        cordCollection: c1
      });
      window.c1 = c1;
      var rightRank = new Rank({
        name: "right",
        cordCollection: new CordCollection([], {
          length: 11
        })
      })
      this.rankCollection = new RankCollection([
          leftRank,
          rightRank
        ]);
    }
    
  });


  
  var PeriodCollectionView = Backbone.View.extend({
    tagName: "div",

    initialize: function() {
      _(this).bindAll("add");
      this.collection.bind("add", this.add);
      this._views = [];
      this.collection.each(this.add);
    },

    add: function(period) {
      var periodView = new PeriodView({
        model: period
      });
      this._views.push(periodView);
      if (this._rendered) {
        periodView.render();
        this.$el.append(periodView.$el);
      }
    },

    render: function() {
      var view = this;
      this._rendered = true;

      _.each(this._views, function(periodView) {
        periodView.render();
        view.$el.append(periodView.$el);
      });
    }
  });

  var PeriodCollection = Backbone.Collection.extend({
    addPeriod: function() {
      this.add(new Period());
    }
  });


  
  var BarView = Backbone.View.extend({
    tagName: "div",
    templateName: "bar.html",
    
    events: {
      "click .addPeriod": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        this.model.periodCollection.addPeriod();
      }
    },

    render: function () {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        bar: this.model.toJSON()
      }));

      var periodCollectionView = new PeriodCollectionView({
        collection: this.model.periodCollection
      })

      periodCollectionView.render();
      this.$el.find("div.notation").empty().append(periodCollectionView.$el);
    },

  });

  var Bar = Backbone.Model.extend({
    defaults: {
      numerator: 4,
      denominator: 4
    },
    
    initialize: function (attributes, options) {
      this.periodCollection = new PeriodCollection([new Period()]);
    }
  });


  
  var BarCollectionView = Backbone.View.extend({
    tagName: "div",

    render: function() {
      var view = this;

      view.$el.append($("<hr>"));
      _.each(this.collection.models, function(barModel) {
        var barView = new BarView({
          model: barModel
        });
        barView.render();
        view.$el.append(barView.$el);
        view.$el.append($("<hr>"));
      });

    }
  });

  var BarCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
      this.add(new Bar());
    }
  });



  var MovementView = Backbone.View.extend({
    tagName: "div",
    templateName: "movement.html",

    render: function() {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        movement: this.model.toJSON()
      }));

      var barCollectionView = new BarCollectionView({
        collection: this.model.barCollection
      })

      barCollectionView.render();
      this.$el.find("div.notation").empty().append(barCollectionView.$el);
    }
  });
  
  var Movement = Backbone.Model.extend({
    defaults: {
      name: "My movement"
    },

    initialize: function (attributes, options) {
      this.barCollection = new BarCollection();
    }
  });

  window.Movement = Movement;
  window.MovementView = MovementView;
  
}($));



$(window.document).ready(function () {
  $.ajaxSetup({ "traditional": true });

  var movement = new window.Movement();
  var movementView = new window.MovementView({
    model:movement
  });
  movementView.render();
  window.movementView = movementView;
  $("body").append(movementView.$el);
});
