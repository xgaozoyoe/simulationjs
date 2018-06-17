var world = {agents:null, death:null, events:new Array()};

function global_env(){
	return world;
}
world.die = function(agent){
	for (var i = 0; i<this.agents.length; i++){
		if(this.agents[i] == agent) {
			this.agents.splice(i,1);
		}
	}
	this.death.push(agent);
}
world.birth = function(agent){
    this.agents.push(agent);
}

var gen_resource = function(tile) {
    var c = rand_integer(10);
    if (c <=5) {
        tile.set_type(TileCategory.TILE_SOIL);
        tile.add_resource(new ResourceVeg(rand_integer(150)+150, 3, 15, 10));
    } else {
        tile.set_type(TileCategory.TILE_SAND);
    }
}

var gen_map = function (width, height) {
	var m = new map(width, height);
    gen_river(m);
	for (var i=0; i<width; i++) {
		for (var j=0; j<height; j++) {
            var tile = m.get_tile(i,j);
            if (tile.type == 0) {
                gen_resource(tile);
            }
		}
	}
	return m;
}

/* Draw agent */
var rend_agent = function(agent){
	/* some dumb code for rendering purpose, which should be moved out */
    var x = agent.loc.x + ((agent.action_slice - agent.slice)* 1.0 * (agent.target_loc.x - agent.loc.x) /
         agent.action_slice) + 0.5;
    var y = agent.loc.y + ((agent.action_slice - agent.slice)* 1.0 * (agent.target_loc.y - agent.loc.y) /
        agent.action_slice) + 0.5;
	agent.pos_y = ((x + y)*1.0/2 - 3) * MIN_MOVE_GAP * 0.5 + (1 - rand_integer(3));
	agent.pos_x = (x - y + map_size - 10)/2 * MIN_MOVE_GAP - (1 - rand_integer(3));
}

var gen_agents = function (map, num) {
	var agents = [];
	var i = 0;
	for (var i = 0; i<num; i++) {
		var pos = new coordinate(rand_integer(map_size), rand_integer(map_size), map);
		var attributes = new AgentAttribute(2, 0.8, rand_integer(3)+1, rand_integer(4)+1, 20 , 3);
		agents[i] = new Agent(i, pos, map, attributes, normal_actions);
        agents[i].add_preference(ResourceCategory.RESOURCE_VEG);
        rend_agent(agents[i]);
	}
	return agents;
}

function reproduce(mother, init_actions)
{
    mother.attributes.reproduce_slice -= 1;
    if (mother.attributes.reproduce_slice == 0) {
    	var rx = rand_integer(3) - 1;
	    var ry = rand_integer(3) - 1;
	    var loc = mother.map.offset(mother.loc,rx,ry);
        if (loc) {
		    // Initialize attributes for a new baby
		    var attributes = new AgentAttribute(mother.attributes.view_distance,
			mother.attributes.lambda,
			mother.attributes.speed,
			mother.attributes.intelligence,
			20, mother.attributes.reproduce_rate); // 20 energy for a new baby might be too much ?

        	birth = new Agent(mother.id, loc, mother.map, attributes, init_actions);
            global_env().birth(birth);
            mother.attributes.slice += 100;
        }
        mother.attributes.reproduce_slice = mother.attributes.reproduce_rate;
    }
}

/* Setup the html demo application */

var app = angular.module('myApp', []);

var map_size = 20;
// Create a map of 20 * 20
var map = gen_map(map_size, map_size);


var total_agents = 10;
// Create 10 agents distributed randomly
var agents = gen_agents(map, total_agents);
var corpses = new Array();
world.death = corpses;
world.next_wave_count = 100;



var step = function() {
	map.regenerate_resource();
    world.next_wave_count -=1;	
    agents.forEach(function(agent){
        agent.step();
    });

    agents.forEach(function(agent){
        rend_agent(agent);
    });

    if (world.next_wave_count == 0){
        world.next_wave_count = 100;
		var attribute = new AgentAttribute(3, 0.9, 5, 3, 30, 20);
        var birth = new Agent(1001, new coordinate(10,10,map) , map, attribute, predator_actions);
        global_env().birth(birth);
    }

}
var clear;

