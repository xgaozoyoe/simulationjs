class World {
  map: Array <Array <Area> >;
  agents:Array<Agent>;
  events:Array<Events>;
  constructor(size_x: number, size_y: number) {
    this.map = new Array(size_x);
    for (var x=0;x<size_x;x++) {
      this.map[x] = new Array(size_y);
      for (var y=0;y<size_y;y++) {
        this.map[x][y] = new Area(new Loc(x,y),new Turf());
      }
    }
  }
  function pos_to_area(loc: Location) {
    return map[loc.loc_x, loc.loc_y];
  }
}

/* Location */
class Loc {
  loc_x:number;
  loc_y:number;
  constructor(x:number, y:number) {
    this.loc_x = x;
    this.loc_y = y;
  }

}

/* Surface attributes of an Area. */
class Turf {
}

/* Elements of map, which contains agents, resouce and turf ... etc */
class Area {
  location: Loc;
  stacked_agents: Array<Agent>;
  stacked_resource: Array<Resource>;
  turf: Turf;
  constructor(loc: Loc, turf:Turf) {
    this.location = loc;
    this.turf = turf;
    this.stacked_agents = [];
    this.stack_resource = [];
  }
  function AgentLeave(agent:Agent) {
    var index = this.stacked_agents.indexOf(agent, 0);
    if (index > -1) {
      this.stacked_agents.splice(index, 1);
    }
  }
  function AgentEnter(agent:Agent) {
    this.stacked_agents.push(agent);
  }
}

/* The most basic agent that barely describes the meaning of each functionality */
class Agent {
  vision: Vision;
  area: Area;
  event_queue: Array<Event>;
  action_queue：Array<Action>;
  function step() {
    for 
    if(this.action_queue.length) {
      act = this.action_queue[0];
      try {
        act.step(this);
      }
      catch (e){
        this.handle_step_exception(e);
      }
    }
  }
  function calculate_next_action() {
    return new ActionDumb();
  }
  function handle_step_exception() {
    return;
  }
}

class Vision {
  function snapshot(world: World): Array<Area> {
    return [];
  }
}

class Ability {

}
/* The most trivial ability which is stay and doing nothing */
class Dumb extends Ability {
  function step(agent: Agent, area: Area) { 
  }
}

class Move extends Ability {
  function step(agent: Agent, area: Area) {
    if (Agent.area == area) {
      /* Move in the same area */
    } else {
      Agent.area.AgentLeave(agent);
      area.AgentEnter(agent);
    }
  }
}

/* The low level action which might last for several rounds */
class Action {
  ability: Ability;
  
}

class DumbAction {
  function step(agent: Agent, area: Area) {
    
  }
} 


class Conflict {

}

function execut(world: World) {
  for agent in world
  {
    try {
      let (agent of world.agents) {
        agent.step();
      }
    } catch (e: Conflict) {
      console.log("Conflict detected ...")
    }
  }
}
