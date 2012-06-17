window.SM2_DEFER = true;
requirejs.config({
  shim: {
    "zepto": {
      exports: "Zepto"
    },
    "soundcloud": {
      deps: [ "soundmanager" ],
      exports: "SC"
    }
  },
  paths: {
    "utils": "../lib/utils",
    "events": "../lib/events",
    "params": "../lib/params",
    "selector": "../lib/selector",
    "embr": "../lib/embr/src/embr",
    "zepto": "../lib/zepto",
    "soundcloud": "http://connect.soundcloud.com/sdk",
    "soundmanager": "../lib/soundmanager/soundmanager2-nodebug"
  }
});
require([
  "utils",
  "events",
  "params",
  "selector",
  "embr",
  "soundcloud",
  "zepto"
],
function(utils, events, params, selector, Embr, SC, $){

  "use strict";

  // UI //

  var code_text = document.getElementById("code-text")
    , save_dialog = document.getElementById("save-dialog")
    , save_dialog_link = document.getElementById("save-dialog-link")
    , save_dialog_save = document.getElementById("save-dialog-save")
    , save_scrim = document.getElementById("save-scrim")
    , canvas_thumbed = false
    , canvas_thumb_size = 256;

  function initUI(){
    var code = document.getElementById("code")
      , code_toggle = document.getElementById("code-toggle")
      , code_save = document.getElementById("code-save")
      , code_save_indicator = document.getElementById("code-save-indicator")
      , code_popout = document.getElementById("code-popout")
      , code_tooltip = $("#code-tooltip > p")
      , code_window = null
      , popped_code_text = null
      , code_open = false
      , code_popped = false;

    function setCodeOpen(open){
      if(open !== code_open){
        code_open = open;
        code_toggle.setAttribute("class", open ? "open" : "shut");
        if(open){
          code.style.visibility = "visible";
          code_save.style.display = "block";
          code_save.style.opacity = "1";
          code_popout.style.display = "block";
          code_popout.style.opacity = "1";
          code.classList.remove("shut");
          setCodePoppedOut(false);
        }
        else{
          events.addTransitionEndListener(code, function(e){
            code.style.visibility = "hidden";
          }, true);
          code.classList.add("shut");
          events.addTransitionEndListener(code_save, function(e){
            code_save.style.display = "none";
          }, true);
          code_save.style.opacity = "0";
          events.addTransitionEndListener(code_popout, function(e){
            code_popout.style.display = "none";
          }, true);
          code_popout.style.opacity = "0";
        }
      }
    }
    code_toggle.addEventListener("click", function(e){
      setCodeOpen(!code_open);
    }, false);

    function setCodeEdited(edited){
      if(edited === undefined)
        edited = true;
      code_save_indicator.setAttribute("class", edited ? "on" : "");
    }

    function saveCode(){
      params.lzmaCompress(code_text.value.trim(), 1, function(src_compressed){
        params.saveUrlHash({
          "fs": src_compressed
        });
        save_dialog_link.value = window.location;
        canvas_thumbed = true;
        layoutUI(true);
        setCodeEdited(false);
      });
    }
    code_save.addEventListener("click", saveCode, false);

    function setCodePoppedOut(popped){
      if(popped !== code_popped){
        code_popped = popped;
        if(popped){ // Pop
          var opts = "width=700,height=500,left=50,top=50," +
                     "scrollbars=yes,menubar=no,location=no";
          code_window = window.open("pop.html", "code-window", opts);
          code_window.addEventListener("load", onCodeWindowLoad);
          code_window.addEventListener("beforeunload", onCodeWindowUnload);
        }
        else{ // Unpop
          if(code_window){
            code_window.close();
            code_window = null;
          }
        }
        setCodeOpen(!popped);
      }
    }
    code_popout.addEventListener("click", function(e){
      setCodePoppedOut(!code_popped);
    }, false);
    function onCodeWindowLoad(){
      popped_code_text = code_window.document.getElementById("code-text");
      popped_code_text.value = code_text.value;
      addCodeEventListeners(popped_code_text);
    }
    function onCodeWindowUnload(){
      code_text.value = popped_code_text.value;
      setCodePoppedOut(false);
    }

    $("#code-ui > svg")
      .on("mouseover", function(){
        code_tooltip.text(this.getAttribute("title"));
      })
      .on("mouseout", function(){
        code_tooltip.text("");
      });

    function addCodeEventListeners(textarea){
      // Compile as you type
      textarea.addEventListener("keydown", function(e){
        e.stopPropagation();
        if(e.keyCode == 9){ // tab
          e.preventDefault();

          var start = textarea.selectionStart;
          var end = textarea.selectionEnd;

          textarea.value = textarea.value.substring(0, start) + "  " +
                           textarea.value.substring(end, textarea.value.length);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          textarea.focus();
        }
      }, false);
      textarea.addEventListener("keyup", function(e){
        e.stopPropagation();

        if((e.keyCode >= 16 && e.keyCode <= 45) ||
           (e.keyCode >= 91 && e.keyCode <= 93))
          return;

        setCodeEdited();

        tryCompile(textarea);
      }, false);
      textarea.addEventListener("keypress", function(e){
        e.stopPropagation();
      }, false);
      textarea.addEventListener("paste", function(e){
        setCodeEdited();
        setTimeout(function(){
          tryCompile(textarea);
        }, 0);
      }, false);

      // Magic Number Dial / Scroll
      textarea.addEventListener("mousewheel", function(e){
        selector.scrollNumber(textarea, e.wheelDelta / 40, function(){
          e.stopPropagation();
          e.preventDefault();
          tryCompile(textarea);
        });
      }, false);
    }
    addCodeEventListeners(code_text);

    function setCanvasThumbed(thumbed){
      if(thumbed !== canvas_thumbed) {
        canvas_thumbed = thumbed;
        layoutUI(true);
      }
    }
    save_scrim.addEventListener("click", function(e){
      setCanvasThumbed(false);
    }, false);

    window.addEventListener("resize", function(){
      layoutUI();
    }, false);

    // TODO: Set this via permalink
    setCodeOpen(true);
    setCodePoppedOut(false);
  }

  function updateCanvasRes(){
    var scale = canvas_thumbed ? 1 : 1 / canvas_pixel_scale;
    canvas.width = Math.floor(canvas.clientWidth * scale);
    canvas.height = Math.floor(canvas.clientHeight * scale);
  }

  function layoutUI(animate){
    var canvas_sel = $(canvas)
      , canvas_off = canvas_sel.offset()
      , canvas_props
      , save_dialog_sel = $(save_dialog)
      , duration = animate ? 250 : 0, ease = "ease-out", padding = 24;

    if(canvas_thumbed) {
      canvas_props = {
        left: (window.innerWidth - canvas_thumb_size) / 2,
        top: (window.innerHeight - canvas_thumb_size + save_dialog.offsetHeight + padding) / 2,
        width: canvas_thumb_size,
        height: canvas_thumb_size
      };
      save_dialog.classList.remove("shut");
      save_scrim.classList.remove("shut");
    }
    else {
      canvas_props = {
        left: 0, top: 0, width: window.innerWidth, height: window.innerHeight
      };
      save_scrim.classList.add("shut");
    }

    canvas_sel.animate(canvas_props, duration, ease, updateCanvasRes);

    save_dialog_sel.animate({
      left: (window.innerWidth - save_dialog.offsetWidth) / 2,
      top: canvas_props.top - (save_dialog.offsetHeight + padding)
    }, duration, ease, function(){
      if(!canvas_thumbed)
        save_dialog.classList.add("shut");
    });
  }


  // SAVE //

  var code_dialog_save = document.getElementById("button-save");

  function postCode(){
    // get lzma compressed
    params.lzmaCompress(code_text.value.trim(), 1, function(code_lzma){

      var shader_data = {
        code_lzma : code_lzma,
        img : canvas.toDataURL()
      };

      if(sc_playing_track){
        shader_data.track = {
          artist : sc_playing_track.artist,
          title : sc_playing_track.title,
          url : sc_playing_track.url,
          genre : sc_playing_track.genre,
          duration : sc_playing_track.duration
        }
      }

      $.ajax({
        type: "post",
        url: "/save",
        data: shader_data,
        dataType: "json",
        success: function(res){
          window.location = '#s=' + res.shader.short_id;
          save_dialog_link.value = window.location;
        },
        error: function(err){
          console.error("POST failed.");
        }
      });
    });
  }

  function initSave(){
    save_dialog_save.addEventListener("click", postCode, false);
  }


  // MOUSE //

  var mouse_move_enabled = false;
  var mouse_pos = new Float32Array([ 0, 0 ]);

  function onMouseMove(e){
    mouse_pos[0] = e.clientX / canvas.clientWidth;
    mouse_pos[1] = 1 - (e.clientY / canvas.clientHeight);
  }
  function setMouseMoveEnabled(enabled){
    if(enabled != mouse_move_enabled){
      mouse_move_enabled = enabled;
      if(enabled)
        document.addEventListener("mousemove", onMouseMove);
      else
        document.removeEventListener("mousemove", onMouseMove);
    }
  }


  // TIME //

  var start_time;

  function initTime(){
    start_time = Date.now();
  }


  // AUDIO //

  var eq_data_left, eq_data_right;

  function initAudio(){
    initSoundCloud();
    initFrequencyData(256);
  }

  function initFrequencyData(num_bands){
    var fmt = {
      width: num_bands, height: 1,
      format: gl.LUMINANCE, format_internal: gl.LUMINANCE
    };
    eq_data_left = new Uint8Array(num_bands);
    eq_data_right = new Uint8Array(num_bands);
    eq_texture_left.set(fmt).set({ data: eq_data_left });
    eq_texture_right.set(fmt).set({ data: eq_data_right });
  }


  // SOUNDCLOUD //

  var sc_url_prefix = "http://soundcloud.com/"
    , sc_last_url_loaded, sc_last_url_played, sc_playing_track;

  var soundManager
    , sm_playing_sound = null
    , sm_options = {
        useEQData: true,
        autoPlay: true,
        multiShot: false
      };

  var eq_mix = 0.25;

  function initSoundCloud(){
    soundManager = window.soundManager = new SoundManager();
    soundManager.url = "/lib/soundmanager/";
    soundManager.flashVersion = 9;
    soundManager.preferFlash = true;
    soundManager.useHTML5Audio = false;
    soundManager.useHighPerformance = true;
    soundManager.beginDelayedInit();
    SC.initialize({ client_id: "0edc2b5846f860f3aa21148493e30a8f" });
  }

  function loadSoundCloudTrack(url){
    if(url == sc_last_url_loaded || url == sc_last_url_played)
      return;

    sc_last_url_loaded = url;

    SC.post("/resolve.json", { url: url }, function(res, err){
      if(err) {
        console.error("Could not find track: %s", err.message);
      }
      else if(url == sc_last_url_loaded) {
        playSoundCloudTrack(res);
        sc_last_url_played = url;
      }
    });
  }

  function onSoundCloudStreamReady(sound){
    if(sm_playing_sound)
      sm_playing_sound.stop();
    sm_playing_sound = sound;
    initTime();
  }

  function playSoundCloudTrack(track){
    sc_playing_track = {
      "url":      track.permalink_url,
      "artist":   track.user.username,
      "title":    track.title,
      "genre":    track.genre,
      "duration": track.duration
    }
    SC.stream(track.uri, sm_options, onSoundCloudStreamReady);
  }


  // GFX //

  var canvas = document.getElementById("gl-canvas")
    , canvas_pixel_scale = 2;
  var gl, program, plane
    , eq_texture_left, eq_texture_right;

  var shader_src_vert = [
    "attribute vec3 a_position;",
    "attribute vec2 a_texcoord;",
    "varying vec2 texcoord;",
    "void main(){",
      "texcoord = a_texcoord;",
      "gl_Position = vec4(a_position, 1.);",
    "}"
  ].join("\n");

  var shader_outlet_re = /^[ \t]*#define[ \t]+([\w_]*)[ \t]+(\S+)/gm;

  function parseShaderOutlets(src, callbacks){
    var match, i, name, value;
    while(match = shader_outlet_re.exec(src)){
      for(i = 1; i < match.length; i += 2){
        name = match[i].toLowerCase();
        if(callbacks[name]){
          value = match[i + 1];
          callbacks[name](value);
        }
      }
    }
  }

  var shader_src_prefix = "precision highp float;\n";

  function tryCompile(textarea){
    try{
      var shader_src_frag = textarea.value.trim();

      parseShaderOutlets(shader_src_frag, {
        "smoothing": function(value){
          value = 1 - value;
          if(!isNaN(value))
            eq_mix = utils.clamp(value, 0, 1);
        },
        "pixel_scale": function(value){
          value = Math.floor(+value);
          if(!isNaN(value)){
            canvas_pixel_scale = value;
            updateCanvasRes();
          }
        },
        "track": function(value){
          if(value.slice(0, sc_url_prefix.length) == sc_url_prefix)
            loadSoundCloudTrack(value);
        }
      });

      program.compile(shader_src_vert, shader_src_prefix + shader_src_frag);
      program.link();

      plane.setProg(program);

      setMouseMoveEnabled(!!program.uniforms.mouse);

      textarea.classList.remove("error");

      console.log("Compile Successful!");
    }
    catch(err){
      textarea.classList.add("error");
      console.error("Error compiling shader: " + err);
    }
  }

  function initGL(){
    try{
      var webgl_opts = {
        preserveDrawingBuffer: true
      };
      gl = canvas.getContext("webgl", webgl_opts) ||
           canvas.getContext("experimental-webgl", webgl_opts);
      // gl = Embr.wrapContextWithErrorChecks(gl);

      Embr.setContext(gl);
    }
    catch(err){
      console.error(err);
      return;
    }

    var positions = [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ];
    var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
    plane = new Embr.Vbo(gl.TRIANGLE_STRIP)
      .setAttr("a_position", { data: positions, size: 3 })
      .setAttr("a_texcoord", { data: texcoords, size: 2 });

    program = new Embr.Program();
    eq_texture_left = new Embr.Texture();
    eq_texture_right = new Embr.Texture();
  }

  function render(){
    gl.viewport(0, 0, canvas.width, canvas.height);

    utils.requestAnimationFrame(render);

    var progress = 0;

    if(sm_playing_sound){
      var i, amp_l, amp_r;
      for(var i = 0; i < 256; ++i) {
        amp_l = sm_playing_sound.eqData.left[i] * 255;
        amp_r = sm_playing_sound.eqData.right[i] * 255;
        eq_data_left[i] += (amp_l - eq_data_left[i]) * eq_mix;
        eq_data_right[i] += (amp_r - eq_data_right[i]) * eq_mix;
      }
      eq_texture_left.bind(0);
      eq_texture_left.set({ data: eq_data_left });
      eq_texture_right.bind(1);
      eq_texture_right.set({ data: eq_data_right });
      progress = sm_playing_sound.position / sm_playing_sound.durationEstimate;
    }

    program.use({
      amp_left: 0,
      amp_right: 1,
      aspect: canvas.width / canvas.height,
      mouse: mouse_pos,
      time: (Date.now() - start_time) / 1000,
      progress: progress
    });
    plane.draw();
  }

  function init(){
    initSave();
    initUI();
    initGL();
    initAudio();
    layoutUI();
    initTime();

    var hash_exists = false;

    params.loadUrlHash({
      "fs": function(hex){
        params.lzmaDecompress(hex, function(src){
          code_text.value = src;
          tryCompile(code_text);
        });
        hash_exists = true;
      },
      "s": function(id){
        $.ajax({
          type: "GET",
          url: "/short/" + id,
          dataType: "json",
          success: function(res){
            params.lzmaDecompress(res.shader.code_lzma, function(src){
              code_text.value = src;
              tryCompile(code_text);
            });
          }
        });
        hash_exists = true;
      }
    });

    if(!hash_exists){
      tryCompile(code_text);
    }

    utils.requestAnimationFrame(render);
  }

  window.addEventListener("load", init);

});
