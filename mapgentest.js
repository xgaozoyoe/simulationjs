var world = {agents:null, death:null, events:new Array()};

var gen_map = function (width, height) {
    var m = new map(width, height);
    return m;
}
/* Setup the html demo application */

var app = angular.module('myApp', []);

var map_size = 8;
var map = gen_map(map_size, map_size);

var pairs = new Array();
/*
pairs.push({start:new coordinate(0,0), end:new coordinate(4,4)});
pairs.push({start:new coordinate(2,1), end:new coordinate(3,2)});
pairs.push({start:new coordinate(2,2), end:new coordinate(4,2)});
pairs.push({start:new coordinate(1,3), end:new coordinate(4,3)});
*/

/*
pairs.push({start:new coordinate(0,0), end:new coordinate(5,5)});
pairs.push({start:new coordinate(1,0), end:new coordinate(2,1)});
pairs.push({start:new coordinate(2,0), end:new coordinate(1,2)});
pairs.push({start:new coordinate(3,1), end:new coordinate(3,3)});
pairs.push({start:new coordinate(3,2), end:new coordinate(2,3)});
*/

pairs.push({start:new coordinate(4,0), end:new coordinate(7,1)});
/*
pairs.push({start:new coordinate(1,1), end:new coordinate(2,5)});
pairs.push({start:new coordinate(1,2), end:new coordinate(4,4)});
pairs.push({start:new coordinate(7,3), end:new coordinate(4,5)});
pairs.push({start:new coordinate(5,4), end:new coordinate(6,6)});
pairs.push({start:new coordinate(1,6), end:new coordinate(5,6)});
*/
var results = auto_connect(map, pairs, true);
var clear;

function step(){
    results.debug();
}

app.controller('ctrl', function($scope,$interval) {
    $scope.map = map;
    $scope.grid_size = 50;
    $scope.world = world;
    $scope.solutions = results;
    $scope.debug = function(){
        clear = $interval (step,1);
    }
    $scope.step = function(){
        while(true){
          step();
        }
    }
    $scope.end = function(){
        $interval.cancel(clear);
    }
});
