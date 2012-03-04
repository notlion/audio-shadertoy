// selector function for text area
define(function(){

    "use strict";

	function get_selection(the_id)
	{
	    var e = document.getElementById(the_id);

	    //Mozilla and DOM 3.0
	    if('selectionStart' in e)
	    {
	        var l = e.selectionEnd - e.selectionStart;
	        return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
	    }
	    //IE
	    else if(document.selection)
	    {
	        e.focus();
	        var r = document.selection.createRange();
	        var tr = e.createTextRange();
	        var tr2 = tr.duplicate();
	        tr2.moveToBookmark(r.getBookmark());
	        tr.setEndPoint('EndToStart',tr2);
	        if (r == null || tr == null) return { start: e.value.length, end: e.value.length, length: 0, text: '' };
	        var text_part = r.text.replace(/[\r\n]/g,'.'); //for some reason IE doesn't always count the \n and \r in the length
	        var text_whole = e.value.replace(/[\r\n]/g,'.');
	        var the_start = text_whole.indexOf(text_part,tr.text.length);
	        return { start: the_start, end: the_start + text_part.length, length: text_part.length, text: r.text };
	    }
	    //Browser not supported
	    else return { start: e.value.length, end: e.value.length, length: 0, text: '' };
	}

	function replace_selection(the_id,replace_str)
	{
	    var e = document.getElementById(the_id);
	    selection = get_selection(the_id);
	    var start_pos = selection.start;
	    var end_pos = start_pos + replace_str.length;
	    e.value = e.value.substr(0, start_pos) + replace_str + e.value.substr(selection.end, e.value.length);
	    set_selection(the_id,start_pos,end_pos);
	    return {start: start_pos, end: end_pos, length: replace_str.length, text: replace_str};
	}

	function set_selection(the_id, start_pos, end_pos)
	{
	    var e = document.getElementById(the_id);

	    //Mozilla and DOM 3.0
	    if('selectionStart' in e)
	    {
	        e.focus();
	        e.selectionStart = start_pos;
	        e.selectionEnd = end_pos;
	    }
	    //IE
	    else if(document.selection)
	    {
	        e.focus();
	        var tr = e.createTextRange();

	        //Fix IE from counting the newline characters as two seperate characters
	        var stop_it = start_pos;
	        for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) start_pos = start_pos - .5;
	        stop_it = end_pos;
	        for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) end_pos = end_pos - .5;

	        tr.moveEnd('textedit',-1);
	        tr.moveStart('character',start_pos);
	        tr.moveEnd('character',end_pos - start_pos);
	        tr.select();
	    }
	    return get_selection(the_id);
	}

	function wrap_selection(the_id, left_str, right_str, sel_offset, sel_length)
	{
	    var the_sel_text = get_selection(the_id).text;
	    var selection =  replace_selection(the_id, left_str + the_sel_text + right_str );
	    if(sel_offset !== undefined && sel_length !== undefined) selection = set_selection(the_id, selection.start +  sel_offset, selection.start +  sel_offset + sel_length);
	    else if(the_sel_text == '') selection = set_selection(the_id, selection.start + left_str.length, selection.start + left_str.length);
	    return selection;
	}


    return {
    		get_selection     : get_selection
    	, 	replace_selection : replace_selection
    	,	set_selection     : set_selection
    	,	wrap_selection    : wrap_selection
    };


});
