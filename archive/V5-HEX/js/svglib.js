/*  2011 Cyrille Medard de Chardon
	svglib.js
	Contains common JS - SVG interaction functions
*/

var JSVG = {};

JSVG.constants = {
	svgNS: "http://www.w3.org/2000/svg"
};

//rotate an SVG rect
JSVG.rotate = function(evt) {
	//rotate SVG shape
	var h = this.height.baseVal.value;
	this.setAttributeNS(null, 'height', this.width.baseVal.value);
	this.setAttributeNS(null, 'width', h);
}

//checks if element with defined id exists
JSVG.existsId = function(svgid) {
	if(document.getElementById(svgid)) {
		return true;
	}
	return false;
}

//sets a style attribute
JSVG.setStyle = function(svgid, attr, val) {
	document.getElementById(svgid).setAttributeNS(null, attr, val);
}

//gets an attribute of an SVG object
JSVG.getAttr = function(svgid, attr) {
	return document.getElementById(svgid).getAttributeNS(null, attr);
};

//get an attribute that is an int
JSVG.getIntAttr = function(svgid, attr) {
	return parseInt(document.getElementById(svgid).getAttributeNS(null, attr),10);
};

//changes an attribute of an SVG object
JSVG.setAttr = function(svgid, attr, val) {
	document.getElementById(svgid).setAttributeNS(null, attr, val);
};

//changes all the attributes of an svg rect
JSVG.setRect = function(svgid, x, y, w, h) {
	var svgrect = document.getElementById(svgid);
	
	if(svgrect && (svgrect.tagName || svgrect.nodeName) === 'rect') {
		svgrect.setAttributeNS(null, 'x', x);
		svgrect.setAttributeNS(null, 'y', y);
		svgrect.setAttributeNS(null, 'width', w);
		svgrect.setAttributeNS(null, 'height', h);
	}
};

//changes a rectangles x,y attributes
JSVG.setRectLoc = function(svgid, x, y) {
	var svgrect = document.getElementById(svgid);
	
	if(svgrect && (svgrect.tagName || svgrect.nodeName) === 'rect') {
		svgrect.setAttributeNS(null, 'x', x);
		svgrect.setAttributeNS(null, 'y', y);
	}
}

//changes all the attributes of an svg circ
JSVG.setCirc = function(svgobj, x, y, r) {
	var svgcirc = document.getElementById(svgobj);
	
	if(svgcirc && (svgcirc.tagName || svgcirc.nodeName) === 'circ') {
		svgcirc.setAttributeNS(null, 'cx', x);
		svgcirc.setAttributeNS(null, 'cy', y);
		svgcirc.setAttributeNS(null, 'r', r);
	}
};

//create a SVG text object
JSVG.createText = function(target, id, x, y, text, css_class) {
	var text_elem = document.getElementById(id);

	//check if the element id already exists and is a text node
	//if so simply modify/update
	if(text_elem && (text_elem.tagName || text_elem.nodeName) === 'text') {
		//modify element - give new text
		text_elem.nodeValue = text;
		text_elem.setAttributeNS(null, 'x', x);
		text_elem.setAttributeNS(null, 'y', y);
		return;
	}

	//create text element
	text_elem = document.createElementNS(JSVG.constants.svgNS, 'text');
	text_elem.setAttributeNS(null, 'id', id);
	text_elem.setAttributeNS(null, 'class', css_class);
	text_elem.setAttributeNS(null, 'x', x);
	text_elem.setAttributeNS(null, 'y', y);
	text_elem.appendChild(document.createTextNode(text));

	//add text to svg canvas
	document.getElementById(target).appendChild(text_elem);
};

//creates a path with a predefined curve string
JSVG.createPath = function(target, id, path_string, css_class, actions) {
	var path_elem = document.getElementById(id);
	
	//check if the element id already exists and is a path node
	//if so simply modify/update
	if(path_elem && (path_elem.tagName || path_elem.nodeName) === 'path') {
		//modify path parameters only do not recreate shape
		path_elem.setAttribute(null, 'd', path_string);
		return;
	}

	//create a path
	path_elem =  document.createElementNS(JSVG.constants.svgNS, 'path');
	path_elem.setAttributeNS(null, 'id', id);
	path_elem.setAttributeNS(null, 'd', path_string);
	path_elem.setAttributeNS(null, 'class', css_class);
	for (name in actions ) {
		if(path_elem.addEventListener) {
			path_elem.addEventListener(name, actions[name], false);
		}
	}

	//Add rect to svg canvas
	document.getElementById(target).appendChild(path_elem);
};

