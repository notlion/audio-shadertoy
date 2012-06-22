window.SM2_DEFER = true;
requirejs.config({
  shim: {
    "backbone": {
      deps: [ "underscore", "zepto" ],
      exports: function () {
        return this.Backbone.noConflict();
      }
    },
    "underscore": {
      exports: function () {
        return this._.noConflict();
      }
    },
    "zepto": {
      exports: "Zepto"
    },
    "soundcloud": {
      deps: [ "soundmanager" ],
      exports: "SC"
    }
  },
  baseUrl: "../",
  paths: {
    "embr": "lib/embr/src/embr",
    "backbone": "lib/backbone",
    "underscore": "lib/underscore",
    "zepto": "lib/zepto",
    "soundmanager": "lib/soundmanager/soundmanager2-nodebug",
    "soundcloud": "http://connect.soundcloud.com/sdk"
  }
});
require([
  "zepto",
  "soundcloud",
  "embr",
  "src/utils",
  "src/events",
  "src/params",
  "src/selector",
  "src/views/ProgEditorView"
],
function($, SC, Embr, utils, events, params, selector, ProgEditorView){

  "use strict";

  var editor = new ProgEditorView();

  $(document.body).append(editor.el);

});
