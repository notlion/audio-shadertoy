require.config({
    paths: { "embr": "lib/embr/src" }
});
require([
    "embr/core",
    "embr/material",
    "event",
    "selector"
],
function(core, material, event, selector ){

    // UI //

    var code_text = document.getElementById("code-text");

    function initUI() {

        var code = document.getElementById("code")
          , code_toggle = document.getElementById("code-toggle")
          , code_open = false;

        function setCodeOpen(open){
            code_open = open;
            code_toggle.setAttribute("class", code_open ? "open" : "shut");
            if(code_open){
                code.style.visibility = "visible";
                code.classList.remove("shut");
            }
            else{
                event.addTransitionEndListener(code, function(e){
                    code.style.visibility = "hidden";
                }, true);
                code.classList.add("shut");
            }
        }
        code_toggle.addEventListener("click", function(e){
            setCodeOpen(!code_open);
        }, false);

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

            tryCompile();
        }, false);
        code_text.addEventListener("keypress", function(e){
            e.stopPropagation();
        }, false);
        code_text.addEventListener("mousewheel", function(e) {

            
            
            var sel = selector.get_selection(code_text.id);
            // if selection is a number, adjust value in selection
            if (!isNaN (sel.text-0)) {
                var wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
                var orig_code = code_text.value;
                var value = sel.text;
                var newValue = parseFloat(value) + wheelData;
                var front = orig_code.substr(0, sel.start);
                var end   = orig_code.substr(sel.end, orig_code.length);
                var new_code = front + newValue + end;
                code_text.value = new_code;
                selector.set_selection(code_text.id, sel.start, sel.start + (newValue+"").length );
                e.preventDefault();
                e.stopPropagation();
                tryCompile();
                return false;
            }

        }, false);

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

        source.connect(analyser);
        analyser.connect(context.destination);

        freq_data = new Uint8Array(analyser.frequencyBinCount);
    }

    function playAudioBuffer(buffer){
        source.buffer = buffer;
        source.loop = false;
        source.noteOn(0); // Play
    }


    // GFX //

    var canvas = document.getElementById("canvas");
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

    var shader_src_frag = [
        "uniform sampler2D u_frequencies;",
        "varying vec2 v_texcoord;",
        "void main(){",
            "float freq = texture2D(u_frequencies, v_texcoord).x;",
            "vec3 color = vec3(freq > v_texcoord.y) * (v_texcoord.y / freq);",
            "gl_FragColor = vec4(color, 1.);",
        "}"
    ].join("\n");

    function tryCompile(){
        try{
            var shader_src_frag = code_text.value.trim();

            program.compile(shader_src_vert, shader_src_frag);
            program.link();
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

        program = new core.Program(gl);
        tryCompile();

        plane = core.Vbo.createPlane(gl, -1, -1, 1, 1);
        program.assignLocations(plane);

        freq_texture = new core.Texture(gl);
        freq_texture.setData(analyser.frequencyBinCount, 1, freq_data, {
            format: gl.LUMINANCE,
            formati: gl.LUMINANCE
        });
    }

    function render(){
        gl.viewport(0, 0, canvas.width, canvas.height);

        window.requestAnimationFrame(render);
        analyser.smoothingTimeConstant = 0.1;
        analyser.getByteFrequencyData(freq_data);

        freq_texture.bind();
        freq_texture.updateData(freq_data);

        program.use({
            u_frequencies: 0
        });
        plane.draw();
    }

    function resize(){
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    window.addEventListener("resize", resize, false);

    initUI();
    initAudio();
    initGL();
    //loadAudioBufferUrl("test.mp3", playAudioBuffer);

    resize();

    window.requestAnimationFrame(render);

});
