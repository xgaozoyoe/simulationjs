var rand_integer = function(ceil) {
	return Math.floor(ceil * Math.random ());
}

function get_attr(scope, keystr) {
    keys = keystr.split(".");
    v = scope;
    for(var i=0;i<keys.length;i++) {
        v = v[keys[i]];
    }
    return v;
}
