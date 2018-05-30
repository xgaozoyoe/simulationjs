/* x must in width range and y must in height range */

var box_boundary_out = function(top, right, bottom, left, loc) {
    return (loc.x < left || loc.x >= right || loc.y < top || loc.y >= bottom);
}

function map_boundary(map) {
	var fn = function(loc) {
		return box_boundary_out(0,map.width,map.height,0,loc);
	}
	return fn;
}

function coordinate(x, y, map) {
	this.map = map;
	this.x = x;
	this.y = y;
}

function tile(loc, res) {
	this.loc = loc;
	this.res = res;
	this.reg = 0;
	this.regen_rate = 10;
	this.slice = 0;
    this.agents = new Array();
	this.regenerate = function(){
		if (this.slice == this.reg_rate){
			this.slice = 0;
			this.res += this.reg;
		}else{
			this.slice += 1;
		}
	}
    this.agent_enter_hook = function(agent){
	    this.agents.push(agent);
    }
    this.agent_leave_hook = function(agent){
    	for (var i = 0; i<this.agents.length; i++){
		    if(this.agents[i] == agent) {
			    this.agents.splice(i,1);
		    }
	    }
    }
    this.agent_die_hook = function(agent){
   	    for (var i = 0; i<this.agents.length; i++){
		    if(this.agents[i] == agent) {
			    this.agents.splice(i,1);
		    }
	    }
    }
}

function map(width, height) {
	this.width = width;
	this.height = height;
	this.boundary = [map_boundary(this)];
	this.offset = function(loc, x, y) {
		var new_loc = new coordinate(loc.x + x, loc.y + y, this);
		for(var i = 0; i < this.boundary.length; i++) {
			var out = this.boundary[i](new_loc);
			if (out) {
				return null;
			}
		}
		return new_loc;
	}
	this.tiles = new Array();
	for (var i=0; i<width; i++) {
		for (var j=0; j<height; j++) {
			this.tiles[j * width + i] = new tile({x:i, y:j}, 0);
			this.tiles[j * width + i].reg = rand_integer(5);
			this.tiles[j * width + i].reg_rate = rand_integer(10)+30;
		}
	}
	this.set_tile_resource = function(x, y, v){
		this.tiles[y * width + x ].res = v;
	}
	this.get_tile_resource = function(x,y) {
		return this.tiles[y * width + x].res;
	}

	this.regenerate = function(){
		for (var i=0; i<width; i++) {
			for (var j=0; j<height; j++) {
					this.tiles[j * width + i].regenerate();
			}
		}
	}
	this.get_tile = function(x,y){
		return this.tiles[y*width + x];
	}
}

var Action = function(name, category, act, attempt){
    this.name = name;
	this.category = category;
    this.do = act;
    this.attempt = attempt;
}

var ActionCategory = {
	ACTION_MOVE:1,
	ACTION_AFFEND:2,
	ACTION_DEFEND:3,
	ACTION_COLLECT:4,
    ACTION_HUNT:5
}
/* Standard movement action functor */
var move = function(direction) {
    var fn = function (loc, agent) {
		var attempt_loc = direction(loc);
        agent.slice += 10;
        agent.attributes.energy -=1;
		if (loc.map.offset(attempt_loc, 0, 0) != null) {
			return attempt_loc;
		} else {
			return loc;
		}
	}
	return fn;
}

var try_move = function(direction) {
    var fn = function (loc, agent) {
		var attempt_loc = direction(loc);
		if (loc.map.offset(attempt_loc, 0, 0) != null) {
			return attempt_loc;
		} else {
			return null;
		}
	}
	return fn;
}

var np_stay = function(loc, agent){
	var map = loc.map;
    var res = map.get_tile_resource(agent.loc.x, agent.loc.y);
    if (res >= 2) {
	    agent.attributes.energy += 1;
	    map.set_tile_resource(agent.loc.x, agent.loc.y,res - 2);
    } else {
	    agent.attributes.energy += map.get_tile_resource(agent.loc.x, agent.loc.y);
	    map.set_tile_resource(agent.loc.x, agent.loc.y,0);
    }
    agent.slice = 2;
	return loc;
}

var try_np_stay = function(loc, agent){
	return loc;
}


var p_stay = function(loc, agent){
    agent.slice = 4;
    agent.attributes.energy -= 1;
	return loc;
}

var try_p_stay = function(loc, agent){
	return loc;
}


var try_hunt = function(loc, agent){
    return loc;
}

var hunt = function(loc, agent){
    var tile = loc.map.get_tile(loc.x, loc.y);
    for(var i = 0; i<tile.agents.length; i++) {
        if(tile.agents[i].id < 1000) {
            agent.attributes.energy += tile.agents[i].attributes.energy;
            tile.agents[i].attributes.energy = 0;
            tile.agent_leave_hook(tile.agents[i]);
            return loc;
        }
    }
    return loc;
}

