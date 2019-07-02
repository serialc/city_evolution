/*	2011 Cyrille Medard de Chardon
	JS GHOST
*/

var JG = {};

JG.constants = {
	celldim: 5,
	pointorigin: false,	//true is centre point, false is crossroads
	showanalysis: true,
	houses: 200,		//number of houses to place in model
	roadnum: 0,		//number of road cells 'built' (ignores original crossroads)
	housenum: 0,		//number of house cells 'built'
	miniu: 9999999,		//holds the lowest iu
	maxiu: 0		//holds the highest iu found
	//cw: number of cells across the width
	//ch: number of cells across the height
	//origin: id of cell at origin
	//maxrd: max depth of road search
};

JG.model = {
	phi: 10.0,	//agricultural rent
	inc: 100.0,	//residnetial income
	alpha: 0.3,	//income share spent on housing
	beta: 0.25,	//pref for green/open space
	gamma: 0.1,	//pref for social amenities
	theta: 0.5,	//unit transport cost
	x: 3		//neighbourhood size
};

JG.data = {
	//type: type of cell, field, road, house
	//rd:	distance to a road across fields
	//crid: the id of the closest road
	//cbdd: the distance from this road cell to the CBD
	//iu:	the indirect utility of the cell
};

JG.print = function(msg) {
	$('#output').html($('#output').html() + '\n' + msg);
}

JG.describe = function(evt) {
	alert('id: ' + this.id +
		'\nClass: ' + JG.data[this.id].type +
		'\nRoad Dist: ' + JG.data[this.id].rd +
		'\nClosest Road id: ' + JG.data[this.id].crid +
		'\nRoad Dist to CBD: ' + JG.data[this.id].cbdd +
		'\nIndirect Utility: ' + JG.data[this.id].iu);
	JG.getGreenAndHouses(this.id);
}

//draw the cell lattice
JG.drawLattice = function() {
	var cd = JG.constants.celldim;
	var vertshift = cd*Math.cos(Math.PI/6);

	//get the SVG canvas pixel dimensions
	var cw = JSVG.getAttr('svg_canvas','width');
	var ch = JSVG.getAttr('svg_canvas','height');
	
	//how many cells can go in the area
	cw = cw/cd/2;
	ch = ch/cd/2;
	
	//max distance a field will be from a road (in terms of search)
	JG.constants.maxrd = cw + ch;
	
	//save lattice dimensions
	JG.constants.cw = cw;
	JG.constants.ch = ch;
	
	var i = j = 0;
	var theid = '';
	var boolshift = 0;

	while(i < cw) {
		if(boolshift) {
			boolshift = 0;
		} else {

			boolshift = 1;
		}

		while(j < ch) {
			theid = i+'_'+j;
			//JSVG.createHex('lattice', theid, cd + boolshift + (i*cd*3), j*vertshift, cd, 'field', {click: JG.describe});
			JSVG.createHex('lattice', theid, i*1.5*cd+cd, (j*2+boolshift)*vertshift, cd, 'field', {click: JG.describe});
			JG.data[theid] = {'type': 'field'};
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
	
	//if pointorigin is true only generate centre point road
	if(JG.constants.pointorigin) {
		JSVG.setAttr(cw_mid + '_' + ch_mid, 'class', 'road');
		JG.data[cw_mid + '_' + ch_mid].type = 'road';
		return;
	}
	
	//generate crossroads
	var i = 0;
	//draw horizontal line
	while(i < cw) {
		JSVG.setAttr(i+'_'+ch_mid, 'class', 'road');
		JG.data[i+'_'+ch_mid].type = 'road';
		i = i + 1;
	}
	
	i = 0;
	//draw vertical line
	while(i < ch) {
		JSVG.setAttr(cw_mid+'_'+i, 'class', 'road');
		JG.data[cw_mid+'_'+i].type = 'road';
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
	
	//break down id into x,y coordinates
	var loc = origin_id.split('_');
	var x = parseInt(loc[0],10);
	var y = parseInt(loc[1],10);
	
	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+(y-1)),
			((x+1)+'_'+y),
			(x+'_'+(y+1)),
			((x-1)+'_'+y),
			((x-1)+'_'+(y-1)),
			];
	} else {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+y),
			((x+1)+'_'+(y+1)),
			(x+'_'+(y+1)),
			((x-1)+'_'+(y+1)),
			((x-1)+'_'+y),
			];
	}

	var cell = neigh_cbdd = '';
	
	// Go through neighbour cells: n, ne, se, s, sw, nw 
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
	
	var loc = origin_id.split('_');
	var x = parseInt(loc[0],10);
	var y = parseInt(loc[1],10);
	
	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+(y-1)),
			((x+1)+'_'+y),
			(x+'_'+(y+1)),
			((x-1)+'_'+y),
			((x-1)+'_'+(y-1)),
			];
	} else {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+y),
			((x+1)+'_'+(y+1)),
			(x+'_'+(y+1)),
			((x-1)+'_'+(y+1)),
			((x-1)+'_'+y),
			];
	}

	var cell = neigh_rd = '';
	
	//go through each cell n, ne, se, s, sw, nw
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

