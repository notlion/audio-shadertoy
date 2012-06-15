requirejs.config({
  shim: {
    "zepto": {
      exports: "Zepto"
    }
  },
  paths: {
    "zepto": "/lib/zepto"
  }
});
require([
  "utils",
  "events",
  "params",
  "zepto"
],
function(utils, events, params, $){

  "use strict";

  var shader_limit = 10, shader_skip = 0;

  function getShaders(params) {
    $.ajax({
      type : "GET",
      url : "/get",
      dataType : "json",
      data : params,
      success : function(data) {
        buildShaderList(data.shaders);
      },
      error : function (err) {
        console.log("error fetching shaders.");
      }
    });
  }

  function buildShaderList(shadersArray) {
    var html = [];
    for(var i = 0; i < shadersArray.length; i++) {
      html.push([
        '<li><div class="thumb"></div>',
        '<a href="/toy/#s=' + shadersArray[i].short_id + '">',
        shadersArray[i].short_id,
        '</a></li>'].join(""));
    }
    $("#shaders").append(html.join(""));
  }

  function init() {
    getShaders({ limit : shader_limit, skip : shader_skip });
  }

  window.addEventListener("load", init);

});

/*
// index.js
$(document).ready( function() {
    getShaders({ limit : 10 });
});


var getShaders = function(params) {
  $.ajax({
    url : "/get",
    dataType : "json",
    type : "GET",
    data : params,
    success : function(data) {
      if (data.status == "OK") {
        buildShaderList(data.shaders);
      }
    },
    error : function(err) {
      console.log("error fetching blog posts");
    }
  });
}


var buildShaderList = function(shadersArray) {
  newHTML = "";
  for(i = 0; i < shadersArray.length; i++) {
    cur = shadersArray[i];
    var tmpHTML = "<li>" + cur.short_id + "</li>";
    newHTML += tmpHTML;
  }
  $("#shaders").append(newHTML);
}


var saveShader = function() {

  var shaderParams = {
    code_lzma : "test_code_lzma",
    track : {
      artist : "artist",
      title : "title",
      url : "http://",
      duration : 23492
    }
  };

  $.ajax({
    url : '/save',
    type : 'POST',
    data : shaderParams,
    dataType : 'json',
    success : function(response) {
      if (response.status == "OK") {
        console.log(response);
      }
    },
    error : function(error) {
      console.log(error);
    }
  });
}

*/