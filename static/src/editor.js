define([
  "backbone",
  "zepto",
  "models/Program"
],
function (Backbone, $, Program) {

  var editor_template = [
    '<div id=<%= model.id %>>',
      '<textarea class="code" spellcheck="false">',
        '<%= prog.src_fragment %>',
      '</textarea>',
    '</div>'
  ].join("");

  var ProgEditorModel = Backbone.Model.extend({
    defaults: {
      id: "prog-editor",
      open: false
    }
  });

  var ProgEditorView = Backbone.View.extend({

    initialize: function () {
      this.model = new ProgEditorModel();
      this.program = new Program();
      this.render();
    },

    render: function () {
      this.$el.html(_.template(editor_template, {
        model:   this.model.toJSON(),
        program: this.program.toJSON()
      }));
      return this;
    }

  });

});
