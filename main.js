require.config({
    paths: { "embr": "lib/embr/src" }
});
require([
    "embr/core",
    "embr/material",
    "event",
    "params",
    "selector"
],
function(core, material, event, params, selector){

    // UI //

    var code_text = document.getElementById("code-text");
    var code_window = null;

    function initUI(){
        var code = document.getElementById("code")
          , code_toggle = document.getElementById("code-toggle")
          , code_save = document.getElementById("code-save")
          , code_popout = document.getElementById("code-popout")
          , code_open = false
          , code_popped = false;

        function setCodeOpen(open){
            code_open = open;
            code_toggle.setAttribute("class", open ? "open" : "shut");
            if(open){
                code.style.visibility = "visible";
                code_save.style.display = "block";
                code_save.style.opacity = "1";
                code_popout.style.display = "block";
                code_popout.style.opacity = "1";                
                code.classList.remove("shut");
            }
            else{
                event.addTransitionEndListener(code, function(e){
                    code.style.visibility = "hidden";
                }, true);
                code.classList.add("shut");
                event.addTransitionEndListener(code_save, function(e){
                    code_save.style.display = "none";
                    code_popout.style.display = "none";
                }, true);
                code_save.style.opacity = "0";
                code_popout.style.opacity = "0";
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

        function setCodePoppedOut(pop){
            code_popped = pop;
            var popped_code_text = null;
            if (pop) {
                code_window = window.open("pop.html", "code_window", "width=500,height=500,scrollbars=yes ,menubar=no,location=no,left=0,top=0");
                code_window.addEventListener("load", function(){
                    popped_code_text = code_window.document.getElementById("code-text");
                    popped_code_text.value = code_text.value;
                    addCodeEventListeners(popped_code_text);
                });
                code_window.addEventListener('beforeunload', function(e) {
                    code_text.value = popped_code_text.value;
                    setCodePoppedOut(false);
                });
                code_save.style.opacity = "0";
                code_toggle.style.opacity = "0";
                code_popout.style.opacity = "0";
                document.body.removeChild(code);
            }
            else{
                code_window = false;
                code_save.style.opacity = "1";
                code_toggle.style.opacity = "1";
                code_popout.style.opacity = "1";
                document.body.appendChild(code);
            }
        }
        code_popout.addEventListener("click", function(e) {
            setCodePoppedOut(!code_popped);
        }, false);

        
        function addCodeEventListeners(code_text) {
            // Compile as you type
            code_text.addEventListener("keydown", function(e){
                e.stopPropagation();
                if(e.keyCode == 9){ // tab
                    e.preventDefault();

                    var start = code_text.selectionStart;
                    var end = code_text.selectionEnd;

                    code_text.value = code_text.value.substring(0, start) + "  " + code_text.value.substring(end, code_text.value.length);
                    code_text.selectionStart = code_text.selectionEnd = start + 2;
                    code_text.focus();
                }
            }, false);
            code_text.addEventListener("keyup", function(e){
                e.stopPropagation();

                if(e.keyCode == 37 || // left
                   e.keyCode == 38 || // up
                   e.keyCode == 39 || // right
                   e.keyCode == 40)   // down
                    return;

                tryCompile(code_text);
            }, false);
            code_text.addEventListener("keypress", function(e){
                e.stopPropagation();
            }, false);

            // Magic Number Dial / Scroll
            code_text.addEventListener("mousewheel", function(e){
                selector.scrollNumber(code_text, e.wheelDelta / 40, function(){
                    e.stopPropagation();
                    e.preventDefault();
                    tryCompile(code_text);
                });
            }, false);
        }
        addCodeEventListeners(code_text);


        // Drag and drop mp3
        document.addEventListener("dragover", function(e){
            e.stopPropagation();
            e.preventDefault();
        }, false);
        document.addEventListener("drop", function(e){
            e.stopPropagation();
            e.preventDefault();
            loadAudioBufferFile(e.dataTransfer.files[0], playAudioBuffer);
        }, false);

        // TODO: Set this via permalink
        setCodeOpen(true);
        setCodePoppedOut(false);
    }

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


    // AUDIO //

    var context, source, analyser, freq_data;

    function safeCreateAudioBuffer(buffer, callback){
        try{
            var audio_buffer = context.createBuffer(buffer, true);
            callback(audio_buffer);
        }
        catch(err){
            console.log(err);
        }
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

        source = context.createBufferSource();
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5;

        source.connect(analyser);
        analyser.connect(context.destination);

        initFrequencyData();
    }

    function playAudioBuffer(buffer){
        source.buffer = buffer;
        source.loop = true;
        source.noteOn(0); // Play
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

    function tryCompile(code_text){
        try{
            var shader_src_frag = code_text.value.trim();

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

            code_text.classList.remove("error");

            console.log("Compile Successful!");
        }
        catch(err){
            code_text.classList.add("error");
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

    var start_time = Date.now();

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
