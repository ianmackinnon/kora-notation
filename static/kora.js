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
  },

  editInteger: function ($target, callback) {
    var $target = $(event.target);
    var $input = $("<input>");
    var value = $target.text();
    value = parseInt(value);
    $input.css({
      "display": "inline-block",
      "width": "20px"
    });
    $input.val(value);

    var enter = function() {
      var currentValue = $input.val()
      currentValue = parseInt(currentValue);
      $input.replaceWith($target);
      callback(currentValue);
    };

    $input.keypress(function(event) {
      if (event.which == 13) {
        enter();
      }
    });
    $input.blur(enter);

    $target.replaceWith($input);
    $input.focus();
    $input.select();
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
        var note = this.model.get("midiNote");
        if (note) {
          var delay = 0;
          var velocity = 127;
          MIDI.noteOn(0, note, velocity, delay);
          MIDI.noteOff(0, note, delay + 0.25);
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
      name: null,
      frequency: null,
      midiNote: null,
      state: 0
    },

    clone: function () {
      var other = new Cord({
        name: this.get("name"),
        frequency: this.get("frequency"),
        midiNote: this.get("midiNote"),
        state: this.get("state")
      });
      return other;
    },

    dumpString: function () {
      if (this.get("state") == 1) {
        return "∩ ";
      } else if (this.get("state") == -1) {
        return "∪ ";
      } else {
        return "| ";
      }
    },

    note: function () {
      if (!this.get("state")) {
        return;
      }
      return this.get("midiNote");
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

      if (options && options.midiNotes) {
        _.each(options.midiNotes, function(note) {
          models.push(new Cord({
            midiNote: note
          }));
        });
      }
      models = this.models;
    },

    clone: function () {
      var other = new CordCollection();
      this.each(function (cord) {
        other.add(cord.clone());
      });
      return other;
    },

    dumpString: function () {
      var out = "";
      this.each(function (cord) {
        out += cord.dumpString();
      });
      return out;
    },

    notes: function () {
      var notes = [];
      this.each(function (cord) {
        var note = cord.note();
        if (note) {
          notes.push(note);
        }
      });
      return notes;
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

  var Rank = Backbone.Model.extend({
    defaults: {
      name: null,
      cordCollection: null
    },

    clone: function () {
      var other = new Rank({
        name: this.get("name"),
        cordCollection: this.get("cordCollection").clone()
      });
      return other;
    },

    dumpString: function () {
      return this.get("cordCollection").dumpString();
    },

    notes: function() {
      return this.get("cordCollection").notes();
    }
  });



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
    clone: function () {
      var other = new RankCollection();
      this.each(function (rank) {
        other.add(rank.clone());
      });
      return other;
    },

    dumpString: function () {
      var out = "";
      this.each(function (rank, i) {
        if (!!i) {
          out += "  ";
        }
        out += rank.dumpString();
      });
      return out;
    },

    dumpStringBar: function () {
      var rankCollection = this;
      var out = "";
      this.each(function (rank, i) {
        if (!!i) {
          out += "--";
        }
        var length = rank.get("cordCollection").length;
        length *= 2;
        if (i == rankCollection.length - 1) {
          length -= 1;
        }
        for (var i = 0; i < length; i ++) {
          out += "-";
        }
      });
      return out;
    },

    notes: function() {
      var notes = [];
      this.each(function (rank) {
        _.each(rank.notes(), function (note) {
          notes.push(note);
        });
      });
      return notes;
    }
  });



  var PeriodView = Backbone.View.extend({
    tagName: "div",
    className: "period",
    templateName: "period.html",

    events: {
      "click > .control > .addPeriod": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        var index = this.model.collection.indexOf(this.model);
        this.model.collection.newPeriod({
          at: index
        });
      },
      "click > .control > .removePeriod": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        var index = this.model.collection.indexOf(this.model);
        this.model.collection.remove(this.model);
      },
      "click .numerator": function (event) {
        var view = this;
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();

        k.editInteger($(event.target), function (value) {
          var currentDuration = view.model.get("duration");
          var duration = new Fraction(
            value, currentDuration.denominator);
          view.model.set("duration", duration);
        });

      },
      "click .denominator": function (event) {
        var view = this;
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();

        k.editInteger($(event.target), function (value) {
          var currentDuration = view.model.get("duration");
          var duration = new Fraction(
            currentDuration.numerator, value);
          view.model.set("duration", duration);
        });

      }
    },

    initialize: function () {
      var view = this;
      this.model.on("change:duration", function (model, duration) {
        view.reloadDuration();
      });

    },

    render: function () {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        period: this.model.toJSON()
      }));

      var denominator = this.$el.find(".denominator");
      denominator.hover(function () {
        $(this).css("cursor", "pointer");
      }, function () {
        $(this).css("cursor", null);
      });

      var rankCollectionView = new RankCollectionView({
        collection: this.model.rankCollection
      });
      rankCollectionView.render()
      this.$el.find("span.notation").empty().append(rankCollectionView.$el);
    },

    reloadDuration: function () {
      var duration = this.model.get("duration");
      this.$el.find(".numerator").text(duration.numerator);
      this.$el.find(".denominator").text(duration.denominator);
    }
  });

  var Period = Backbone.Model.extend({
    defaults: {
      duration: new Fraction(1, 4)
    },

    initialize: function (attributes, options) {
      this.rankCollection = options.form.clone();
    },

    durationString: function () {
      return "" + this.get("duration");
    },

    dumpString: function () {
      return " " + this.rankCollection.dumpString() + " " + this.durationString() + "\n";
    },

    notes: function() {
      return this.rankCollection.notes();
    }

  });



  var PeriodCollectionView = Backbone.View.extend({
    tagName: "div",

    initialize: function() {
      _(this).bindAll("add", "remove");
      this.collection.bind("add", this.add);
      this.collection.bind("remove", this.remove);
      this._views = [];
      this.collection.each(this.add);
    },

    add: function(period, collection, options) {
      var at = options.at;
      var periodView = new PeriodView({
        model: period
      });
      if (_.isFinite(at)) {
        this._views.splice(at, 0, periodView);
      } else {
        this._views.push(periodView);
      }
      if (this._rendered) {
        periodView.render();
        if (_.isFinite(at)) {
          window.views = this._views;
          this._views[at + 1].$el.before(periodView.$el);
        } else {
          this.$el.append(periodView.$el);
        }
      }

    },

    remove: function(period, collection, options) {
      var index = options.index;
      var view = this._views[index];
      this._views.splice(index, 1);
      view.$el.detach();
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
    initialize: function (models, options) {
      this.form = options.form;
    },

    newPeriod: function(options) {
      this.add(new Period(null, {
        form: this.form
      }), options);
    },

    duration: function () {
      var acc = new Fraction(0);
      this.each(function (period) {
        acc = acc.add(period.get("duration"));
      });
      return acc;
    },

    dumpString: function () {
      var out = "";
      this.each(function (period) {
        out += period.dumpString();
      });
      return out;
    }

  });



  var BarView = Backbone.View.extend({
    tagName: "div",
    className: "bar",
    templateName: "bar.html",

    events: {
      "click button.play": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        this.play();
      },

      "click > .control > .addPeriod": function (event) {
        if (event.which !== 1 || event.metakey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        this.model.periodCollection.newPeriod();
      }
    },

    initialize: function () {
      this.listenTo(this.model.periodCollection, "add", this.reloadDuration);
      this.listenTo(this.model.periodCollection, "remove", this.reloadDuration);
      this.listenTo(this.model.periodCollection, "change:duration", this.reloadDuration);
    },

    render: function () {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        bar: this.model.toJSON(),
        duration: this.model.duration()
      }));

      var periodCollectionView = new PeriodCollectionView({
        collection: this.model.periodCollection
      })

      periodCollectionView.render();
      this.$el.find("div.notation").empty().append(periodCollectionView.$el);
    },

    reloadDuration: function () {
      var duration = this.model.duration();
      this.$el.find(".header .numerator").text(duration.numerator);
      this.$el.find(".header .denominator").text(duration.denominator);
    },

    play: function () {
      var delay = 0;
      this.model.periodCollection.each(function(period) {
        var duration = period.get("duration").toFloat() * window.slow;
        _.each(period.notes(), function(note) {
          MIDI.noteOn(0, note, 32, delay);
          MIDI.noteOff(0, note, delay + duration);
        });
        delay += duration;
      });
    }

  });

  var Bar = Backbone.Model.extend({
    initialize: function (attributes, options) {
      var bar = this;
      this.form = options.form;
      this.periodCollection = new PeriodCollection(null, {
        form: bar.form
      });

      this.periodCollection.newPeriod();
      this.periodCollection.newPeriod();
      this.periodCollection.newPeriod();
      this.periodCollection.newPeriod();
    },

    duration: function () {
      return this.periodCollection.duration();
    },

    dumpString: function () {
      this.periodCollection.duration();

      var out = "";
      out += " " + this.form.dumpStringBar() + "\n";
      out += this.periodCollection.dumpString();
      return out;
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
      this.form = options.form;
      this.add(new Bar(null, {
        form: this.form
      }));
    },

    dumpString: function () {
      var barCollection = this;
      var out = "";
      this.each(function (bar) {
        out += bar.dumpString();
        out += " " + barCollection.form.dumpStringBar() + "\n";
      });
      return out;
    }
  });



  var MovementView = Backbone.View.extend({
    tagName: "div",
    className: "movement",
    templateName: "movement.html",

    render: function() {
      var view = this;

      $(this.el).html(k.template(this.templateName, {
        movement: this.model.toJSON()
      }));

      var clip = new ZeroClipboard( this.$el.find(".clipboard"), {
        moviePath: "/static/ZeroClipboard.swf"
      } );

      clip.on( 'mousedown', function(client) {
        client.setText(view.model.dumpString());
      } );

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
      this.barCollection = new BarCollection(null, {
        form: options.form
      });
    },

    dumpString: function () {
      return "\n" + this.barCollection.dumpString() + "\n";
    }
  });

  window.Movement = Movement;
  window.MovementView = MovementView;
  window.CordCollection = CordCollection;
  window.Rank = Rank;
  window.RankCollection = RankCollection;

}($));



$(window.document).ready(function () {
  $.ajaxSetup({ "traditional": true });

  var c1 = new CordCollection([], {
    midiNotes: [76, 72, 69, 65, 62, 58, 55, 52, 50, 48, 41]
  });
  var leftRank = new Rank({
    name: "left",
    cordCollection: c1
  });
  window.c1 = c1;
  var rightRank = new Rank({
    name: "right",
    cordCollection: new CordCollection([], {
      midiNotes: [53, 57, 60, 64, 67, 70, 74, 77, 79, 81]
    })
  })
  var form = new RankCollection([
    leftRank,
    rightRank
  ]);


  var movement = new window.Movement(null, {
    form: form
  });
  var movementView = new window.MovementView({
    model:movement
  });
  movementView.render();
  $("body").append(movementView.$el);

  MIDI.loadPlugin({
    soundfontUrl: "./static/soundfont/",
    instrument: "acoustic_grand_piano",
    callback: function() {
      // play the note
      MIDI.setVolume(0, 127);
    }
  });

  window.slow = 4;

  window.movement = movement;

});
