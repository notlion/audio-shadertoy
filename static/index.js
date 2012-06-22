requirejs.config({
  shim: {
    "zepto": {
      exports: "Zepto"
    }
  },
  paths: {
    "zepto": "lib/zepto"
  }
});
require([
  "zepto"
],
function($){

  "use strict";

  var loading = false
    , limit = 12
    , skip = 0
    , count = limit;

  function init() {
    getMore();

    // get full database count to inhibit over-paging.
    $.ajax({
      type : "GET",
      url : "count",
      dataType : "json",
      success : function(data) {
        count = data.count;
      }
    });
  }

  function onWindowScroll() {
    if ($(document).height() - window.pageYOffset - window.innerHeight <= 1 &&
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

    if (count+limit < (limit + skip)) {
      $("#loader").hide();
      loading = false;
      return false;
    }

    $.ajax({
      type : "GET",
      url : "get",
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

    shadersArray.forEach(function(shader){
      html.push(
        '<li>',
        '<div class="thumb">',
          '<a href="toy/#s=', shader.short_id, '">',
            '<img src="img/', shader.short_id, '">',
          '</a>',
        '</div>'
      );

      if(shader.track.title) {
        html.push(
          '<span class="track"><a title="' + shader.track.artist, ' &mdash; ', shader.track.title + '" href="', shader.track.url, '">',
            shader.track.artist, ' &mdash; ', shader.track.title,
          '</a></span>'
        );
      } else {
        html.push('<span class="track"></span>');
      }

      html.push('</li>');
    });

    $("#shaders").append(html.join(""));
  }

  window.addEventListener("load", init);
  window.addEventListener("scroll", onWindowScroll)

});