function _left(loc) {return new coordinate(loc.x-1, loc.y, loc.map);} 
function _right(loc) {return new coordinate(loc.x+1, loc.y, loc.map);} 
function _top(loc) {return new coordinate(loc.x, loc.y-1, loc.map);} 
function _bottom(loc) {return new coordinate(loc.x, loc.y+1, loc.map);} 

/* For general actions an agent can take */
var move_left =  new Action("MLeft", ActionCategory.ACTION_MOVE, move(_left), try_move(_left));
var move_right = new Action("MRight", ActionCategory.ACTION_MOVE, move(_right), try_move(_right));
var move_top = new Action("MTop", ActionCategory.ACTION_MOVE, move(_top), try_move(_top));
var move_bottom = new Action("MBottom", ActionCategory.ACTION_MOVE, move(_bottom), try_move(_bottom));
var non_predator_stay = new Action("NPMStay", ActionCategory.ACTION_COLLECT, np_stay, try_np_stay);

var predator_stay = new Action("PMStay", ActionCategory.ACTION_COLLECT, p_stay, try_p_stay);

var hunt = new Action("MHunt", ActionCategory.ACTION_HUNT, hunt, try_hunt);

var normal_actions = [non_predator_stay, move_left, move_right, move_top, move_bottom];
var predator_actions = [predator_stay, move_left, move_right, move_top, move_bottom, hunt];

var map_gain = function (map, loc, action, caster) {
	if (loc != null) {
		if (action.category == ActionCategory.ACTION_MOVE) {
			return 0;
		}
		if (action.category == ActionCategory.ACTION_COLLECT) {
            if (caster.id < 1000) {
			return map.get_tile_resource(loc.x, loc.y);
            }else{
                return 0;
            }
		}
        if (action.category == ActionCategory.ACTION_HUNT) {
            if (caster.attributes.energy > 30) {
                return 0;
            }
            var tile = loc.map.get_tile(loc.x, loc.y);
            if (tile.agents.length == 0){
                return 0;
            } else {
                for (var i=0;i<tile.agents.length;i++) {
                    if(tile.agents[i].id < 1000) {
                        //alert(i);
                        return tile.agents[i].attributes.energy;
                    }
                }
                return 0;
            }
        }
		console.error("unsupported action!");
	} else {
		return -1;
	}
}

var Matrix2D = function(width, height){
	/* An Array of Array */
	/* (0,0) (1,0) 
	   (0,1) (1,1)
	 */
	this.data = new Array();
	this.width = width;
	this.height = height;
	for (var j=0; j<this.height; j++) {
		this.data[j] = new Array();
		for (var i=0; i<this.width; i++) {
			this.data[j][i] = 0;
		}
	}
	
	this.coordinate = function(x, y){
		if (x>=0 && x<this.width && y>=0 && y<this.height){
			return this.data[y][x];
		} else {
			console.error("coordinate out of range");
		}
	}
	this.coordinate_set = function(x, y ,v){
		if (x>=0 && x<this.width && y>=0 && y<this.height){
			this.data[y][x] = v;
		} else {
			console.error("coordinate out of range");
		}
	}
	/* The row - column representation */
	this.rowcol = function(r, c) {
		return this.coordinate(c,r);
	}
	
	this.coordinate_silent = function(x, y){
		if (x>=0 && x<this.width && y>=0 && y<this.height){
			return this.data[y][x];
		} else {
			return 0;
		}
	}

	this.coordinate_shift = function(x, y){
		var r = new Array();
		/* FIXME: There might be massive memory leak here */
		for (var yy=0; yy<this.heigth; yy++) {
			this.data[yy] = new Array();
			for (var xx=0; xx<width; xx++) {
				this.data[yy][xx] = this.coordinate_silent(xx - x, yy - y);
			}
		}
	}
}

var MIN_MOVE_GAP = 20;
var AgentAttribute = function(view, lambda, speed, itg, energy, reprate) {
	this.view_distance = view;
	this.lambda = lambda;
	this.speed = speed;
	this.intelligence = itg;
	this.energy = energy;
	this.reproduce_rate = reprate;
	this.reproduce_slice = reprate;
}

/*  
 *  loc: coordinate, 
 *  map: map,
 */

