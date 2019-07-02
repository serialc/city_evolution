/*	2011 Cyrille Medard de Chardon
	JS GHOST
*/

var JGH = {};

JGH.data = {
	//type: type of cell, field, road, house
	//rd:	distance to a road across fields
	//crid: the id of the closest road
	//cbdd: the distance from this road cell to the CBD
	//iu:	the indirect utility of the cell
};

JGH.print = function(msg) {
	$('#hexoutput').html($('#hexoutput').html() + msg + '<br>');
}

JGH.describe = function(evt) {
	alert('id: ' + this.id +
		'\nClass: ' + JGH.data[this.id].type +
		'\nRoad Dist: ' + JGH.data[this.id].rd +
		'\nClosest Road id: ' + JGH.data[this.id].crid +
		'\nRoad Dist to CBD: ' + JGH.data[this.id].cbdd +
		'\nIndirect Utility: ' + JGH.data[this.id].iu);
	JGH.getGreenAndHouses(this.id);
}

//draw the cell lattice
JGH.drawLattice = function() {
	//will hold the size of cell
	var cd;
	
	//how many cells can go in the area
	cw = 5; 
	ch = 5;
	
	//max distance a field will be from a road (in terms of search)
	//JG.constants.maxrd = JG.constants.cw + JG.constants.ch; //already defined

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
	
	var vertshift = cd*Math.cos(Math.PI/6);

	var i = j = 0;
	var theid = '';
	var boolshift = 0;


	function hexLine() {
		j = 0;
		if(boolshift) {
			boolshift = 0;
		} else {

			boolshift = 1;
		}

		while(j < ch) {
			theid = i+'_'+j+'_h';
			//JSVG.createHex('hexlattice', theid, i*1.5*cd+cd, (j*2+boolshift)*vertshift, cd, 'field', {click: JGH.describe});
			JSVG.createHex('hexlattice', theid, i*1.5*cd+cd, (j*2+boolshift)*vertshift, cd, 'field', {});
			JGH.data[theid] = {'type': 'field'};
			j = j + 1;
		}
		
		i = i + 1;


		if(i < cw) {
			setTimeout(hexLine, 0);
		}
	}

	hexLine();


	return;
	while(i < cw) {
		if(boolshift) {
			boolshift = 0;
		} else {

			boolshift = 1;
		}

		while(j < ch) {
			theid = i+'_'+j+'_h';
			JSVG.createHex('hexlattice', theid, i*1.5*cd+cd, (j*2+boolshift)*vertshift, cd, 'field', {click: JGH.describe});
			JGH.data[theid] = {'type': 'field'};
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
};

//draws the main crossroad
JGH.drawCrossRoad = function() {
	var cw = JGH.constants.cw;
	var ch = JGH.constants.ch;

	var cw_mid = parseInt(cw/2,10);
	var ch_mid = parseInt(ch/2,10);
	
	JGH.constants.origin = cw_mid + '_' + ch_mid + '_h';
	
	//if pointorigin is true only generate centre point road
	if(JGH.constants.pointorigin) {
		JSVG.setAttr(cw_mid + '_' + ch_mid + '_h', 'class', 'road');
		JGH.data[cw_mid + '_' + ch_mid + '_h'].type = 'road';
		return;
	}
	
	//generate crossroads
	var i = 0;
	//draw horizontal line
	while(i < cw) {
		JSVG.setAttr(i+'_'+ch_mid+'_h', 'class', 'road');
		JGH.data[i+'_'+ch_mid+'_h'].type = 'road';
		i = i + 1;
	}
	
	i = 0;
	//draw vertical line
	while(i < ch) {
		JSVG.setAttr(cw_mid+'_'+i+'_h', 'class', 'road');
		JGH.data[cw_mid+'_'+i+'_h'].type = 'road';
		i = i + 1;
	}
}

//gives each road cell a distance measure to cbd
JGH.roadCBDDistCA = function roadCBDDistCA(origin_id, cbdd) {
	var type = JGH.data[origin_id].type;
	if(type !== 'road') {
		return;
	}
	
	//set cell dist to cbd
	JGH.data[origin_id].cbdd = cbdd;
	
	//increment distance to cbd
	cbdd = 1 + cbdd;
	
	//break down id into x,y coordinates
	var loc = origin_id.split('_');
	var x = parseInt(loc[0],10);
	var y = parseInt(loc[1],10);
	
	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			((x-1)+'_'+(y-1))+'_h',
			];
	} else {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			((x+1)+'_'+(y+1))+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			];
	}

	var cell = neigh_cbdd = '';
	
	// Go through neighbour cells: n, ne, se, s, sw, nw 
	for(var i = 0; i < id_array.length; i++) {
		cell = JGH.data[id_array[i]];
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
JGH.roadDistCA = function roadDistCA(origin_id, rd_dist, last_road_id) {
	var type = JGH.data[origin_id].type;
	
	if(type === 'road') {
		JGH.data[origin_id].rd = 0;
		last_road_id = origin_id;
		rd_dist = 1;
	} else if(type === 'house') {
		return;
	} else {
		//this is a field cell
		JGH.data[origin_id].rd =  rd_dist;
		JGH.data[origin_id].crid = last_road_id;
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
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			((x-1)+'_'+(y-1))+'_h',
			];
	} else {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			((x+1)+'_'+(y+1))+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			];
	}

	var cell = neigh_rd = '';
	
	//go through each cell n, ne, se, s, sw, nw
	for(var i = 0; i < id_array.length; i++) {
		cell = JGH.data[id_array[i]];
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
JGH.clearRoadDist = function() {
	var x = JGH.constants.cw;
	var y = JGH.constants.ch;
	var i = j = 0;
	var theid = '';
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j+'_h';
			if(JGH.data[theid].type === 'road') {
				JGH.data[theid].cbdd = '';
			}
			JGH.data[theid].rd = '';
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//a recursive function that calculates the green and urban neighbours
JGH.hexSpiral = function hexSpiral( id, direction, neigh_lvl, neigh_max, primary_arm ) {

	var countg = 0, counth = 0, cell = JGH.data[id], temp,
		loc = id.split('_'), x, y;

	x = parseInt(loc[0],10);
	y = parseInt(loc[1],10);

	if(JGH.data[id]) {
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
				(x+'_'+(y-1))+'_h',
				((x+1)+'_'+(y-1))+'_h',
				((x+1)+'_'+y)+'_h',
				(x+'_'+(y+1))+'_h',
				((x-1)+'_'+y)+'_h',
				((x-1)+'_'+(y-1))+'_h',
				];
		} else {
			var id_array = [
				(x+'_'+(y-1))+'_h',
				((x+1)+'_'+y)+'_h',
				((x+1)+'_'+(y+1))+'_h',
				(x+'_'+(y+1))+'_h',
				((x-1)+'_'+(y+1))+'_h',
				((x-1)+'_'+y)+'_h',
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
JGH.getGreenAndHouses = function(cid) {
	var res, counth = 0, countg = 0, x, y, loc = cid.split('_');
	x = parseInt(loc[0],10);
	y = parseInt(loc[1],10);
	
	var neigh = JG.model.x;		//neighbourhood size

	//determine neighbours n, ne, se, s, sw, nw 
	if(x%2 === 1) {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			((x-1)+'_'+(y-1))+'_h',
			];
	} else {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			((x+1)+'_'+(y+1))+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			];
	}	

	//go through each cell n, ne, se, s, sw, nw
	for(var i = 0; i < id_array.length; i++) {
		res = JGH.hexSpiral( id_array[i], i, 1, neigh, true);
		countg = countg + res.g;
		counth = counth + res.h;
	}
	
	//return an object that contains the green and house proportions in the neighbourhood
	return {g: countg/Math.pow((neigh*2)+1,2), h: counth/Math.pow((neigh*2)+1,2)};
}

//calculate the field indirect utility of each cell
JGH.fieldUtil = function() {
	var x = JGH.constants.cw;
	var y = JGH.constants.ch;
	
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
			theid = i+'_'+j+'_h';
			cell = JGH.data[theid];
			if(cell.type === 'field' && cell.rd) {
				//if the cell is a field cell:
				dist = cell.rd + JGH.data[cell.crid].cbdd; //get total distance to cbd across fields and roads
				EHcount = JGH.getGreenAndHouses(theid);
				E = Math.pow(Math.pow(Math.E,EHcount.g),beta);
				S = Math.pow(Math.pow(Math.E,Math.sqrt(EHcount.h)),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;									//ignores road cost
				//iu = (inc - ((JGH.constants.roadnum * phi)/(JGH.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost
				iu = (inc - (((JGH.constants.roadnum + JGH.data[theid].rd) * phi)/(JGH.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost & added road cost to reach cell
				
				JGH.data[theid].iu = iu;
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//builds a road from a new house to an existing road
JGH.buildRoadCA = function buildRoadCA(houseid) {
	var target_road_id = JGH.data[houseid].crid,
		road_dist = JGH.data[houseid].rd,
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
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			((x-1)+'_'+(y-1))+'_h',
			];
	} else {
		var id_array = [
			(x+'_'+(y-1))+'_h',
			((x+1)+'_'+y)+'_h',
			((x+1)+'_'+(y+1))+'_h',
			(x+'_'+(y+1))+'_h',
			((x-1)+'_'+(y+1))+'_h',
			((x-1)+'_'+y)+'_h',
			];
	}
	
	var cell;
	
	//go through each cell n, ne, se, s, sw, nw
	for(var i = 0; i < id_array.length; i++) {
		cell = JGH.data[id_array[i]];
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
		JGH.print('Failed to find the direction to build the road:' + houseid);
		return false;
	}
	
	//we want to build on the one with the same 'crid' and the lowest 'rd'
	JSVG.setAttr(best_dir, 'class', 'road');
	JGH.data[best_dir].type = 'road';
	JGH.constants.roadnum = 1 + JGH.constants.roadnum;
	
	//call recursively
	return buildRoadCA(best_dir);
}

//finds the highest indirect utility and adds a house at that location
JGH.addHouse = function() {
	var highiu = 0;
	var chosen_cell_id = '';
	var thisiu = 0;
	
	var x = JGH.constants.cw;
	var y = JGH.constants.ch;
	var i = j = 0;
	
	while(i < x) {
		while(j < y) {
			//this will go through all cells
			theid = i+'_'+j+'_h';
			thisiu = JGH.data[theid].iu;
			
			//only cells that are fields, can connect to a road and have a higher utility
			if(JGH.data[theid].type === 'field' && JGH.data[theid].rd !== '' && thisiu > highiu) {
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
		JG.results.failh = 'Too expensive';
		//JGH.print('Cannot place any more houses, negative utility');
		return false;
	} else if(chosen_cell_id === '') {
		JG.results.failh = 'No road access';
		//JGH.print('Cannot place any more houses, no more road access')
		return false;
	}
	
	//found house place it and do any other adjustments
	JSVG.setAttr(chosen_cell_id, 'class', 'house');
	JGH.data[chosen_cell_id].type = 'house';
	JGH.constants.housenum = 1 + JGH.constants.housenum;
	
	//finished, return true to continue, will return false if an error is encountered
	return JGH.buildRoadCA(chosen_cell_id);
}

//the main cellular automata loop
JGH.doCA = function() {
	var origin = JGH.constants.origin;

	//clear the distance to roads for all non road cells
	//and set roads to 0, and dist to cbd to 998
	JGH.clearRoadDist();

	//calculate distance to road of all cells
	JGH.roadDistCA(origin, 0, origin);
	
	//calculate distance or road cells to cbd
	JGH.roadCBDDistCA(origin, 0);
	
	//calculate indirect utility for each field cell
	JGH.fieldUtil();

	//adds house to city
	return JGH.addHouse();
}

//calculate total travel distance for all houses
JGH.sumHouse2CBDTravel = function() {

	//get number of cells wide/heigh	
	var x = JGH.constants.cw;
	var y = JGH.constants.ch;
	var i = j = k = 0, n, nc, cell, minCBD = 999, totalCBD = 0;

	//go through each cell in lattice
	while(i < x) {
		j = 0;
		while(j < y) {
			cell = JGH.data[i+'_'+j+'_h'];
			minCBD = 999;
			//if cell is a field start checking neighbours
			if(cell && cell.type === 'house') {
				//JG.print(i+'_'+j+' ');//TESTING
				//determine neighbours n, ne, se, s, sw, nw 
				if(i%2 === 1) {
					n = [
						(i+'_'+(j-1))+'_h',
						((i+1)+'_'+(j-1))+'_h',
						((i+1)+'_'+j)+'_h',
						(i+'_'+(j+1))+'_h',
						((i-1)+'_'+j)+'_h',
						((i-1)+'_'+(j-1))+'_h',
					];
				} else {
					n = [
						(i+'_'+(j-1))+'_h',
						((i+1)+'_'+j)+'_h',
						((i+1)+'_'+(j+1))+'_h',
						(i+'_'+(j+1))+'_h',
						((i-1)+'_'+(j+1))+'_h',
						((i-1)+'_'+j)+'_h',
					];
				}

				for(k = 0; k < n.length; k++) {
					nc = JGH.data[n[k]];
					if(nc && nc.type === 'road' && nc.cbdd < minCBD) {
						minCBD = JGH.data[n[k]].cbdd;
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

	JG.results.atdh = totalCBD/JGH.constants.housenum;
};


//displays results/analysis
JGH.summaryAnalysis = function(run_time) {
	
	var x = JGH.constants.cw, y = JGH.constants.ch;
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
			theid = i+'_'+j+'_h';
			cell = JGH.data[theid];
			if(JGH.data[theid].type === 'house') {

				//re-evaluate utility of houses
				dist = cell.rd + JGH.data[cell.crid].cbdd; //get total distance to cbd across fields and roads
				EHcount = JGH.getGreenAndHouses(theid);
				E = Math.pow(Math.pow(Math.E,EHcount.g),beta);
				S =	Math.pow(Math.pow(Math.E,Math.sqrt(EHcount.h)),gamma);
				//iu = (inc - (theta * dist))*Math.pow(phi,-alpha)*E*S;		//ignores road cost
				//iu = (inc - ((JGH.constants.roadnum * phi)/(JGH.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost
				iu = (inc - (((JGH.constants.roadnum + JGH.data[theid].rd) * phi)/(JGH.constants.housenum + 1)) - (theta * dist))*Math.pow(phi,-alpha)*E*S;	//includes road cost & added road cost to reach cell
				
				JGH.data[theid].iu = iu;
				
				//record to global for visualization
				if(JGH.constants.miniu > iu) {
					JGH.constants.miniu = iu;
				}
				if(JGH.constants.maxiu < iu) {
					JGH.constants.maxiu = iu;
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
			theid = i+'_'+j+'_h';
			cell = JGH.data[theid];
			if(JGH.data[theid].type === 'house') {	
				//color the cells
				JSVG.setAttr(theid,'class','');
				var hex = parseInt((16+(JGH.data[theid].iu - JGH.constants.miniu)*(239/(JGH.constants.maxiu - JGH.constants.miniu))),10).toString(16);
				JSVG.setStyle(theid, 'fill', '#ff' + hex + '' + hex);
			}
			j = j + 1;
		}
		j = 0;
		i = i + 1;
	}
}

//EOF
