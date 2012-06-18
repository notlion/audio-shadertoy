define([
  "backbone",
  "underscore",
  "src/models/ProgEditor",
  "src/models/ProgEditorButton",
  "src/views/ProgEditorButtonView"
],
function (Backbone, _, ProgEditor, ProgEditorButton, ProgEditorButtonView) {

  "use strict";

  var init_template = [
    '<textarea class="code" spellcheck="false"></textarea>',
    '<div class="ui"></div>'
  ].join("");

  var ProgEditorView = Backbone.View.extend({

    tagName: "div",
    id: "prog-editor",

    events: {
      "click .toggle-open": "toggleOpen"
    },

    initialize: function () {
      var view = this;

      this.$el.html(_.template(init_template));

      this.model = new ProgEditor()
        .on("change:src_fragment", this.render, this)
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
          toggle_open.$el.animate({
            transform: open ? "rotate(45deg)" : ""
          }, 2, "ease-in");
        });

      var toggle_open = new ProgEditorButton({
        name: "toggle-open",
        title: "Toggle Code Open",
        icon: '<path d="M -7,0 L 7,0 M 0,-7 L 0,7"/>'
      });

      var ui = this.$el.find("div.ui");

      this.buttons = new Backbone.Collection()
        .on("add", function (model) {
          ui.append(new ProgEditorButtonView({ model: model }).render().el);
        })
        .on("remove", function (model) {
          ui.remove(model.el);
        })
        .add(toggle_open);

      function onKeyDown (e) {
        e.stopPropagation();

        if(e.keyCode == 9) { // Tab
          e.preventDefault();

          var start = this.selectionStart
            , end   = this.selectionEnd;

          this.value = this.value.substring(0, start) + "  " +
                       this.value.substring(end, this.value.length);

          this.selectionStart = this.selectionEnd = start + 2;

          this.focus();
        }
      }

      function onKeyUp (e) {
        e.stopPropagation();

        if((e.keyCode >= 16 && e.keyCode <= 45) ||
           (e.keyCode >= 91 && e.keyCode <= 93))
          return;

        view.model.set("src_fragment", this.value);
      }

      this.$el.find("textarea.code")
        .on("keydown", onKeyDown)
        .on("keyup", onKeyUp);

      this.render();
    },

    toggleOpen: function () {
      this.setOpen(!this.model.get("open"));
    },

    setOpen: function (open) {
      console.log(open)
      this.model.set("open", open);
    },

    getProg: function () {
      return this.program.program;
    },

    render: function () {
      this.$el.find("textarea.code").text(this.model.get("src_fragment"));
      return this;
    }

  });

  return ProgEditorView;

});
