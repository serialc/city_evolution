/*	2011 Cyrille Medard de Chardon
	JS GHOST
*/

var JG = {};

JG.constants = {
	celldim: 25
	//cw: number of cells across the width
	//ch: number of cells across the height
	//origin: id of cell at origin
	//maxrd: max depth of road search
};

JG.model = {
	phi: 10,	//agricultural rent
	inc: 100,	//residnetial income
	alpha: .3,	//income share spent on housing
	beta: 0.25,	//pref for green/open space
	gamma: 0.1,	//pref for social amenities
	theta: 0.5,	//unit transport cost
	x: 3		//neighbourhood size
};

JG.print = function(msg) {
	$('#output').html($('#output').html() + '\n' + msg);
}

JG.describe = function(evt) {
	alert('id: ' + this.id +
		'\nClass: ' + JSVG.getAttr(this.id, 'class') +
		'\nRoad Dist: ' + JSVG.getAttr(this.id, 'rd') +
		'\nClosest Road id: ' + JSVG.getAttr(this.id, 'crid') +
		'\nRoad Dist to CBD: ' + JSVG.getAttr(this.id, 'crd') +
		'\nIndirect Utility: ' + JSVG.getAttr(this.id, 'iu'));
}

//draw the cell lattice
JG.drawLattice = function() {
	var cd = JG.constants.celldim;

	//get the SVG canvas pixel dimensions
	var cw = JSVG.getAttr('svg_canvas','width');
	var ch = JSVG.getAttr('svg_canvas','height');
	
	//how many cells can go in the area
	cw = cw/cd;
	ch = ch/cd;
	
	//max distance a field will be from a road (in terms of search)
	JG.constants.maxrd = cw + ch;
	
	//save lattice dimensions
	JG.constants.cw = cw;
	JG.constants.ch = ch;
	
	var i = j = 0;

	while(i < cw) {
		while(j < ch) {
			JSVG.createRect('lattice',i+'_'+j,i*cd,j*cd,cd,cd, 'field', {click: JG.describe});
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
};

//draws the main crossroad
JG.drawCrossRoad = function() {
	var cw = JG.constants.cw;
	var ch = JG.constants.ch;
	
	var cw_mid = parseInt(cw/2,10);
	var ch_mid = parseInt(ch/2,10);
	
	JG.constants.origin = cw_mid + '_' + ch_mid;
	
	var i = 0;
	//draw horizontal line
	while(i < cw) {
		JSVG.setAttr(i+'_'+ch_mid, 'class', 'road');
		i = i + 1;
	}
	
	i = 0;
	//draw vertical line
	while(i < ch) {
		JSVG.setAttr(cw_mid+'_'+i, 'class', 'road');
		i = i + 1;
	}
}

//gives each road cell a distance measure to cbd
JG.roadCBDDist = function(origin_id, cbdd) {
	var type = JSVG.getAttr(origin_id,'class');
	if(type !== 'road') {
		return;
	}
	
	//set cell dist to cbd
	JSVG.setAttr(origin_id, 'crd', cbdd);
	
	//increment distance to cbd
	cbdd = 1 + cbdd;
	
	//loc[0] has x
	//loc[1] has y
	var loc = origin_id.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	var tmp;
	
	//if above cell exists
	var top = document.getElementById(loc[0]+'_'+(loc[1]-1));
	if(top) {
		tmp = JSVG.getAttr(top.id, 'crd');
		if(!tmp || tmp > cbdd) {
			JG.roadCBDDist(top.id, cbdd);
		}
	}
	
	//if right cell exists
	var right = document.getElementById((loc[0] + 1)+'_'+loc[1]);
	if(right) {
		tmp = JSVG.getAttr(right.id, 'crd')
		if(!tmp || tmp > cbdd) {
			JG.roadCBDDist(right.id, cbdd);
		}
	}
	
	//if below cell exists
	var below = document.getElementById(loc[0]+'_'+(loc[1]+1));
	if(below) {
		tmp = JSVG.getAttr(below.id, 'crd')
		if(!tmp || tmp > cbdd) {
			JG.roadCBDDist(below.id, cbdd);
		}
	}
	
	//if left cell exists
	var left = document.getElementById((loc[0] - 1)+'_'+loc[1]);
	if(left) {
		tmp = JSVG.getAttr(left.id, 'crd')
		if(!tmp || tmp > cbdd) {
			JG.roadCBDDist(left.id, cbdd);
		}
	}
}

//gives each cell a distance from road value
JG.roadDistCA = function(origin_id, rd_dist, last_road_id) {
	var type = JSVG.getAttr(origin_id,'class');
	
	if(type === 'road') {
		JSVG.setAttr(origin_id,'rd',0);
		last_road_id = origin_id;
		rd_dist = 1;
	} else if(type === 'house') {
		//JSVG.setAttr(origin_id,'rd', 999);
		//JSVG.setAttr(origin_id,'crid',last_road_id);
		//rd_dist = 999;
		return;
	} else {
		//this is a field cell
		JSVG.setAttr(origin_id,'rd', rd_dist);
		JSVG.setAttr(origin_id,'crid',last_road_id);
		rd_dist = 1 + rd_dist;
	}
	
	//stop searching if the distance is greater than the max
	if(rd_dist > JG.constants.maxrd) {
		return;
	}
	
	//loc[0] has x
	//loc[1] has y
	var loc = origin_id.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	var tmp;
	
	//if above cell exists
	var top = document.getElementById(loc[0]+'_'+(loc[1]-1));
	if(top) {
		tmp = JSVG.getAttr(top.id, 'rd');
		if(!tmp || tmp > rd_dist) {
			JG.roadDistCA(top.id, rd_dist, last_road_id);
		}
	}
	
	//if right cell exists
	var right = document.getElementById((loc[0] + 1)+'_'+loc[1]);
	if(right) {
		tmp = JSVG.getAttr(right.id, 'rd')
		if(!tmp || tmp > rd_dist) {
			JG.roadDistCA(right.id, rd_dist, last_road_id);
		}
	}
	
	//if below cell exists
	var below = document.getElementById(loc[0]+'_'+(loc[1]+1));
	if(below) {
		tmp = JSVG.getAttr(below.id, 'rd')
		if(!tmp || tmp > rd_dist) {
			JG.roadDistCA(below.id, rd_dist, last_road_id);
		}
	}
	
	//if left cell exists
	var left = document.getElementById((loc[0] - 1)+'_'+loc[1]);
	if(left) {
		tmp = JSVG.getAttr(left.id, 'rd')
		if(!tmp || tmp > rd_dist) {
			JG.roadDistCA(left.id, rd_dist, last_road_id);
		}
	}
}

//clears all the road dist values for all cells
JG.clearRoadDist = function() {
	var x = JG.constants.cw;
	var y = JG.constants.ch;
	var i = j = 0;
	var theid = '';
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			if(JSVG.getAttr(theid, 'class') === 'road') {
				JSVG.setAttr(theid, 'crd', '');
			}
			JSVG.setAttr(theid, 'rd', '');
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//counts/finds the number of green neighbours in the neighbourhood
JG.getGreen = function(cid) {
	var count = 0;
	
	//this cell 'cid' is field
	var loc = cid.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	var neigh = JG.model.x;		//neighbourhood size
	
	var xleft = loc[0] - neigh;
	var ytop = loc[1] - neigh;
	var xright = loc[0] + neigh;
	var ybot = loc[1] + neigh;
	
	//go through neighbourhood and check if of type 'field'
	while( xleft <= xright ) {
		while( ytop <= ybot ) {
			//if exists and is a field
			if(JSVG.existsId(xleft+'_'+ytop) && JSVG.getAttr(xleft+'_'+ytop,'class') === 'field') {
				count = count + 1;
			}
			ytop = ytop + 1;
		}
		ytop = loc[1] - neigh;
		xleft = xleft + 1;
	}
	
	return count/Math.pow((neigh*2)+1,2);
}

//counts/finds the number of house neighbours in the neighbourhood
JG.getHouses = function(cid) {
	var count = 0;
	
	//this cell 'cid' is field
	var loc = cid.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	var neigh = JG.model.x;		//neighbourhood size
	
	var xleft = loc[0] - neigh;
	var ytop = loc[1] - neigh;
	var xright = loc[0] + neigh;
	var ybot = loc[1] + neigh;
	
	//go through neighbourhood and check if of type 'house'
	while( xleft <= xright ) {
		while( ytop <= ybot ) {
			//if exists and is a field
			if(JSVG.existsId(xleft+'_'+ytop) && JSVG.getAttr(xleft+'_'+ytop,'class') === 'house') {
				count = count + 1;
			}
			ytop = ytop + 1;
		}
		ytop = loc[1] - neigh;
		xleft = xleft + 1;
	}
	
	return count/Math.pow((neigh*2)+1,2);
}

//calculate the field indirect utility of each cell
JG.fieldUtil = function() {
	var x = JG.constants.cw;
	var y = JG.constants.ch;
	
	var iu = 0;
	
	//import globals to speed up
	var inc = JG.model.inc;		//income
	var theta = JG.model.theta;	//unit transport cost
	var phi = JG.model.phi;		//agri rent
	var alpha = JG.model.alpha;	//income share spent on housing
	var beta = JG.model.beta;	//green preference
	var gamma = JG.model.gamma	//social preference
	
	var i = j = 0;
	var dist = E = S = 0;
	var theid = '';
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			if(JSVG.getAttr(theid, 'class') === 'field') {
				//if the cell is a field cell:
				dist = JSVG.getIntAttr(theid, 'rd') + JSVG.getIntAttr(JSVG.getAttr(theid,'crid'),'crd');
				E = Math.pow(Math.pow(Math.E,JG.getGreen(theid)),beta);
				S = Math.pow(Math.pow(Math.E,Math.sqrt(JG.getHouses(theid))),gamma);
				iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;
				JSVG.setAttr(theid, 'iu', iu);
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//builds a road from a new house to an existing road
JG.buildRoad = function(houseid) {
	var target_road_id = JSVG.getAttr(houseid, 'crid');
	var road_dist = JSVG.getIntAttr(houseid, 'rd');

	//we are finished when we are next to a road
	if(road_dist === 1) {
		return;
	}
	
	//break-down cell id
	var loc = houseid.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	//look at 4 surrounding cells
	var best_dir = '';
	var best_dist = 99999;
	
	//top
	var cellid = (loc[0] - 1) + '_' + loc[1];
	if(JSVG.existsId(cellid)) {
		var celld = JSVG.getAttr(cellid, 'rd');
		if(JSVG.getAttr(cellid, 'class') === 'field' && JSVG.getAttr(cellid, 'crid') === target_road_id && celld < road_dist) {
			//we have a candidate
			best_dir = cellid;
			best_dist = celld;
		}
	}

	//right
	cellid = loc[0] + '_' + (loc[1] + 1);
	if(JSVG.existsId(cellid)) {
		celld = JSVG.getAttr(cellid, 'rd');
		if(JSVG.getAttr(cellid, 'class') === 'field' && JSVG.getAttr(cellid, 'crid') === target_road_id && celld < road_dist) {
			//we have a candidate
			if(celld < best_dist) {
				best_dir = cellid;
				best_dist = celld;
			}
		}
	}
	
	//below
	cellid = (loc[0] + 1) + '_' + loc[1];
	if(JSVG.existsId(cellid)) {
		celld = JSVG.getAttr(cellid, 'rd');
		if(JSVG.getAttr(cellid, 'class') === 'field' && JSVG.getAttr(cellid, 'crid') === target_road_id && celld < road_dist) {
			//we have a candidate
			if(celld < best_dist) {
				best_dir = cellid;
				best_dist = celld;
			}
		}
	}
		
	//left
	cellid = loc[0] + '_' + (loc[1] - 1);
	if(JSVG.existsId(cellid)) {
		celld = JSVG.getAttr(cellid, 'rd');
		if(JSVG.getAttr(cellid, 'class') === 'field' && JSVG.getAttr(cellid, 'crid') === target_road_id && celld < road_dist) {
			//we have a candidate
			if(celld < best_dist) {
				best_dir = cellid;
				best_dist = celld;
			}
		}
	}

	//tie breaking is automatic by overwrite
	//from highest to lowest priority: left, below, right, top
	
	//we want to build on the one with the same 'crid' and the lowest 'rd'
	JSVG.setAttr(best_dir, 'class', 'road');
		
	//call recursively
	JG.buildRoad(best_dir);
}

//finds the highest indirect utility and adds a house at that location
JG.addHouse = function() {
	var highiu = 0;
	var chosen_cell_id = '';
	var thisiu = 0;
	
	var x = JG.constants.cw;
	var y = JG.constants.ch;
	var i = j = 0;
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			thisiu = JSVG.getAttr(theid, 'iu');
			
			if(JSVG.getAttr(theid, 'class') === 'field' && thisiu > highiu) {
				chosen_cell_id = theid;
				highiu = thisiu;
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
	
	//check to see if best utility is positive
	if(highiu < 0) {
		JG.print('Cannot place any more houses, negative utility');
		return false;
	}
	
	//found house place it and do any other adjustments
	JSVG.setAttr(chosen_cell_id, 'class', 'house');

	JG.buildRoad(chosen_cell_id);
	
	//finished, return true to continue
	return true;
}

//the main cellular automata loop
JG.doCA = function() {
	//clear the distance to roads for all non road cells
	//and set roads to 0, and dist to cbd to 998
	JG.clearRoadDist();

	//calculate distance to road of all cells
	JG.roadDistCA(JG.constants.origin, 0, JG.constants.origin);
	
	//calculate distance or road cells to cbd
	JG.roadCBDDist(JG.constants.origin, 0);
	
	//calculate indirect utility for each field cell
	JG.fieldUtil();
	
	//adds house to city
	return JG.addHouse();
}

//onload start function
JG.initialize = function() {
	JG.drawLattice();
	JG.drawCrossRoad();

	var houses = 150;
	var positive_utility = true;
	
	var buildCity = function() {
		positive_utility = JG.doCA();
		if(houses > 0 && positive_utility) {
			houses = houses - 1;
			setTimeout(buildCity,0);
		}
	};
	
	setTimeout(buildCity,0);
};

window.onload = JG.initialize;