//a recursive function that calculates the green and urban neighbours
JG.hexSpiral = function hexSpiral( id, direction, neigh_lvl, neigh_max, primary_arm ) {

	var countg = 0, counth = 0, cell = JG.data[id], temp,
		loc = id.split('_'), x, y;

	x = parseInt(loc[0],10);
	y = parseInt(loc[1],10);

	if(JG.data[id]) {
		//JSVG.setStyle(id, 'fill', neigh_lvl*3 + '' + neigh_lvl*3 + '' + neigh_lvl*3 + '' + neigh_lvl*3 + '' + neigh_lvl*3 + '' + neigh_lvl*3);//testing
		//JSVG.setStyle(id, 'class', '');//testing

		if(cell.type === 'field') {
			countg = 1;
		} else if(cell.type === 'house') {
			counth = 1;
		}
	}

	if( neigh_lvl < neigh_max ) {
		//figure out next cell

		//determine neighbours n, ne, se, s, sw, nw 
		if(x%2 === 1) {
			var id_array = [
				(x+'_'+(y-1)),
				((x+1)+'_'+(y-1)),
				((x+1)+'_'+y),
				(x+'_'+(y+1)),
				((x-1)+'_'+y),
				((x-1)+'_'+(y-1)),
				];
		} else {
			var id_array = [
				(x+'_'+(y-1)),
				((x+1)+'_'+y),
				((x+1)+'_'+(y+1)),
				(x+'_'+(y+1)),
				((x-1)+'_'+(y+1)),
				((x-1)+'_'+y),
				];
		}

		temp = hexSpiral( id_array[direction], direction, neigh_lvl + 1, neigh_max, primary_arm );
		countg = countg + temp.g;
		counth = counth + temp.h;

		if( primary_arm ) {
			//do off shoot
			//in (direction + 1)%6
			temp = hexSpiral( id_array[(direction+1)%6], (direction+1)%6, neigh_lvl+1, neigh_max, false );
			countg = countg + temp.g;
			counth = counth + temp.h;
		}
	}

	return {g: countg, h: counth};
}

