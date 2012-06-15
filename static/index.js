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
  "zepto"
],
function($){

  "use strict";

  var loading = false,
      limit = 10,
      skip = 0;

  function init() {
    getMore();
  }

  function onWindowScroll() {
    if ($(document).height() - window.pageYOffset - window.innerHeight <= 0 &&
        !loading) {
      getMore();
    }
  }

  function getMore() {
    $("loader").show();
    getShaders({ limit : limit, skip : skip }, function(shaders) {
      $("loader").hide();
      skip += limit;
      appendShaderList(shaders);
    });
  }

  function getShaders(params, callback) {
    loading = true;
    $.ajax({
      type : "GET",
      url : "/get",
      dataType : "json",
      data : params,
      success : function(data) {
        loading = false;
        callback(data.shaders);
      },
      error : function (err) {
        console.log("error fetching shaders.");
      }
    });
  }

  function appendShaderList(shadersArray) {
    var html = [];
    for(var i = 0; i < shadersArray.length; i++) {
      html.push([
        '<li><div class="thumb">',
        '<img src="' + shadersArray[i].img + '">',
        '</div>',
        '<a href="/toy/#s=' + shadersArray[i].short_id + '">',
        shadersArray[i].short_id,
        '</a></li>'].join(""));
    }
    $("#shaders").append(html.join(""));
  }

  window.addEventListener("load", init);
  window.addEventListener("scroll", onWindowScroll)

});
