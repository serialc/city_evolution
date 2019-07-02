/*	2011 Cyrille Medard de Chardon
	JS GHOST
*/

var JG = {};

JG.model = {
	run: false,	//used to stop model execution
	phi: 10.0,	//agricultural rent
	inc: 100.0,	//residnetial income
	alpha: 0.3,	//income share spent on housing
	beta: 0.25,	//pref for green/open space
	gamma: 0.1,	//pref for social amenities
	theta: 0.5,	//unit transport cost
	x: 3		//neighbourhood size
};

JG.results = {
	failg: 'pass',
	failh: 'pass'
};

JG.data = {
	//type: type of cell, field, road, house
	//rd:	distance to a road across fields
	//crid: the id of the closest road
	//cbdd: the distance from this road cell to the CBD
	//iu:	the indirect utility of the cell
};

JG.print = function(msg) {
	$('#output').html($('#output').html() + msg + '<br>');
};

//uploads results to server
JG.ajaxResults = function(results) {
	$.post( 'getresults.php', results );
}

//Used to print results into a table
JG.appendTable = function(values) {

	$('#tresults').append('<tr><td>' + JG.model.beta +
			'</td><td>' + JG.model.gamma +
			'</td><td>' + (JG.model.beta/JG.model.gamma).toFixed(2) +
			'</td><td>' + JG.model.x +
			'</td><td>' + JG.model.theta +
			'</td><td>' + JG.model.phi +
			'</td><td>' + values.gh +
			'</td><td>' + values.gr +
			'</td><td>' + JG.results.atdg.toFixed(2) +
			'</td><td>' + JG.results.failg +
			'</td><td>' + values.hh +
			'</td><td>' + values.hr +
			'</td><td>' + JG.results.atdh.toFixed(2) +
			'</td><td>' + JG.results.failh +
			'</td>' +
			'</tr>');

	JG.ajaxResults({
		beta: JG.model.beta,
		gamma: JG.model.gamma,
		bg: (JG.model.beta/JG.model.gamma).toFixed(2),
		n: JG.model.x,
		theta: JG.model.theta,
		phi: JG.model.phi,
		gh: values.gh,
		gr: values.gr,
		atdg: JG.results.atdg.toFixed(2),
		failg: JG.results.failg,
		hh: values.hh,
		hr: values.hr,
		atdh: JG.results.atdh.toFixed(2),
		failh: JG.results.failh
	});
};

JG.describe = function(evt) {
	alert('id: ' + this.id +
		'\nClass: ' + JG.data[this.id].type +
		'\nRoad Dist: ' + JG.data[this.id].rd +
		'\nClosest Road id: ' + JG.data[this.id].crid +
		'\nRoad Dist to CBD: ' + JG.data[this.id].cbdd +
		'\nIndirect Utility: ' + JG.data[this.id].iu);
};

