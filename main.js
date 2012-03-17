require.config({
    paths: {
        "embr" : "lib/embr/src",
        "dat" : "lib/dat-gui/src/dat",
        "text" : "lib/embr/src/lib/text"
    }
});
require([
    "embr/core",
    "embr/material",
    "dat/gui/GUI",
    "event",
    "params",
    "selector",
    "demo"
],
function(core, material, datgui, event, params, selector, demo){

    // UI //

    var code_text = document.getElementById("code-text")
      , popped_code_text = null
      , code_window = null;

    var gui = null;

    function initUI(){
        var code = document.getElementById("code")
          , code_toggle = document.getElementById("code-toggle")
          , code_save = document.getElementById("code-save")
          , code_popout = document.getElementById("code-popout")
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
                    code_window = window.open("pop.html", "code-window", "width=700,height=500,scrollbars=yes,menubar=no,location=no,left=50,top=50");
                    code_window.addEventListener("load", onCodeWindowLoad);
                    code_window.addEventListener("beforeunload", onCodeWindowUnload);
                }
                else{ // Unpop
                    if(code_window){
                        code_window.close();
                        code_window = null;
                        popped_code_text = null;
                        createGuiFromTextArea(code_text);
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
            code_toggle.style.display = "none";
            createGuiFromTextArea(popped_code_text);
            addCodeEventListeners(popped_code_text);
        }
        function onCodeWindowUnload(){
            code_text.value = popped_code_text.value;
            code_toggle.style.display = "block";
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

                    textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end, textarea.value.length);
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                    textarea.focus();
                }
            }, false);
            textarea.addEventListener("keyup", function(e){
                e.stopPropagation();

                if(e.keyCode == 37 || // left
                   e.keyCode == 38 || // up
                   e.keyCode == 39 || // right
                   e.keyCode == 40)   // down
                    return;

                tryCompile(textarea);
                createGuiFromTextArea(code_text);
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
        mouse_pos.set(e.clientX / canvas.clientWidth, 1 - (e.clientY / canvas.clientHeight));
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
        loadNextDemoShader();
        playlist_pos = (playlist_pos + 1) % playlist.length;
    }

    function loadNextDemoShader(){
        params.lzmaDecompress(demo.random(), function(src){
            var textarea = popped_code_text || code_text;
            textarea.value = src;
            tryCompile(textarea);
            createGuiFromTextArea(textarea);
        });
    }
    document.addEventListener("keydown", function(e){
        if(e.keyCode == 39)
            loadNextDemoShader();
    });


    // AUDIO //

    var context, source, analyser, freq_data, buffer_complete_cb;

    function safeCreateAudioBuffer(buffer, callback){
        context.decodeAudioData(buffer, callback, onCreateAudioBufferError);
    }
    function onCreateAudioBufferError(err){
        console.error(err);
    }

    function loadAudioBufferUrl(url, callback){
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = function(){
            safeCreateAudioBuffer(req.response, callback);
        };
        req.send();
    }
    function loadAudioBufferFile(file, callback){
        var reader = new FileReader();
        reader.onload = function(){
            safeCreateAudioBuffer(reader.result, callback);
        };
        reader.readAsArrayBuffer(file);
    }

    function initAudio(){
        context = new webkitAudioContext();

        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5;
        analyser.connect(context.destination);

        initFrequencyData();
    }

    function playAudioBuffer(buffer){
        if(source)
            source.noteOff(0);

        source = context.createBufferSource();
        source.connect(analyser);
        source.buffer = buffer;
        source.loop = false;
        source.noteOn(0); // Play

        // Janky timeout yes, but apparently it's the only way for now
        window.clearTimeout(buffer_complete_cb);
        buffer_complete_cb = window.setTimeout(onAudioBufferComplete, buffer.duration * 1000);
    }

    function onAudioBufferComplete(){
        buffer_complete_cb = null;
        playlistNext();
        playlistPlay();
    }

    function initFrequencyData(){
        freq_data = new Uint8Array(analyser.frequencyBinCount);
        freq_texture.setData(analyser.frequencyBinCount, 1, freq_data, {
            format: gl.LUMINANCE,
            formati: gl.LUMINANCE
        });
    }


    // GFX //

    var canvas = document.getElementById("canvas")
      , canvas_pixel_scale = 2;
    var gl, program, freq_texture, plane;

    var shader_src_vert = [
        "attribute vec3 position;",
        "attribute vec2 texcoord;",
        "varying vec2 v_texcoord;",
        "void main(){",
            "v_texcoord = texcoord;",
            "gl_Position = vec4(position, 1.);",
        "}"
    ].join("\n");

    var shader_outlet_re = /^[ \t]*#define[ \t]+([\w_]*)[ \t]+([\d\.\d]+)/gm;

    function parseShaderOutlets(src, callbacks){
        var match, i, name, value;
        while(match = shader_outlet_re.exec(src)){
            for(i = 1; i < match.length; i += 2){
                name = match[i].toLowerCase();
                value = +match[i + 1];
                if(!isNaN(value) && callbacks[name])
                    callbacks[name](value);
            }
        }
    }

    function createGuiFromTextArea(textarea) {

        var code_text = textarea.value;

        if (gui) gui.destroy();
        gui = code_window ? code_window.gui() : new datgui();

        // match all floats
        var re = /\d*\.\d+|\d+\.\d*/g, m, matches = [];
        while((m = re.exec(code_text)) !== null){
            matches.push({
                 value : m[0],
                 index : m.index
            });
        }

        // assign float values to sliders
        matches.forEach(function(m, i) {
            var val = parseFloat(m.value);
            var obj = { value : parseFloat(m.value) };
            var slider = gui.add(obj, 'value', val - (val+10), val + (val+10));
            slider.onChange(function(v){
                selector.setSelection(textarea, m.index, m.index + m.value.length);
                m.value = selector.changeFloatNumber(textarea, v);
                tryCompile(textarea);
            });
            slider.onFinishChange(function(v){});
        });
    }

    function tryCompile(textarea){
        try{
            var shader_src_frag = textarea.value.trim();

            parseShaderOutlets(shader_src_frag, {
                "smoothing": function(value){
                    analyser.smoothingTimeConstant = core.math.clamp(value, 0, 1);
                },
                "num_bands": function(value){
                    if(core.math.isPow2(value)){
                        analyser.fftSize = value * 2;
                        initFrequencyData();
                    }
                },
                "pixel_scale": function(value){
                    if(Math.floor(value) == value){
                        canvas_pixel_scale = value;
                        resize();
                    }
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
            // gl = core.util.glWrapContextWithErrorChecks(canvas.getContext("experimental-webgl"));
            gl = canvas.getContext("experimental-webgl");
        }
        catch(err){
            console.error(err);
        }

        plane = core.Vbo.createPlane(gl, -1, -1, 1, 1);

        program = new core.Program(gl);
        freq_texture = new core.Texture(gl);
    }

    function render(){
        gl.viewport(0, 0, canvas.width, canvas.height);

        window.requestAnimationFrame(render);
        analyser.getByteFrequencyData(freq_data);

        freq_texture.bind();
        freq_texture.updateData(freq_data);

        program.use({
            u_frequencies: 0,
            u_aspect: canvas.width / canvas.height,
            u_mouse: mouse_pos,
            u_time: (Date.now() - start_time) / 1000
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
    createGuiFromTextArea(code_text);

    var start_time = Date.now();

    params.loadUrlHash({
        "fs": function(hex){
            params.lzmaDecompress(hex, function(src){
                code_text.value = src;
                tryCompile(code_text);
                createGuiFromTextArea(code_text);
            });
        }
    });

    window.requestAnimationFrame(render);

});
