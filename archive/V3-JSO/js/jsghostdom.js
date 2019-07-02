/*	2011 Cyrille Medard de Chardon
	JS GHOST
*/

var JG = {};

JG.constants = {
	celldim: 10,
	canv: {w: 610, h: 610},
	houses: 500,	//number of houses to place in model
	roadnum: 0,		//number of road cells 'built' (ignores original crossroads)
	housenum: 0		//number of house cells 'built'
	//cw: number of cells across the width
	//ch: number of cells across the height
	//origin: id of cell at origin
	//maxrd: max depth of road search
};

JG.model = {
	phi: 10.0,	//agricultural rent
	inc: 100.0,	//residnetial income
	alpha: .3,	//income share spent on housing
	beta: 0.25,	//pref for green/open space
	gamma: 0.15,	//pref for social amenities
	theta: 0.5,	//unit transport cost
	x: 3		//neighbourhood size
};

JG.data = {};

JG.print = function(msg) {
	$('#output').html($('#output').html() + '\n' + msg);
}

JG.describe = function(evt) {
	alert('id: ' + evt.target.id +
		'\nClass: ' + JG.data[evt.target.id].type +
		'\nRoad Dist: ' + JG.data[evt.target.id].rd +
		'\nClosest Road id: ' + JG.data[evt.target.id].crid +
		'\nRoad Dist to CBD: ' + JG.data[evt.target.id].cbdd +
		'\nIndirect Utility: ' + JG.data[evt.target.id].iu);
}

//draw the cell lattice
JG.drawLattice = function() {
	var cd = JG.constants.celldim;

	//get the SVG canvas pixel dimensions
	var cw = JG.constants.canv.w;
	var ch = JG.constants.canv.h;
	
	//how many cells can go in the area
	cw = cw/cd;
	ch = ch/cd;
	
	//max distance a field will be from a road (in terms of search)
	JG.constants.maxrd = cw + ch;
	
	//save lattice dimensions
	JG.constants.cw = cw;
	JG.constants.ch = ch;
	
	var i = j = 0;
	var theid = '';
	
	while(j < ch) {
		while(i < cw) {
			theid = i+'_'+j;
			$('#lattice').append("<div id='" + theid + "' onclick='JG.describe(evt)' class='cell field'> </div>");
			if(i === 0) {
				$('#'+theid).addClass('clear');
			}
			JG.data[theid] = {'type': 'field'};
			i = i + 1;
		}
		i = 0;
		j = j + 1;
	}
};

//draws the main crossroad
JG.drawCrossRoad = function() {
	var cw = JG.constants.cw;
	var ch = JG.constants.ch;
	
	var cw_mid = parseInt(cw/2,10);
	var ch_mid = parseInt(ch/2,10);
	
	JG.constants.origin = cw_mid + '_' + ch_mid;
	
	var theid, i = 0;
	//draw horizontal line
	while(i < cw) {
		theid = i+'_'+ch_mid;
		$('#'+theid).removeClass('field');
		$('#'+theid).addClass('road');
		JG.data[theid].type = 'road';
		i = i + 1;
	}
	
	i = 0;
	//draw vertical line
	while(i < ch) {
		theid = cw_mid+'_'+i;
		$('#'+theid).removeClass('field');
		$('#'+theid).addClass('road');
		JG.data[theid].type = 'road';
		i = i + 1;
	}
}

//gives each road cell a distance measure to cbd
JG.roadCBDDistCA = function roadCBDDistCA(origin_id, cbdd) {
	var type = JG.data[origin_id].type;
	if(type !== 'road') {
		return;
	}
	
	//set cell dist to cbd
	JG.data[origin_id].cbdd = cbdd;
	
	//increment distance to cbd
	cbdd = 1 + cbdd;
	
	//loc[0] has x
	//loc[1] has y
	var loc = origin_id.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	// top, right, bottom, left
	var id_array = [loc[0]+'_'+(loc[1]-1),
				(loc[0] + 1)+'_'+loc[1],
				loc[0]+'_'+(loc[1]+1),
				(loc[0] - 1)+'_'+loc[1]];
	var cell = neigh_cbdd = '';
	
	//go through each cell N, E, S, W
	for(var i = 0; i < id_array.length; i++) {
		cell = JG.data[id_array[i]];
		//check if cell exists
		if(cell) {
			neigh_cbdd = cell.cbdd;
			//if it does not have a cbdd defined or is greater than the current
			if(cell.type === 'road' && neigh_cbdd !== 0 && (!neigh_cbdd || neigh_cbdd > cbdd)) {
				//update cbdd value for cell
				roadCBDDistCA(id_array[i], cbdd);
			}
		}
	}
}

