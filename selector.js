// selector function for text area
define(function(){

    "use strict";

    function scrollNumber(textarea, mouseDelta, onNumberChanged){
        var selected = getSelection(textarea);
        if(!isNaN(selected.text - 0) && selected.text != ""){
            var newValue = null;
            // no decimal
            if((selected.text + "").split('.').length == 1){ 
                newValue = Math.round( parseFloat(selected.text) + mouseDelta );
            }
            // has a decimal
            else if((selected.text + "").split(".").length == 2){ 
                var fvar = (selected.text+"").split(".");
                var precisionLength = (fvar[1] + "").length;
                newValue = parseFloat(parseFloat(selected.text) + mouseDelta).toFixed( precisionLength );
            }
            if(newValue !== null){
                replaceSelection(textarea, newValue);
                setSelection(textarea, selected.start, selected.start + (newValue + "").length );
                onNumberChanged();
            }
        }
    }

    function getSelection(textarea){
        var l = textarea.selectionEnd - textarea.selectionStart;
        return {
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
            length: l,
            text: textarea.value.substr(textarea.selectionStart, l)
        };
    }

    function replaceSelection(textarea, replaceStr){
        var selection = getSelection(textarea);
        var start_pos = selection.start;
        var end_pos = start_pos + replaceStr.length;
        textarea.value = textarea.value.substr(0, start_pos) + replaceStr + textarea.value.substr(selection.end, textarea.value.length);
        setSelection(textarea, start_pos, end_pos);
        return {
            start: start_pos, 
            end: end_pos, 
            length: replaceStr.length, 
            text: replaceStr
        };
    }

    function setSelection(textarea, start_pos, end_pos){
        textarea.focus();
        textarea.selectionStart = start_pos;
        textarea.selectionEnd = end_pos;
        return getSelection(textarea);
    }

    return {
        scrollNumber: scrollNumber,
        getSelection: getSelection,
        replaceSelection: replaceSelection,
        setSelection: setSelection,
    };
});
