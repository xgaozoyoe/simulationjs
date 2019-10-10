/*  
    dfs : The standard depth search algorithm
    fn_get_actions : state -> Array (step: state -> state, roll_back: state->state) : get all the actions and put them into the 
    fn_record_success : state -> void : record the successful state
    fn_success : sate-> bool : check wheter a state is a successful state
*/
function dfs(state, fn_get_actions, fn_record_success, fn_success, debug) {
    var action_stack = new Array();
    var results = new Array();
    var rollback_stack = new Array();
    var step_forward = function(s) {
        var actions = fn_get_actions(s);
        actions.forEach(function(act){
            action_stack.push(act);
        });
        if (actions.length) {
          return true;
        } else {
          return false;
        }
    }
    var s = state;
    step_forward(s);

    var sc = function(){
    	var action = action_stack[action_stack.length-1]; 
        if(!action){
            alert(state.result.length);
        }
        if (action.done) {
            if(fn_success(s)) {
                results.push(fn_record_success(s));
            } 
            s = action.rollback(s);
            action_stack.pop();
        } else {
          s = action.step(s);
          step_forward(s);
          action.done = true;
        }
    }
    if (debug) {
        state.debug = sc;
	state.result = results;
    } else {
        while(action_stack.length) {
            sc();
        }
	state.result = results;
    }
}

function get_adjcent_nodes(map, loc){
    var nodes = new Array();
    if(map.get_tile(loc.x, loc.y).index != 0){
        return nodes;
    }
    if(map.offset(loc, -1, 0)){
       if(!map.get_tile(loc.x - 1, loc.y).searched) {
           nodes.push(new coordinate(loc.x - 1, loc.y));
       }
    }
    if(map.offset(loc, 0, -1)){
       if(!map.get_tile(loc.x, loc.y - 1).searched) {
           nodes.push(new coordinate(loc.x, loc.y - 1));
       }
    }
    if(map.offset(loc, 1, 0)){
       if(!map.get_tile(loc.x + 1, loc.y).searched) {
           nodes.push(new coordinate(loc.x + 1, loc.y));
       }
    }
    if(map.offset(loc, 0, 1)){
       if(!map.get_tile(loc.x, loc.y + 1).searched) {
           nodes.push(new coordinate(loc.x, loc.y + 1));
       }
    }
    return nodes;
}

function fn_get_actions(state_2d) {
    var nodes = state_2d.nodes;
    var funcs = new Array();
    for(var i=0; i<nodes.length; i++) {
        var node = nodes[i];
        var nodeloc = node[node.length-1].loc;
        var following_locs = get_adjcent_nodes(state_2d.map, node[node.length-1].loc);
        if (following_locs.length == 0){
            if(node[node.length - 1].index != state_2d.map.get_tile(nodeloc.x, nodeloc.y).index){//a dead search here
                return (new Array());
            }
        } else { //following_locs.length != 0
            following_locs.forEach(function(loc){
                var scope = {loc:loc, index:node[0].index, node_stack:node};
                var act = new function(){}; 
                act.step = function(s){
                    scope.node_stack.push({index:scope.index, loc:scope.loc});
                    state_2d.map.get_tile(scope.loc.x, scope.loc.y).searched = true;
                    return state_2d;
                }
                act.rollback = function(s) {
                    scope.node_stack.pop();
                    state_2d.map.get_tile(scope.loc.x, scope.loc.y).searched = false;
                    return state_2d;
                }
                funcs.push(act);
            });
            return funcs;
        }
    }
    //alert("record solution!!!");
    return funcs;
}

function fn_record_success(state_2d) {
    var nodes = state_2d.nodes;
    var success = new Array();
    //alert("record solution!!!");
    nodes.forEach(function(nodelist){
        success.push(new Array());
        nodelist.forEach(function(node){
            success[success.length-1].push(node);
        });
    });
    return success;
}

function fn_success(state_2d) {
    var nodes = state_2d.nodes;
    for(var i=0;i<nodes.length;i++){
        nodelist = nodes[i];
        var loc = nodelist[nodelist.length-1].loc;
        if(nodelist[nodelist.length - 1].index != state_2d.map.get_tile(loc.x, loc.y).index){
            return false;
        }
    }
    return true;
}

function auto_connect(map, pairs, debug) {
    var state_2d = {nodes:new Array(), map:map};
    var tag = 1;
    for(var x = 0; x < map.width; x++){
        for(var y = 0; y < map.width; y++){
            map.get_tile(x,y).index = 0;
            map.get_tile(x,y).searched = false;
        }
    }
    pairs.forEach(function(pair){
       var start = pair.start;
       var end = pair.end;
       map.get_tile(start.x, start.y).index = 0;
       map.get_tile(start.x, start.y).searched = true;
       var node_stack = new Array();
       state_2d.nodes.push(node_stack);
       node_stack.push({index:tag, loc:new coordinate(start.x, start.y)});
       map.get_tile(end.x, end.y).index = tag;
       tag ++;
    });
    dfs(state_2d, fn_get_actions, fn_record_success, fn_success, debug);
    return state_2d;
}

function gen_one_river(map){
    var y = rand_integer(map.height / 2);
    var loc = new coordinate(0,y, map);
    var next_loc = null;
    map.get_tile(loc.x,loc.y).set_type(TileCategory.TILE_RIVER);
    loc.x +=1;
    map.get_tile(loc.x,loc.y).set_type(TileCategory.TILE_RIVER);
    while(loc.y!= map.height - 1 ) {
        var d = rand_integer(2) + 1;
        if (d==0) {
            next_loc = map.offset(loc, -1, 0);
        } else if (d==1) {
            next_loc = map.offset(loc, 0, 1);
        } else if (d==2) {
            next_loc = map.offset(loc, +1, 0);
        } else if (d==3) {
            next_loc = map.offset(loc, 0, -1);
        }
        if (next_loc == null){
            continue;
        } else {
            map.get_tile(next_loc.x,next_loc.y).set_type(TileCategory.TILE_RIVER);
            loc = next_loc;
            next_loc = null;
        }
    }
}

function gen_river(map){
    for(var i=0; i<2; i++){
        gen_one_river(map);
    }
}