var Agent = function (id, loc, map, attributes, init_actions) {

	// Main attributes of the agent
	this.id = id;
	this.loc = loc;
	this.map = map;
	this.view = new Array();
	this.size = 10;
	this.attributes = attributes;

	this.death_check = function(){
		return (this.attributes.energy <= 0);
	}

    this.actions = new Array();

	this.reproduce_check = function(){
		return (this.attributes.energy > 100);
	}

	// FIXME: the rendering attributes should be splited into another module
	this.render = function() {
		this.pos_x = this.loc.x * MIN_MOVE_GAP + (5 - rand_integer(9));
		this.pos_y = this.loc.y * MIN_MOVE_GAP - (5 - rand_integer(9));
	}

	this.step_finish = function() {
		if (this.death_check()) {
            this.map.get_tile(this.loc.x, this.loc.y).agent_die_hook(this);
			global_env().die(this);
		}
		if (this.reproduce_check()) {
			reproduce(this, init_actions);
        }
		this.render();
	}	

	this.add_action = function(action){
		this.actions[this.actions.length] = action;
		this.view[this.view.length] = new Matrix2D(2*this.attributes.view_distance + 1, 2*this.attributes.view_distance + 1);
	}

	// this.actions = generate_actions(this);
    // Extra actions
    for (var a=0; a<init_actions.length; a++) {
		this.add_action(init_actions[a]);
    }

	/* Given a coordinate, return its estimate if it is in the memory or view, else return 0 
         */
	this.estimate = function(aid, loc) {
		var d = this.attributes.view_distance;
		if ((loc.x - this.loc.x) + d >= 0 && (this.loc.x - loc.x) + d >= 0) {
			if ((loc.y - this.loc.y) + d >=0 && (this.loc.y - loc.y) + d >= 0) {
				// need to change coordinate back
				return this.view[aid].coordinate(loc.x - this.loc.x + d,loc.y - this.loc.y + d);
			} else {
				return 0;
			}
		} else { // This part can be extended to fits its AI 
			return 0;
		} 
	}
	this.policy = function(loc) {
		var max = -1; 
		var aid = -1;
        var rand = rand_integer(this.actions.length);
		for (var i=0; i<this.actions.length; i++) {
            var a = (rand + i) % this.actions.length; /* Start with random actions */
			var c = this.estimate(a, loc);
			if (c > max) {
				max = c;
				aid = a;
			}
		}
		return aid;
	}

/* The main learning function which only depends on estimate and policy and view */
	this.learn = function () {
		var d = this.attributes.view_distance;
		var vsize = 2 * this.attributes.view_distance + 1; // the size of the array of the view

		for(var i=0; i<this.actions.length; i++) {
			for (var offset_x = 0; offset_x < vsize; offset_x ++) {
				for (var offset_y = 0; offset_y < vsize; offset_y ++) {
					/* Get the location on the map of the view point in the view */
					var source_loc = this.map.offset(this.loc, offset_x - d, offset_y - d);
					if (source_loc == null) {
						this.view[i].coordinate_set(offset_x,offset_y,0);
					} else {
                        var result_loc = this.actions[i].attempt(source_loc,this);
                        if (result_loc) {
						    result_loc = this.map.offset(result_loc,0,0);
                        }
						if (result_loc == null) { // An invalid action
							this.view[i].coordinate_set(offset_x,offset_y,0);
						} else {
							this.view[i].coordinate_set(offset_x,offset_y,
									map_gain(this.map, result_loc, this.actions[i],this));
							var aid = this.policy(result_loc);
							if (aid >=0 ) {
								var potential_estimate = this.estimate(aid, result_loc);
								this.view[i].coordinate_set(offset_x,offset_y,
									this.view[i].coordinate(offset_x, offset_y)
										+ Math.floor(0.5 * potential_estimate));
							}
						}
					}
				}
			}
		}
	}

/* Train the agent for serveral rounds depends on its intelligence */
	this.train = function(round) {
		for (var i=0; i<round; i++) {
			this.learn();
		}
	}

	this.step = function() {
		if (this.slice <= 0) {
			var aid = this.policy(this.loc);
			var loc = this.actions[aid].do(this.loc,this);
			for(var i=0;i<this.actions.length;i++){
				this.view[i].coordinate_shift(loc.x - this.loc.x, loc.y - this.loc.y);
			}
            this.map.get_tile(this.loc.x, this.loc.y).agent_leave_hook(this);
			this.loc = loc;
            this.map.get_tile(this.loc.x, this.loc.y).agent_enter_hook(this);

			this.step_finish();	
			this.train(this.attributes.intelligence);
		} else {
			this.slice = this.slice - this.attributes.speed;
		}
	}

	this.learn();
	this.slice = 20;
    this.map.get_tile(this.loc.x, this.loc.y).agent_enter_hook(this);
	
	/* some dumb code for rendering purpose, which should be moved out */
	this.pos_x = this.loc.x * MIN_MOVE_GAP - (this.size-MIN_MOVE_GAP + 2)/2;
	this.pos_y = this.loc.y * MIN_MOVE_GAP - (this.size-MIN_MOVE_GAP + 2)/2;

}

