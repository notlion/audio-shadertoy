define([
  "backbone"
],
function (Backbone) {

  "use strict";

  var ProgEditorButton = Backbone.Model.extend({

    defaults: {
      size: 30,
      radius: 13,
      icon: ""
    }

  });

  ProgEditorButton.Collection = Backbone.Collection.extend({
    model: ProgEditorButton
  });

  return ProgEditorButton;

});
