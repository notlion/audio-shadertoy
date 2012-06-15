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
      skip = 0,
      count = limit;

  function init() {
    getMore();

    // get full database count to inhibit over-paging.
    $.ajax({
      type : "GET",
      url : "/count",
      dataType : "json",
      success : function(data) {
        count = data.count;
      }
    });
  }

  function onWindowScroll() {
    if ($(document).height() - window.pageYOffset - window.innerHeight <= 0 &&
        !loading) {
      getMore();
    }
  }

  function getMore() {
    $("#loader").show();
    getShaders({ limit : limit, skip : skip }, function(shaders) {
      $("#loader").hide();
      skip += limit;
      appendShaderList(shaders);
    });
  }

  function getShaders(params, callback) {

    loading = true;

    if (count < limit + skip) {
      $("#loader").hide();
      loading = false;
      return false;
    }

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

      var shader = shadersArray[i];

      html.push([
        '<li>',
        '<a href="/toy/#s=' + shader.short_id + '">',
        '<div class="thumb">',
        '<img src="' + shader.img + '">',
        '</div>',
        '</a>'].join(''));

      if (shader.track.title) {
        html.push([
        '<a href="' + shader.track.url + '">',
        shader.track.artist + ' &mdash; ' + shader.track.title,
        '</a>'
        ].join(''));
      }

      html.push('</li>');
    }
    $("#shaders").append(html.join(''));
  }

  window.addEventListener("load", init);
  window.addEventListener("scroll", onWindowScroll)

});
