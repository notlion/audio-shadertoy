define(function(){

    "use strict";

    var events_transition_end = [
        "webkitTransitionEnd",
        "transitionend",
        "MSTransitionEnd",
        "oTransitionEnd"
    ];

    // Listen for multiple events and remove all listeners after the first responds
    function addMultiEventListener(element, events, callback, once){
        function onEvent(e){
            if(once){
                events.forEach(function(event){
                    element.removeEventListener(event, onEvent);
                });
            }
            callback(e);
        }
        events.forEach(function(event){
            element.addEventListener(event, onEvent);
        });
    }

    return {

        addMultiEventListener: addMultiEventListener,

        addTransitionEndListener: function(element, callback, once){
            addMultiEventListener(element, events_transition_end, callback, once);
        }

    };

});
