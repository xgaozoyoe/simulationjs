var ActionCategory = {
	ACTION_MOVE:1,
	ACTION_AFFEND:2,
	ACTION_DEFEND:3,
	ACTION_COLLECT:4,
    ACTION_HUNT:5
}

var ResourceCategory = {
    RESOURCE_VEG:1,
    RESOURCE_JUNK:2,
    RESOURCE_MANURE:3
}

function ResourceVeg(reg_rate,reg_volumn, max_volumn, start_volumn) {
    this.resource_type = ResourceCategory.RESOURCE_VEG;
    this.regen_rate = reg_rate;
    this.regen_volumn = reg_volumn;
    this.max_volumn = max_volumn;
    this.res_volumn = res;
    this.slice = 0;
   	this.regenerate = function() {
		if (this.slice == this.reg_rate){
			this.slice = 0;
			this.res_volumn += this.regen_volumn;
		}else{
			this.slice += 1;
		}
	}
    this.consume = function (volumn) {
        if(this.res_volumn >= volumn) {
            this.res_volumn -= volumn;
            return volumn;
        } else {
            var c = this.res_volumn;
            this.res_volumn = 0;
            return c;
        }
    }
}

/* Action is defined by triple functions (act * attempt * gain)
var Action = function(name, category, act, attempt, gain){
    this.name = name;
	this.category = category;
    this.do = act;
    this.attempt = attempt;
    this.gain = gain;
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

var gain_move = function (map, loc, action, caster) {
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

var np_stay = function(loc, agent){
	var map = loc.map;
    var res = map.get_tile(agent.loc.x, agent.loc.y).get_resource_by_type(agent.resource_preference);
    /* Consume resource if this tile's resource is in the agents's preference list */
    if(res) {
        agent.attributes.energy += res.consume(4);
        agent.slice = 2;
    }
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