//draw the cell lattice
JG.drawLattice = function() {
	//holds size of cell
	var cd;
	
	//how many cells can go in the area
	cw = 8.75;
	ch = 8.75;
	
	//max distance a field will be from a road (in terms of search)
//	JG.constants.maxrd = JG.constants.cw + JG.constants.ch;
	JG.constants.maxrd = JG.model.x * 2;
	
	//determine size of cell
	if(cw > ch) {
		JG.constants.celldim = ch;
	} else {
		JG.constants.celldim = cw;
	}

	cd = JG.constants.celldim;

	//reassign varialbes to now have the number of x,y cells
	cw = JG.constants.cw;
	ch = JG.constants.ch;

	var i = j = 0;
	var theid = '';
	
	function gridLine() {
		j = 0;
		while(j < ch) {
			theid = i+'_'+j;
			//JSVG.createRect('lattice', theid, i*cd, j*cd, cd, cd, 'field', {click: JG.describe});
			JSVG.createRect('lattice', theid, i*cd, j*cd, cd, cd, 'field', {});
			JG.data[theid] = {'type': 'field'};
			j = j + 1;
		}

		i = i + 1;
		
		if(i < cw) {
			setTimeout(gridLine, 0);
		} else {
			JG.setSliders(false);
		}
	}

	gridLine();
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
JG.getGreenAndHouses = function(cid) {
	var countg = counth = 0;
	
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
			if(JG.data[xleft+'_'+ytop]) {
				if(JG.data[xleft+'_'+ytop].type === 'field') {
					countg = countg + 1;
				} else if(JG.data[xleft+'_'+ytop].type === 'house') {
					counth = counth + 1;
				}
			}
			ytop = ytop + 1;
		}
		ytop = loc[1] - neigh;
		xleft = xleft + 1;
	}
	
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
			if(cell.type === 'field' && cell.rd) {
				//if the cell is a field cell:
				dist = cell.rd + JG.data[cell.crid].cbdd; //get total distance to cbd across fields and roads
				EHcount = JG.getGreenAndHouses(theid);
				E = Math.pow(Math.pow(Math.E,EHcount.g),beta);
				S = Math.pow(Math.pow(Math.E,Math.sqrt(EHcount.h)),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;		//ignores road cost
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
	if(highiu <= 0) {
		JG.results.failg = 'Too expensive';
		//JG.print('Cannot place any more houses, negative utility');
		return false;
	} else if(chosen_cell_id === '') {
		JG.results.failg = 'No road access';
		//JG.print('Cannot place any more houses, no more road access')
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

//calculate total travel distance for all houses
JG.sumHouse2CBDTravel = function() {

	//get number of cells wide/heigh	
	var x = JG.constants.cw;
	var y = JG.constants.ch;
	var i = j = k = 0, n, nc, cell, minCBD = 999, totalCBD = 0;

	//go through each cell in lattice
	while(i < x) {
		j = 0;
		while(j < y) {
			cell = JG.data[i+'_'+j];
			minCBD = 999;
			//if cell is a field start checking neighbours
			if(cell && cell.type === 'house') {
				//JG.print(i+'_'+j+' ');//TESTING
				//create array of von neuman neighbours' ids
				n = [i+'_'+(j-1), (i+1)+'_'+j, i+'_'+(j+1), (i-1)+'_'+j];
				for(k = 0; k < n.length; k++) {
					nc = JG.data[n[k]];
					if(nc && nc.type === 'road' && nc.cbdd < minCBD) {
						minCBD = JG.data[n[k]].cbdd;
						//JG.print('!'+i+'_'+j+' '+minCBD);//TESTING
					}
				}
				totalCBD = totalCBD + minCBD;
			}
			j = j + 1;
			//JG.print(totalCBD);
		}
		i = i + 1;
	}

	JG.results.atdg = totalCBD/JG.constants.housenum;
};


//displays results/analysis
JG.summaryAnalysis = function(run_time) {
	
	//display the results in table format
	JG.appendTable({gh: JG.constants.housenum, gr: JG.constants.roadnum, hh: JGH.constants.housenum, hr: JGH.constants.roadnum});

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

	//set 'constants'
	JG.constants = {
		celldim: 10,
		pointorigin: false,	//true is centre point, false is crossroads
		showanalysis: true,
		houses: 200,	//number of houses to place in model
		roadnum: 0,		//number of road cells 'built' (ignores original crossroads)
		housenum: 0,	//number of house cells 'built'
		miniu: 9999999,	//holds the lowest iu
		maxiu: 0,		//holds the highest iu found
		cw: 40,		//number of cells across the width
		ch: 40 		//number of cells across the height
	};

	JGH.constants = {
		celldim: 10,
		pointorigin: false,	//true is centre point, false is crossroads
		showanalysis: true,
		houses: 200,	//number of houses to place in model
		roadnum: 0,		//number of road cells 'built' (ignores original crossroads)
		housenum: 0,	//number of house cells 'built'
		miniu: 9999999,	//holds the lowest iu
		maxiu: 0,		//holds the highest iu found
		cw: 40,		//number of cells across the width
		ch: 40 		//number of cells across the height
	};

	//initialize sliders
	$('#g-slider').slider({
		value: JG.model.beta,
		min: 0,
		max: 1,
		step: 0.05,
		slide: function( event, ui ) {
			$('#g-val').html((ui.value).toFixed(2));
			JG.model.beta = ui.value;
		}
	});
	$('#s-slider').slider({
		value: JG.model.gamma,
		min: 0,
		max: 1,
		step: 0.05,
		slide: function( event, ui ) {
			$('#s-val').html((ui.value).toFixed(2));
			JG.model.gamma = ui.value;
		}
	});
	$('#n-slider').slider({
		value: JG.model.x,
		min: 1,
		max: 5,
		step: 1,
		slide: function( event, ui ) {
			$('#n-val').html((ui.value).toFixed(0));
			JG.model.x = ui.value;
		}
	});

	$('#t-slider').slider({
		value: JG.model.theta,
		min: 0,
		max: 10,
		step: 0.5,
		slide: function( event, ui ) {
			$('#t-val').html((ui.value).toFixed(1));
			JG.model.theta = ui.value;
		}
	});

	$('#a-slider').slider({
		value: JG.model.phi,
		min: 5,
		max: 50,
		step: 5,
		slide: function( event, ui ) {
			$('#a-val').html((ui.value).toFixed(0));
			JG.model.phi = ui.value;
		}
	});

	//disable all sliders
	JG.setSliders(true);

	//create grid elements
	JG.drawLattice();
	JGH.drawLattice();
};

//disable or enable sliders and buttons
JG.setSliders = function(inactive) {

	$('#g-slider').slider( "option", "disabled", inactive );
	$('#s-slider').slider( "option", "disabled", inactive );
	$('#n-slider').slider( "option", "disabled", inactive );
	$('#t-slider').slider( "option", "disabled", inactive );
	$('#a-slider').slider( "option", "disabled", inactive );
	$('#strtbut').attr('disabled', inactive );
};

//reset the SVG and JS object data
JG.reset = function() {

	//reset all SVG objects to field type
	cw = JG.constants.cw;
	ch = JG.constants.ch;

	var i = j = 0;
	var gid = hid = '';
	
	while(i < cw) {
		while(j < ch) {
			gid = i+'_'+j;
			hid = gid+'_h';
			//reset SVG objects
			JSVG.setAttr(gid, 'class', 'field');
			JSVG.setAttr(hid, 'class', 'field');
			//reset JS objects
			JG.data[gid].iu = '';
			JG.data[gid].rd = '';
			JG.data[gid].type = 'field';
			JGH.data[hid].iu = '';
			JGH.data[hid].rd = '';
			JGH.data[hid].type = 'field';


			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}

	//reset 'constants'
	JG.constants.roadnum = 0;
	JG.constants.housenum = 0;
	JG.constants.miniu= 9999999;
	JG.constants.maxiu= 0;
	JGH.constants.roadnum = 0;
	JGH.constants.roadnum = 0;
	JGH.constants.housenum = 0;
	JGH.constants.miniu= 9999999;
	JGH.constants.maxiu= 0;

	JG.results.failh = 'pass';
	JG.results.failg = 'pass';

};

//start running both models
JG.start = function() {

	//disable all sliders
	JG.setSliders(true);

	//clear JS data objects and SVG dom objects
	JG.reset();

	//rest crossroads
	JG.drawCrossRoad();
	JGH.drawCrossRoad();

	var b = new Date();
	b = b.getTime();
	
	var houses = JG.constants.houses;
	var successful = false;
	
	var buildCity = function() {
		successful = JG.doCA() + JGH.doCA();
        houses = houses - 1;
		if(houses > 0 && successful) {
			setTimeout(buildCity,0);
		} else {
			var a = new Date();
			//print a summary of the model run
			if(JG.constants.showanalysis && JGH.constants.showanalysis) {
				
				//Calculate the average distance each house must travel to the CBD
				JG.sumHouse2CBDTravel();

				//Calculate the average distance each house must travel to the CBD
				JGH.sumHouse2CBDTravel();

				//recalculate utility and colour hex cells
				JGH.summaryAnalysis(a.getTime() - b);

				//recalculate utility and colour grid cells
				JG.summaryAnalysis(a.getTime() - b);
				
				JG.setSliders(false);
			}
		}
	};
	
	setTimeout(buildCity,0);
};

window.onload = JG.initialize;
