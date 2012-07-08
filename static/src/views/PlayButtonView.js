define(function (require) {

  "use strict";

  var Backbone = require("backbone");


  var svg_template = [
    '<svg id="play-toggle" title="Toggle Track Play"',
         'width="60" height="60" version="1.2"',
         'xmlns="http://www.w3.org/2000/svg">',
      '<g transform="translate(30,30)">',
        '<circle cx="0" cy="0" r="28"/>',
        '<path class="play" d="M 10,0 L -8,-9 L -8,9 Z"/>',
      '</g>',
    '</svg>'
  ].join("");

});
