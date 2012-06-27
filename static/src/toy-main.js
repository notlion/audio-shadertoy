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
    "embr":         "lib/embr/src/embr",
    "backbone":     "lib/backbone",
    "underscore":   "lib/underscore",
    "zepto":        "lib/zepto",
    "soundmanager": "lib/soundmanager/soundmanager2-nodebug",
    "soundcloud":   "http://connect.soundcloud.com/sdk"
  }
});
require([ "src/views/ToyView" ], function (ToyView) {
  window.toy = new ToyView();
});
