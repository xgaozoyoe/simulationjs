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

var gen_resource = function() {
    var c = rand_integer(4);
    if (c <=2) {
        return (new ResourceVeg(rand_integer(150)+150, 3, 15, 10));
    } else {
        return (new ResourceWater(rand_integer(150)+150, 3, 15, 10));
    }
}

var gen_map = function (width, height) {
	var m = new map(width, height);
	for (var i=0; i<width; i++) {
		for (var j=0; j<height; j++) {
			m.get_tile(i,j).add_resource(gen_resource());
		}
	}
	return m;
}

/* Draw agent */
var rend_agent = function(agent){
	/* some dumb code for rendering purpose, which should be moved out */
	//agent.pos_x = agent.loc.x * MIN_MOVE_GAP - (agent.size-MIN_MOVE_GAP + 2)/2;
	//agent.pos_y = agent.loc.y * MIN_MOVE_GAP - (agent.size-MIN_MOVE_GAP + 2)/2;
	agent.pos_x = agent.loc.x * MIN_MOVE_GAP + (5 - rand_integer(9));
	agent.pos_y = agent.loc.y * MIN_MOVE_GAP - (5 - rand_integer(9));
}

var gen_agents = function (map, num) {
	var agents = [];
	var i = 0;
	for (var i = 0; i<num; i++) {
		var pos = new coordinate(5 + rand_integer(25), 5 + rand_integer(25), map);
		var attributes = new AgentAttribute(2, 0.8, rand_integer(10)+1, rand_integer(4)+1, 20 , 3);
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

// Create a map of 20 * 20
var map = gen_map(30,30);


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
	$scope.gen_gray_color = function gen_gray_color(val) {
        if (val.resource[0].resource_type == ResourceCategory.RESOURCE_WATER) {
		    var char = (0xff - val.resource[0].resource_volumn).toString(16);
		    return "0000" + char;
        } else {
		    var char = (0xff - val.resource[0].resource_volumn).toString(16);
		    return "00" + char + "00";
        }
	}
	$scope.gen_id_color = function gen_gray_color(val) {
        if (val > 1000){
		    var char = ((val - 1000)).toString(16);
            return "ff2342";
        }else{
		    var char = ((val)).toString(16);
            return "22f345"
        }
	}

    $scope.world = world;
});
