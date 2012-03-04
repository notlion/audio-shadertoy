require.config({
    paths: { "embr": "lib/embr/src" }
});
require([
    "embr/core",
    "embr/material"
],
function(core, material){

    var context, source, analyser, freq_data;

    function loadAudioBuffer(url, callback){
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = function(){
            callback(context.createBuffer(req.response, true));
        };
        req.send();
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

    function initGL(){
        try{
            // gl = core.util.glWrapContextWithErrorChecks(canvas.getContext("experimental-webgl"));
            gl = canvas.getContext("experimental-webgl");
        }
        catch(err){
            console.error(err);
        }

        program = new core.Program(gl);
        try{
            program.compile(shader_src_vert, shader_src_frag);
            program.link();
            console.log("Compile Successful!");
        }
        catch(err){
            console.error("Error compiling shader: " + err);
        }

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

    initAudio();
    initGL();
    loadAudioBuffer("test.mp3", function(buffer){
        source.buffer = buffer;
        source.loop = false;
        source.noteOn(0); // Play
        window.requestAnimationFrame(render);
    });

    resize();

});
