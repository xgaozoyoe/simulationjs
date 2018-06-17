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


function Tile(loc) {
    this.loc = loc;
    this.type = 0;
    this.resource = new Array();
    this.agents = new Array();
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
    this.regenerate_resource = function(){
        this.resource.forEach(function(res) {
            res.regenerate();
        });
    }
    /* return the first resource found in the preference_list */
    /* FIXME: needs optimize */
    this.get_resource_by_type = function(preference_list){
        var resources = this.resource;
        var ret = null;
        preference_list.forEach(function(preference){
           resources.forEach(function(resource){
               if(resource.resource_type == preference){
                   ret = resource;
               }
           });
        });
        return ret;
    }
    this.add_resource = function(resource) {
        this.resource.push(resource);
    }
    this.set_type = function(type){
        this.type = type;
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

    /* Initialize all the tiles */

    this.tiles = new Array();

    for (var i=0; i<width; i++) {
        for (var j=0; j<height; j++) {
            this.tiles[j * width + i] = new Tile({x:i, y:j});
        }
    }

    /* Recalculate resource */
    this.regenerate_resource = function(){
        for (var i=0; i<width; i++) {
            for (var j=0; j<height; j++) {
                this.tiles[j * width + i].regenerate_resource();
            }
        }
    }

    this.get_tile = function(x,y){
        return this.tiles[y*width + x];
    }

    this.get_tile_option = function(x,y) {
        if(x>=0 && x <= this.width && y>=0 && y< this.height) {
            return this.get_tile(x,y);
        } else {
            return null;
        }
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

var MIN_MOVE_GAP = 100;
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
    this.resource_preference = new Array();
    this.action = null;
    this.target_loc = loc;

    this.death_check = function(){
        return (this.attributes.energy <= 0);
    }

    this.actions = new Array();

    this.reproduce_check = function(){
        return (this.attributes.energy > 100);
    }

    this.step_finish = function() {
        if (this.death_check()) {
            this.map.get_tile(this.loc.x, this.loc.y).agent_die_hook(this);
            global_env().die(this);
        }
        if (this.reproduce_check()) {
            reproduce(this, init_actions);
        }
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

            this.step_finish();    
            this.loc = this.target_loc;
            this.map.get_tile(this.loc.x, this.loc.y).agent_enter_hook(this);
            this.train(this.attributes.intelligence);

            var aid = this.policy(this.loc);
            var loc = this.actions[aid].do(this.loc,this);
            for(var i=0;i<this.actions.length;i++){
                this.view[i].coordinate_shift(loc.x - this.loc.x, loc.y - this.loc.y);
            }
            this.map.get_tile(this.loc.x, this.loc.y).agent_leave_hook(this);
            this.target_loc = loc;
        } else {
            this.slice = this.slice - this.attributes.speed;
        }
    }

    this.learn();
    this.slice = 20;
    this.action_slice = 20;
    this.map.get_tile(this.loc.x, this.loc.y).agent_enter_hook(this);

/* Preference attributes */
    this.add_preference = function(resource) {
        this.resource_preference.push(resource);
    }
    
}

