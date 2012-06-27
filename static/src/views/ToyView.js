define(function (require) {

  "use strict";

  var Backbone       = require("backbone")
    , _              = require("underscore")
    , Embr           = require("embr")
    , ProgEditorView = require("lib/prog-editor/views/ProgEditorView");


  var src_fragment_template = [
    "precision highp float;",
    "uniform sampler2D amp_left, amp_right;",
    "uniform float aspect, time, progress;",
    "uniform vec2 mouse, resolution;",
    "varying vec2 texcoord;",
    "float ampLeft(float x){",
      "return texture2D(amp_left, vec2(x, 0.)).x;",
    "}",
    "float ampRight(float x){",
      "return texture2D(amp_right, vec2(x, 0.)).x;",
    "}",
    "float rand(vec2 p){",
      "return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);",
    "}",
    "float rand(float p){",
      "return fract(sin(dot(p, 12.9898)) * 43758.5453);",
    "}",
    "#define PI 3.141592653589793",
    "#define TWOPI 6.283185307179586",
    "<%= src_fragment %>",
    "void main(){",
      "gl_FragColor = vec4(pixel(texcoord), 1.);",
    "}"
  ].join("\n");

  function getWebGLContext (canvas) {
    try {
       return canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl");
    }
    catch(err) {
      console.error(err);
    }
  }

  var ToyView = Backbone.View.extend({

    initialize: function () {
      var canvas = document.getElementById("gl-canvas");

      Embr.setContext(getWebGLContext(canvas));

      this.editor = new ProgEditorView();
      this.editor.model.set({
        src_vertex: $("#src-vertex-default").text().trim(),
        src_fragment: $("#src-fragment-default").text().trim(),
        src_fragment_template: src_fragment_template
      });
      this.editor.model.compile();

      this.editor.$el.appendTo(document.body);
    }

  });

  return ToyView;

});