world.agents = agents;
app.controller('ctrl', function($scope,$interval) {
	$scope.map = map;
    $scope.agents = agents;
	$scope.death = corpses;
	$scope.focus = agents[0];
	$scope.focus_agent = function(f){
		$scope.focus = f;
	}
	$scope.start = function(){
		//step();
		clear = $interval (step,100);
	}
	$scope.end = function(){
		$interval.cancel(clear);
	}
	$scope.learn = function(){
		$scope.focus.learn();
	}
	$scope.step = function(){
		$scope.focus.step();
	}
    $scope.gen_resource_img = function(val) {
        return "./nova/png/coniferAltShort.png";
    }
    $scope.gen_resource_sz = function(val) {
        return val.resource_volumn * 3;
    }
	$scope.gen_tile_image = function(val) {
        if (val.type == TileCategory.TILE_RIVER) {
            var east = map.get_tile_option(val.loc.x, val.loc.y-1);
            var south = map.get_tile_option(val.loc.x+1, val.loc.y);
            var west = map.get_tile_option(val.loc.x, val.loc.y+1);
            var north = map.get_tile_option(val.loc.x-1, val.loc.y);
            var adj = [];
            adj[0]=east;
            adj[1]=south;
            adj[2]=west;
            adj[3]=north;
            var adjwater = 0;
            for(var i=0;i<4;i++){
                if(adj[i] && adj[i].type == TileCategory.TILE_RIVER) {
                    adjwater += 1;
                }
            }
            if (adjwater == 0) { // flat water pool
		        return "url(./nova/png/water.png)";
            }
            if (adjwater == 1) { // flat water pool
                if (east && east.type == TileCategory.TILE_RIVER) {
		            return "url(./nova/png/riverEW.png)";
                }
                if (south && south.type == TileCategory.TILE_RIVER) {
		            return "url(./nova/png/riverNS.png)";
                }
                if (west && west.type == TileCategory.TILE_RIVER) {
		            return "url(./nova/png/riverEW.png)";
                }
                if (north && north.type == TileCategory.TILE_RIVER) {
		            return "url(./nova/png/riverNS.png)";
                }
            }
            if (adjwater == 2) { // flat water pool
                if (east && east.type == TileCategory.TILE_RIVER) {
                    if (south && south.type == TileCategory.TILE_RIVER) {
		                return "url(./nova/png/riverES.png)";
                    }
                    if (north && north.type == TileCategory.TILE_RIVER) {
		                return "url(./nova/png/riverNE.png)";
                    }
		            return "url(./nova/png/riverEW.png)";
                }
                if (west && west.type == TileCategory.TILE_RIVER) {
                    if (south && south.type == TileCategory.TILE_RIVER) {
		                return "url(./nova/png/riverSW.png)";
                    }
                    if (north && north.type == TileCategory.TILE_RIVER) {
		                return "url(./nova/png/riverNW.png)";
                    }
                }
                if (west && west.type == TileCategory.TILE_RIVER) {
		            return "url(./nova/png/riverEW.png)";
                } else{
		            return "url(./nova/png/riverNS.png)";
                }
            }
            if (adjwater == 3) { // flat water pool
                if (east && east.type != TileCategory.TILE_RIVER) {
		            return "url(./nova/png/waterE.png)";
                }
                if (west && west.type != TileCategory.TILE_RIVER) {
		            return "url(./nova/png/waterW.png)";
                }
                if (south && south.type != TileCategory.TILE_RIVER) {
		            return "url(./nova/png/waterS.png)";
                }
                if (north && north.type != TileCategory.TILE_RIVER) {
		            return "url(./nova/png/waterN.png)";
                }
            }
            if (adjwater == 4) { // flat water pool
		        return "url(./nova/png/water.png)";
            }
		    return "url(./nova/png/beach.png)";

        } else if (val.type == TileCategory.TILE_SAND) {
		    return "url(./nova/png/beach.png)";
        } else {
		    return "url(./nova/png/grass.png)";
        }
	}

	$scope.gen_id_image = function(val) {
        if (val > 1000){
            return "url(./monsters/pred-monster-1.png)";
        }else{
            return "url(./monsters/spiky-monster.png)";
        }
	}
    $scope.grid_size = MIN_MOVE_GAP;
    $scope.grid_top = function(x,y) {
        return ((x + y)*1.0/2 - 3) * (this.grid_size * 0.5);
    }
    $scope.grid_left = function(x,y) {
        return ((x - y + map_size - 10)/2) * this.grid_size;
    }

    $scope.world = world;
});
