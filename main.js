require.config({
  paths: { "embr": "lib/embr/src" }
});
require([
  "embr/core",
  "embr/material",
  "event",
  "params",
  "selector",
  "lib/soundmanager/soundmanager2-nodebug"
],
function(core, material, event, params, selector){

  // UI //

  var code_text = document.getElementById("code-text");

  function initUI(){
    var code = document.getElementById("code")
      , code_toggle = document.getElementById("code-toggle")
      , code_save = document.getElementById("code-save")
      , code_popout = document.getElementById("code-popout")
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
          event.addTransitionEndListener(code, function(e){
            code.style.visibility = "hidden";
          }, true);
          code.classList.add("shut");
          event.addTransitionEndListener(code_save, function(e){
            code_save.style.display = "none";
          }, true);
          code_save.style.opacity = "0";
          event.addTransitionEndListener(code_popout, function(e){
            code_popout.style.display = "none";
          }, true);
          code_popout.style.opacity = "0";
        }
      }
    }
    code_toggle.addEventListener("click", function(e){
      setCodeOpen(!code_open);
    }, false);

    function saveCode(){
      params.lzmaCompress(code_text.value.trim(), 1, function(src_compressed){
        params.saveUrlHash({
          "fs": src_compressed
        });
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

        tryCompile(textarea);
      }, false);
      textarea.addEventListener("keypress", function(e){
        e.stopPropagation();
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

    // DRAG AND DROP //

    document.addEventListener("dragover", function(e){
      e.stopPropagation();
      e.preventDefault();
    }, false);
    document.addEventListener("drop", function(e){
      e.stopPropagation();
      e.preventDefault();
      clearPlaylist();
      for(var i = 0; i < e.dataTransfer.files.length; ++i){
        playlistEnqueueFile(e.dataTransfer.files[i]);
      }
      playlistPlay();
    }, false);

    // TODO: Set this via permalink
    setCodeOpen(true);
    setCodePoppedOut(false);
  }


  // MOUSE //

  var mouse_move_enabled = false;
  var mouse_pos = new core.Vec2(0, 0);

  function onMouseMove(e){
    mouse_pos.set(
      e.clientX / canvas.clientWidth, 1 - (e.clientY / canvas.clientHeight)
    );
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


  // PLAYLIST //

  var playlist, playlist_pos;

  function clearPlaylist(){
    playlist = [];
    playlist_pos = 0;
  }
  function playlistEnqueueFile(file){
    if(!playlist)
      clearPlaylist();
    playlist.push(file);
  }
  function playlistPlay(){
    loadAudioBufferFile(playlist[playlist_pos], playAudioBuffer);
  }
  function playlistNext(){
    playlist_pos = (playlist_pos + 1) % playlist.length;
  }


  // AUDIO //

  var eq_data_left, eq_data_right;

  function initAudio(){
    initSoundCloud();
    initFrequencyData(256);
  }

  function initFrequencyData(num_bands){
    var fmt = { format: gl.LUMINANCE, formati: gl.LUMINANCE };
    eq_data_left = new Uint8Array(num_bands);
    eq_data_right = new Uint8Array(num_bands);
    eq_texture_left.setData(num_bands, 1, eq_data_left, fmt);
    eq_texture_right.setData(num_bands, 1, eq_data_right, fmt);
  }


  // SOUNDCLOUD //

  var sc_url_prefix = "http://soundcloud.com/"
    , sc_last_url_loaded, sc_last_url_played;

  var sm_playing_sound = null;
  var sm_options = {
    useEQData: true,
    autoPlay: true,
    multiShot: false
  };

  var eq_mix = 0.25;

  function initSoundCloud(){
    soundManager.url = "lib/soundmanager/";
    soundManager.flashVersion = 9;
    soundManager.useHighPerformance = true;
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
      else {
        playSoundCloudTrack(res.uri);
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

  function playSoundCloudTrack(uri){
    SC.stream(uri, sm_options, onSoundCloudStreamReady);
  }


  // GFX //

  var canvas = document.getElementById("canvas")
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

  function tryCompile(textarea){
    try{
      var shader_src_frag = textarea.value.trim();

      parseShaderOutlets(shader_src_frag, {
        "smoothing": function(value){
          value = 1 - value;
          if(!isNaN(value))
            eq_mix = core.math.clamp(value, 0, 1);
        },
        "pixel_scale": function(value){
          value = Math.floor(+value);
          if(!isNaN(value)){
            canvas_pixel_scale = value;
            resize();
          }
        },
        "track": function(value){
          if(value.slice(0, sc_url_prefix.length) == sc_url_prefix)
            loadSoundCloudTrack(value);
        }
      });

      program.compile(shader_src_vert, shader_src_frag);
      program.link();
      program.assignLocations(plane);

      setMouseMoveEnabled(!!program.uniforms.u_mouse);

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
      gl = canvas.getContext("experimental-webgl");
      // gl = core.util.glWrapContextWithErrorChecks(gl);
    }
    catch(err){
      console.error(err);
    }

    var positions = [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ];
    var texcoords = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
    plane = new core.Vbo(gl, gl.TRIANGLE_STRIP, gl.STATIC_DRAW, {
      a_position: { data: positions, size: 3 },
      a_texcoord: { data: texcoords, size: 2 }
    });

    program = new core.Program(gl);
    eq_texture_left = new core.Texture(gl);
    eq_texture_right = new core.Texture(gl);
  }

  function render(){
    gl.viewport(0, 0, canvas.width, canvas.height);

    window.requestAnimationFrame(render);

    if(sm_playing_sound){
      var i, amp_l, amp_r;
      for(var i = 0; i < 256; ++i) {
        amp_l = sm_playing_sound.eqData.left[i] * 255;
        amp_r = sm_playing_sound.eqData.right[i] * 255;
        eq_data_left[i] = core.math.lerp(eq_data_left[i], amp_l, eq_mix);
        eq_data_right[i] = core.math.lerp(eq_data_right[i], amp_r, eq_mix);
      }
      eq_texture_left.bind(0);
      eq_texture_left.updateData(eq_data_left);
      eq_texture_right.bind(1);
      eq_texture_right.updateData(eq_data_right);
    }

    program.use({
      amp_left: 0,
      amp_right: 1,
      aspect: canvas.width / canvas.height,
      mouse: mouse_pos,
      time: (Date.now() - start_time) / 1000
    });
    plane.draw();
  }

  function resize(){
    canvas.width = Math.floor(canvas.clientWidth / canvas_pixel_scale);
    canvas.height = Math.floor(canvas.clientHeight / canvas_pixel_scale);
  }
  window.addEventListener("resize", resize, false);

  initUI();
  initGL();
  initAudio();
  resize();
  tryCompile(code_text);
  initTime();

  params.loadUrlHash({
    "fs": function(hex){
      params.lzmaDecompress(hex, function(src){
        code_text.value = src;
        tryCompile(code_text);
      });
    }
  });

  window.requestAnimationFrame(render);

});
