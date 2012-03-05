// selector function for text area
define(function(){

    "use strict";

    function scrollNumber(textarea, mouseDelta, onNumberChanged){
        var selected = getSelection(textarea);
        if(!isNaN(selected.text) && selected.text !== ""){
            var newValue = null;
            var parts = selected.text.split('.');
            // no decimal
            if(parts.length === 1){
                newValue = Math.round(parseInt(parts[0]) + mouseDelta).toString();
            }
            // has a decimal
            else if(parts.length === 2){
                var precisionLength = parts[1].length;
                newValue = (parseFloat(selected.text) + mouseDelta).toFixed(precisionLength);
            }
            if(newValue !== null){
                replaceSelection(textarea, newValue);
                setSelection(textarea, selected.start, selected.start + newValue.length);
                onNumberChanged();
            }
        }
    }

    function getSelection(textarea){
        var len = textarea.selectionEnd - textarea.selectionStart;
        return {
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
            length: len,
            text: textarea.value.substr(textarea.selectionStart, len)
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