//creates a circle in a target svg object, at x,y with a radius, r and class css_class, and with actions in object actions
JSVG.createCirc = function(target, id, x, y, r, css_class, actions) {
	var circ_elem = document.getElementById(id);
	
	//check if element id already exists and is a circ node
	//if so simply modify/update
	if(circ_elem && (circ_elem.tagName || circ_elem.nodeName) === 'circ') {
		//if the circle exists simply modify the parameters
		circ_elem.setAttributeNS(null, 'cx', x);
		circ_elem.setAttributeNS(null, 'cy', y);
		circ_elem.setAttributeNS(null, 'r', r);
		return;
	}

	//create SVG rect and add to target
	var circ_elem = document.createElementNS(JSVG.constants.svgNS, 'circle');
	circ_elem.setAttributeNS(null, 'id', id);
	circ_elem.setAttributeNS(null, 'cx', x);
	circ_elem.setAttributeNS(null, 'cy', y);
	circ_elem.setAttributeNS(null, 'r', r);
	circ_elem.setAttributeNS(null, 'class', css_class);
	for (name in actions ) {
		if(circ_elem.addEventListener) {
			circ_elem.addEventListener(name, actions[name], false);
		}
	}

	//Add circle to svg canvas
	document.getElementById(target).appendChild(circ_elem);
};

//creates a line in a target svg object at x1,y1 to x2,y2 with class css_class
JSVG.createLine = function(target, id, x1, y1, x2, y2, css_class) {
	var line_elem =  document.getElementById(id);
	
	//check if it already exists adn is a line node
	//if so simply updated/modify
	if(line_elem && (line_elem.tagName || line_elem.nodeName) === 'line') {
		//allows you to reshape line
		line_elem.setAttributeNS(null, 'x1', x1);
		line_elem.setAttributeNS(null, 'y1', y1);
		line_elem.setAttributeNS(null, 'x2', x2);
		line_elem.setAttributeNS(null, 'y2', y2);
		return;
	}
	
	//create SVG rect and add to target
	line_elem = document.createElementNS(JSVG.constants.svgNS, 'line');
	line_elem.setAttributeNS(null, 'id', id);
	line_elem.setAttributeNS(null, 'x1', x1);
	line_elem.setAttributeNS(null, 'y1', y1);
	line_elem.setAttributeNS(null, 'x2', x2);
	line_elem.setAttributeNS(null, 'y2', y2);
	line_elem.setAttributeNS(null, 'class', css_class);

	//Add line to svg canvas
	document.getElementById(target).appendChild(line_elem);
};

//creates a rectangle in a target svg object, at x,y with dim w,h and class css_class, and with actions in object actions
JSVG.createRect = function(target, id, x, y, w, h, css_class, actions) {
	var rect_elem =  document.getElementById(id);
	
	//check if it already exists and is a rect node
	//if so simply updated/modify
	if(rect_elem && (rect_elem.tagName || rect_elem.nodeName) === 'rect') {
		rect_elem.setAttributeNS(null, 'x', x);
		rect_elem.setAttributeNS(null, 'y', y);
		rect_elem.setAttributeNS(null, 'width', w);
		rect_elem.setAttributeNS(null, 'height', h);
		return;
	}

	//create SVG rect and add to target
	rect_elem = document.createElementNS(JSVG.constants.svgNS, "rect");
	rect_elem.setAttributeNS(null, 'id', id);
	rect_elem.setAttributeNS(null, 'x', x);
	rect_elem.setAttributeNS(null, 'y', y);
	rect_elem.setAttributeNS(null, 'width', w);
	rect_elem.setAttributeNS(null, 'height', h);
	rect_elem.setAttributeNS(null, 'class', css_class);
	for (name in actions ) {
		if(rect_elem.addEventListener) {
			rect_elem.addEventListener(name, actions[name], false);
		}
	}
				
	//Add rect to svg canvas
	return document.getElementById(target).appendChild(rect_elem);
};

//creates a hexagon in a target svg object, with an id, at top left corner x,y with size s, and class css_class, and with actions in object actions
JSVG.createHex = function(target, id, x, y, s, css_class, actions) {
	var hex_elem = document.getElementById(id);

	//calculate shape path here
	var vertshift = s*Math.cos(Math.PI/6);
	var path = 'M ' + x + ' ' + y +
		 ' l ' + s + ' 0 ' + 
		s/2 + ' ' + vertshift +
		 ' ' + (-s/2) + ' ' + vertshift +
		 ' ' + (-s) + ' 0 ' +
		(-s/2) + ' ' + (-vertshift) + ' z';

	//check if it already exists and is a path node
	//if so, simply update/modify
	if(hex_elem && (hex_elem.tagName || hex_elem.nodeName) == 'path') {
		//modify path
		hex_elem.setAttributeNS(null, 'd', path);
		return;
	}

	//create SVG path and add to target
	hex_elem = document.createElementNS(JSVG.constants.svgNS, 'path');
	hex_elem.setAttributeNS(null, 'id', id);
	hex_elem.setAttributeNS(null, 'd', path);
	hex_elem.setAttributeNS(null, 'class', css_class);
	for ( name in actions ) {
		if(hex_elem.addEventListener) {
			hex_elem.addEventListener(name, actions[name], false);
		}
	}

	//add hexagon to svg canvas
	return document.getElementById(target).appendChild(hex_elem); 
}
