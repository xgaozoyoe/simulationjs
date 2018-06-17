/*
function gen_roads(color_matrix, s, e) {
  var roads = new Array();
  var targets = new Array();
  var searching_space = new Array();
  s.forEach(function(start_point){
    roads.push(s);
    mark_matrix(color_matrix,s);
  }
  e.forEach(function(end_point) {
    targets.push(e);
  })
  while(true){
    var extension = get_extension(color_matrix, roads);
    extension.forEach(function(extension){
        targets.push(extension);
    });
    if (extension.length == 0){
        if(all_targets_satisfied(targets)){
        }
    }
}
*/

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
