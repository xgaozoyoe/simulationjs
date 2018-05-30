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