//counts/finds the number of green neighbours in the neighbourhood
JG.getGreenAndHouses = function(cid) {
	var res, counth = 0, countg = 0, x, y, loc = cid.split('_');
	x = parseInt(loc[0],10);
	y = parseInt(loc[1],10);
	
	var neigh = JG.model.x;		//neighbourhood size

	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+(y-1)),
			((x+1)+'_'+y),
			(x+'_'+(y+1)),
			((x-1)+'_'+y),
			((x-1)+'_'+(y-1)),
			];
	} else {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+y),
			((x+1)+'_'+(y+1)),
			(x+'_'+(y+1)),
			((x-1)+'_'+(y+1)),
			((x-1)+'_'+y),
			];
	}	

	//go through each cell n, ne, se, s, sw, nw
	for(var i = 0; i < id_array.length; i++) {
		res = JG.hexSpiral( id_array[i], i, 1, neigh, true);
		countg = countg + res.g;
		counth = counth + res.h;
	}
	
	//return an object that contains the green and house proportions in the neighbourhood
	return {g: countg/Math.pow((neigh*2)+1,2), h: counth/Math.pow((neigh*2)+1,2)};
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
	var EHcount;
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
				EHcount = JG.getGreenAndHouses(theid);
				E = Math.pow(Math.pow(Math.E,EHcount.g),beta);
				S = Math.pow(Math.pow(Math.E,Math.sqrt(EHcount.h)),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;									//ignores road cost
				//iu = (inc - ((JG.constants.roadnum * phi)/(JG.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost
				iu = (inc - (((JG.constants.roadnum + JG.data[theid].rd) * phi)/(JG.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost & added road cost to reach cell
				
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
	var target_road_id = JG.data[houseid].crid,
		road_dist = JG.data[houseid].rd,
		x, y;

	//we are finished when we are next to a road
	if(road_dist === 1) {
		return true;
	}
	
	//break-down cell id
	var loc = houseid.split('_');
	x = parseInt(loc[0],10);
	y = parseInt(loc[1],10);
	
	//look at the surrounding cells
	var best_dir = '';
	var best_dist = 99999;
	
	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+(y-1)),
			((x+1)+'_'+y),
			(x+'_'+(y+1)),
			((x-1)+'_'+y),
			((x-1)+'_'+(y-1)),
			];
	} else {
		var id_array = [
			(x+'_'+(y-1)),
			((x+1)+'_'+y),
			((x+1)+'_'+(y+1)),
			(x+'_'+(y+1)),
			((x-1)+'_'+(y+1)),
			((x-1)+'_'+y),
			];
	}
	
	var cell;
	
	//go through each cell n, ne, se, s, sw, nw
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
	JSVG.setAttr(best_dir, 'class', 'road');
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
	JSVG.setAttr(chosen_cell_id, 'class', 'house');
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

//displays results/analysis
JG.summaryAnalysis = function(run_time) {
	JG.print('Completion Time: ' + run_time/1000 + ' seconds\n' +
			'Houses placed: ' + JG.constants.housenum + ' of ' + JG.constants.houses + ' (' + parseInt(JG.constants.housenum*10000/JG.constants.houses,10)/100 + '% complete)\n' +
			'Roads built: ' + JG.constants.roadnum + '(' + parseInt(JG.constants.roadnum*10000/(JG.constants.cw*JG.constants.ch),10)/100 + '% of area paved)\n');
	JG.print('Model parameters:\nBeta: ' + JG.model.beta + '\nGamma: ' + JG.model.gamma + '\nBeta/Gamma: ' + JG.model.beta/JG.model.gamma + '\n');
	//JG.print('Model results:\n');
	
	var x = JG.constants.cw, y = JG.constants.ch;
	var i = j = 0, theid = '', cell, iu, E, S, dist, EHcount;
	
	//import globals to speed up
	var inc = JG.model.inc;		//income
	var theta = JG.model.theta;	//unit transport cost
	var phi = JG.model.phi;		//agri rent
	var alpha = JG.model.alpha;	//income share spent on housing
	var beta = JG.model.beta;	//green preference
	var gamma = JG.model.gamma	//social preference
	
	//recalculate utility at current locations
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			cell = JG.data[theid];
			if(JG.data[theid].type === 'house') {

				//re-evaluate utility of houses
				dist = cell.rd + JG.data[cell.crid].cbdd; //get total distance to cbd across fields and roads
				EHcount = JG.getGreenAndHouses(theid);
				E = Math.pow(Math.pow(Math.E,EHcount.g),beta);
				S =	Math.pow(Math.pow(Math.E,Math.sqrt(EHcount.h)),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;		//ignores road cost
				//iu = (inc - ((JG.constants.roadnum * phi)/(JG.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost
				iu = (inc - (((JG.constants.roadnum + JG.data[theid].rd) * phi)/(JG.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost & added road cost to reach cell
				
				JG.data[theid].iu = iu;
				
				//record to global for visualization
				if(JG.constants.miniu > iu) {
					JG.constants.miniu = iu;
				}
				if(JG.constants.maxiu < iu) {
					JG.constants.maxiu = iu;
				}
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
	
	//do second loop to colour cells
	i = j = 0;
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j;
			cell = JG.data[theid];
			if(JG.data[theid].type === 'house') {	
				//color the cells
				JSVG.setAttr(theid,'class','');
				var hex = parseInt((16+(JG.data[theid].iu - JG.constants.miniu)*(239/(JG.constants.maxiu - JG.constants.miniu))),10).toString(16);
				JSVG.setStyle(theid, 'fill', '#ff' + hex + '' + hex);
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//onload start function
JG.initialize = function() {
	JG.drawLattice();

	JG.drawCrossRoad();

	var b = new Date();
	b = b.getTime();
	
	var houses = JG.constants.houses;
	var successful = false;
	
	var buildCity = function() {
		successful = JG.doCA();
		houses = houses - 1;
		if(houses > 0 && successful) {
			setTimeout(buildCity,0);
		} else {
			var a = new Date();
			//print a summary of the model run
			if(JG.constants.showanalysis) {
				JG.summaryAnalysis(a.getTime() - b);
			}
		}
	};
	
	setTimeout(buildCity,0);
};

window.onload = JG.initialize;
