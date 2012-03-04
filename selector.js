// selector function for text area
define(function(){

    "use strict";

    function getSelection(the_id){
        var e = document.getElementById(the_id);
        var l = e.selectionEnd - e.selectionStart;
        return {
            start: e.selectionStart,
            end: e.selectionEnd,
            length: l,
            text: e.value.substr(e.selectionStart, l)
        };
    }

    function replaceSelection(the_id,replaceStr){
        var e = document.getElementById(the_id);
        selection = getSelection(the_id);
        var start_pos = selection.start;
        var end_pos = start_pos + replaceStr.length;
        e.value = e.value.substr(0, start_pos) + replaceStr + e.value.substr(selection.end, e.value.length);
        setSelection(the_id,start_pos,end_pos);
        return {start: start_pos, end: end_pos, length: replaceStr.length, text: replaceStr};
    }

    function setSelection(the_id, start_pos, end_pos){
        var e = document.getElementById(the_id);

        e.focus();
        e.selectionStart = start_pos;
        e.selectionEnd = end_pos;

        return getSelection(the_id);
    }

    function wrapSelection(the_id, left_str, right_str, sel_offset, sel_length){
        var the_sel_text = getSelection(the_id).text;
        var selection = replaceSelection(the_id, left_str + the_sel_text + right_str );
        if(sel_offset !== undefined && sel_length !== undefined) selection = setSelection(the_id, selection.start +  sel_offset, selection.start +  sel_offset + sel_length);
        else if(the_sel_text == '') selection = setSelection(the_id, selection.start + left_str.length, selection.start + left_str.length);
        return selection;
    }

    return {

        getSelection: getSelection,
        replaceSelection: replaceSelection,
        setSelection: setSelection,
        wrapSelection: wrapSelection

    };
});
