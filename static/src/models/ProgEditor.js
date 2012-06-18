define([
  "backbone",
  "underscore",
  "embr"
],
function (Backbone, _, Embr) {

  "use strict";

  var src_fragment_prefix = [
    "precision highp float;\n"
  ].join("/n");

  var shader_outlet_re = /^[ \t]*#define[ \t]+([\w_]*)[ \t]+(\S+)/gm;

  function extractShaderDefines (src) {
    var match, i, defines = {};
    while(match = shader_outlet_re.exec(src)) {
      for(i = 1; i < match.length; i += 2)
        defines[match[i].toLowerCase()] = match[i + 1];
    }
    return defines;
  }

  var Program = Backbone.Model.extend({

    defaults: {
      open: false,
      src_vertex: "",
      src_fragment: ""
    },

    initialize: function () {
      this.program = new Embr.Program();
      this.on("change:src_vertex change:src_fragment", this.compile, this);
      this.compile();
    },

    compile: function () {
      var vs = this.get("src_vertex")
        , fs = this.get("src_fragment");

      if(vs && fs) {
        _.each(extractShaderDefines(fs), function (value, name) {
          if(!_.isNumber(value))
            value = +value;
          this.set("define_" + name, value);
        }, this);

        try {
          this.program.compile(vs, src_fragment_prefix + fs);
          this.program.link();

          this.set("compiled", true);
        }
        catch(err) {
          this.set("error", err.toString());
          this.set("compiled", false);
        }
      }
    }

  });

  return Program;

});
