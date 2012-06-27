define(function (require) {

  "use strict";

  var Backbone             = require("backbone")
    , _                    = require("underscore")
    , ProgEditor           = require("src/models/ProgEditor")
    , ProgEditorButton     = require("src/models/ProgEditorButton")
    , ProgEditorButtonView = require("src/views/ProgEditorButtonView");


  var init_template = [
    '<div class="code-container" style="visibility:hidden;opacity:0">',
      '<textarea class="code" spellcheck="false"></textarea>',
    '</div>',
    '<div class="ui"></div>'
  ].join("");

  var ProgEditorView = Backbone.View.extend({

    tagName: "div",
    id: "prog-editor",

    events: {
      "click .toggle-open": "toggleOpen",
      "keydown .code":      "keyDown",
      "keyup .code":        "keyUp"
    },

    initialize: function () {
      var view = this;

      if(!this.model)
        this.model = new ProgEditor();

      this.model
        .on("change:src_fragment", this.updateCode, this)
        .on("change:compiled", function (model, compiled) {
          if(compiled)
            view.$el.removeClass("error");
          else
            view.$el.addClass("error");
        })
        .on("change:error", function (model, error) {
          console.error(error);
        })
        .on("change:open", function (model, open) {
          var d = 200, e = "ease";
          view.$el.find(".toggle-open .rotate").animate({
            rotate: open ? "45deg" : "0"
          }, d, e);
          view.$el.find(".code-container").animate({
            opacity: open ? 1 : 0
          }, d, e, function(){
            $(this).css("visibility", open ? "visible" : "hidden");
          });
        });

      this.render();
    },

    keyDown: function (e) {
      e.stopPropagation();

      if(e.keyCode == 9) { // Tab
        e.preventDefault();

        var ta    = e.target
          , start = ta.selectionStart
          , end   = ta.selectionEnd;

        ta.value = ta.value.substring(0, start) + "  " +
                   ta.value.substring(end, ta.value.length);

        ta.selectionStart = ta.selectionEnd = start + 2;

        ta.focus();
      }
    },

    keyUp: function (e) {
      e.stopPropagation();

      if((e.keyCode >= 16 && e.keyCode <= 45) ||
         (e.keyCode >= 91 && e.keyCode <= 93))
        return;

      this.model.set("src_fragment", e.target.value);
    },

    toggleOpen: function () {
      this.setOpen(!this.model.get("open"));
    },

    setOpen: function (open) {
      this.model.set("open", open);
    },

    getProg: function () {
      return this.program.program;
    },

    updateCode: function () {
      this.$el.find(".code").text(this.model.get("src_fragment"));
      return this;
    },

    render: function () {
      this.$el.html(_.template(init_template));
      this.model.buttons.each(function (b) {
        this.append(new ProgEditorButtonView({ model: b }).render().el)
      }, this.$el.find(".ui"));
      this.updateCode();
    }

  });

  return ProgEditorView;

});