//gives each cell a distance from road value
JG.roadDistCA = function roadDistCA(origin_id, rd_dist, last_road_id) {
	var type = JG.data[origin_id].type;
	
	if(type === 'road') {
		JG.data[origin_id].rd = 0;
		last_road_id = origin_id;
		rd_dist = 1;
	} else if(type === 'house') {
		return;
	} else {
		//this is a field cell
		JG.data[origin_id].rd =  rd_dist;
		JG.data[origin_id].crid = last_road_id;
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
	
	// top, right, bottom, left
	var id_array = [loc[0]+'_'+(loc[1]-1),
				(loc[0] + 1)+'_'+loc[1],
				loc[0]+'_'+(loc[1]+1),
				(loc[0] - 1)+'_'+loc[1]];
	var cell = neigh_rd = '';
	
	//go through each cell N, E, S, W
	for(var i = 0; i < id_array.length; i++) {
		cell = JG.data[id_array[i]];
		//check if cell exists
		if(cell) {
			neigh_rd = cell.rd;
			//if road distance is not zero, and we are not transitioning to road from field, and it does not have a rd defined or is greater than the current roaddist
			if(neigh_rd !== 0 && !(type === 'field' && cell.type === 'road') && (!neigh_rd || neigh_rd > rd_dist)) {
				//update rd value for cell
				roadDistCA(id_array[i], rd_dist, last_road_id);
			}
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
			if(JG.data[theid].type === 'road') {
				JG.data[theid].cbdd = '';
			}
			JG.data[theid].rd = '';
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
			if(JG.data[xleft+'_'+ytop] && JG.data[xleft+'_'+ytop].type === 'field') {
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
			if(JG.data[xleft+'_'+ytop] && JG.data[xleft+'_'+ytop].type === 'house') {
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
	var cell, theid = '';
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			cell = JG.data[theid];
			if(cell.type === 'field') {
				//if the cell is a field cell:
				dist = cell.rd + JG.data[cell.crid].cbdd; //get total distance to cbd across fields and roads
				E = Math.pow(Math.pow(Math.E,JG.getGreen(theid)),beta);
				S = Math.pow(Math.pow(Math.E,Math.sqrt(JG.getHouses(theid))),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;		//ignores road cost
				iu = (inc - ((JG.constants.roadnum * phi)/(JG.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost
				JG.data[theid].iu = iu;
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//builds a road from a new house to an existing road
JG.buildRoadCA = function buildRoadCA(houseid) {
	var target_road_id = JG.data[houseid].crid;
	var road_dist = JG.data[houseid].rd;

	//we are finished when we are next to a road
	if(road_dist === 1) {
		return true;
	}
	
	//break-down cell id
	var loc = houseid.split('_');
	loc[0] = parseInt(loc[0],10);
	loc[1] = parseInt(loc[1],10);
	
	//look at 4 surrounding cells
	var best_dir = '';
	var best_dist = 99999;
	
	// top, right, bottom, left
	var id_array = [loc[0]+'_'+(loc[1]-1),
				(loc[0] + 1)+'_'+loc[1],
				loc[0]+'_'+(loc[1]+1),
				(loc[0] - 1)+'_'+loc[1]];
	var cell;
	
	//go through each cell N, E, S, W
	for(var i = 0; i < id_array.length; i++) {
		cell = JG.data[id_array[i]];
		if(cell) {
			if(cell.type === 'field' && cell.crid === target_road_id && cell.rd < road_dist) {
				//we have a candidate
				best_dir = id_array[i];
				best_dist = cell.rd;
			}
		}
	}
	
	//tie breaking is automatic by overwrite
	//from highest to lowest priority: left, below, right, top
	if(best_dir === '') {
		//no path was found
		JG.print('Failed to find the direction to build the road:' + houseid);
		return false;
	}
	
	//we want to build on the one with the same 'crid' and the lowest 'rd'
	$('#'+best_dir).removeClass('field');
	$('#'+best_dir).addClass('road');
	JG.data[best_dir].type = 'road';
	JG.constants.roadnum = 1 + JG.constants.roadnum;
	
	//call recursively
	return buildRoadCA(best_dir);
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
			thisiu = JG.data[theid].iu;
			
			//only cells that are fields, can connect to a road and have a higher utility
			if(JG.data[theid].type === 'field' && JG.data[theid].rd !== '' && thisiu > highiu) {
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
	} else if(chosen_cell_id === '') {
		JG.print('Cannot place any more houses, no more road access')
		return false;
	}
	
	//found house place it and do any other adjustments
	$('#'+chosen_cell_id).removeClass('field');
	$('#'+chosen_cell_id).addClass('house');
	JG.data[chosen_cell_id].type = 'house';
	JG.constants.housenum = 1 + JG.constants.housenum;

	//finished, return true to continue, will return false if an error is encountered
	return JG.buildRoadCA(chosen_cell_id);
}

//the main cellular automata loop
JG.doCA = function() {
	var origin = JG.constants.origin;

	//clear the distance to roads for all non road cells
	//and set roads to 0, and dist to cbd to 998
	JG.clearRoadDist();

	//calculate distance to road of all cells
	JG.roadDistCA(origin, 0, origin);
	
	//calculate distance or road cells to cbd
	JG.roadCBDDistCA(origin, 0);
	
	//calculate indirect utility for each field cell
	JG.fieldUtil();
	
	//adds house to city
	return JG.addHouse();
}

//onload start function
JG.initialize = function() {
	JG.drawLattice();
	JG.drawCrossRoad();

	var houses = JG.constants.houses;
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