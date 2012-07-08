define(function (require) {

  "use strict";

  var Backbone = require("backbone")
    , _        = require("underscore")
    , Embr     = require("embr")

    , utils = require("src/utils")

    , ProgEditorView = require("lib/prog-editor/views/ProgEditorView");


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
      var self = this
        , toy = this.model;

      this.setElement(document.getElementById("gl-canvas"));


      // Init WebGL

      Embr.setContext(getWebGLContext(this.el));

      var gl = Embr.gl;

      this.plane = new Embr.Vbo(Embr.gl.TRIANGLE_STRIP)
        .setAttr("a_position", {
          data: [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ], size: 3
        })
        .setAttr("a_texcoord", {
          data: [ 0, 0, 0, 1, 1, 0, 1, 1 ], size: 2
        });

      var tex_fmt = {
        width: toy.audio.get("num_bands"),
        height: 1,
        format: gl.LUMINANCE,
        format_internal: gl.LUMINANCE
      };
      this.eq_texture_left = new Embr.Texture(tex_fmt);
      this.eq_texture_right = new Embr.Texture(tex_fmt);

      toy.audio
        .on("change:eq_left", function (audio, eq_left) {
          self.eq_texture_left.set({ data: eq_left });
        })
        .on("change:eq_right", function (audio, eq_right) {
          self.eq_texture_right.set({ data: eq_right });
        });


      // Init Editor

      this.editor_view = new ProgEditorView({ model: toy.editor });
      this.editor_view.$el.appendTo(document.body);

      toy.editor
        .on("compile", function (program) {
          self.plane.setProg(program);
        })
        .on("change:define_pixel_scale", this.layout, this);

      toy.editor.compile();
      toy.editor.set("open", true);


      // Init Mouse

      this.mouse_pos = new Float32Array([ 0, 0 ]);

      $(document).on("mousemove", function (e) {
        self.mouse_pos[0] = e.clientX / self.el.clientWidth;
        self.mouse_pos[1] = 1 - (e.clientY / self.el.clientHeight);
      });
      $(window).on("resize", function () {
        self.layout();
      });


      // Start

      this.layout();
      this.start();
    },

    layout: function () {
      var sc = this.model.editor.get("define_pixel_scale") || 1;
      var w = this.el.width = this.el.clientWidth / sc;
      var h = this.el.height = this.el.clientHeight / sc;
      this.resolution = new Float32Array([ w, h ]);
      this.aspect = w / h;
    },

    start: function () {
      var self = this;
      (function renderLoop () {
        utils.requestAnimationFrame(renderLoop);
        self.render();
      })();
    },

    render: function () {
      var gl = Embr.gl
        , toy = this.model
        , time = (Date.now() - this.start_time) / 1000;

      gl.viewport(0, 0, this.el.width, this.el.height);

      this.eq_texture_left.bind(0);
      this.eq_texture_right.bind(1);

      toy.editor.program.use({
        amp_left:   0,
        amp_right:  1,
        aspect:     this.aspect,
        resolution: this.resolution,
        mouse:      this.mouse_pos,
        time:       toy.audio.get("time"),
        progress:   toy.audio.get("progress")
      });

      this.plane.draw();
    }

  });

  return ToyView;

});
