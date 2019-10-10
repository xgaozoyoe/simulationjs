/* 
 * The only Universe that served as a object Factory.
 * The step function is the only progress function to trigger the universe to run.
 */
var Universe = function () {

    /* Local Private Event Class */
    var Event = function(event_obj, name) {
        var active = true;
        var eobj = event_obj;
        this.name = name;
        this.getEventObject = function() {return eobj;}
        this.setActive = function(active) {active = is_active;};
        this.isActive = function() {return active;};
    }

    /* Local Private EventQueue Class */
    var EventQueue = function() {
        var pool = new Array(); 
        this.fireEvent = function (event_obj, name) {
            pool.push(new Event(event_obj,name));
        }
        this.consumeAll = function (cb) {
            pool.forEach(function(e) {
                if(e.isActive()) {cb(e)};
            });
        }
    }

    // closure variable for later usage
    var events = new EventQueue();
    var the_universe = this;

    /* Local Private State class */
    var State = function(enter_cb, leave_cb, stay_cb){
        this.enter = enter_cb;
        this.leave = leave_cb;
        this.stay = stay_cb;
    }

    var idleState = new State(function (){},function (){}, function(){});
    var uid = 0;
    var agent_map = new Map();
    var createUID = function() {
        uid++;
        return "u" + uid;
    }

    this.getAgent = function(uid) {
        return agent_map.get(uid);
    }

    /* Local Private Agent Class
     * The function will bind a few interfaces for the agent object.
     * Any object can be treated as an agent.
     */
    this.buildAgent = function(agent) {
        states = {};
        current_state = idleState;
        event_handlers = {};
        agent.addState = function(state_name, enter_cb, leave_cb, stay_cb) {
           states[state_name] = new State(enter_cb, leave_cb, stay_cb);
        };
        agent.switchState = function(state_name) {
           target_state = states[state_name];  
           if(target_state == this.current_state) {
               /* return silently */
               return;
           } else {
               current_state.leave(target_state);
               current_state.enter(this.current_state);
               current_state = target_state;
           }
        };
        agent.step = function() {
           current_state.stay();
        };
        /*
         * Event is fired but not handled until in the next around
         */ 
        agent.fireEvent = function(event_obj, name) { 
            event.setSourceObject(this);
            events.fireEvent(event_obj, name);
        };
        agent.deliverEvent = function(target_obj, name) {
            var e = new Event(agent, name);
            target_obj.handleEvent(e);
        }
        agent.addEventHandler = function(ename, cb) {
            event_handlers[ename] = cb;
        };
        agent.handleEvent = function(e) {
            if(event_handlers[e.name]) {
                return (event_handlers[e.name](e));
            }
        }
        var uid = createUID();
        agent.getUID = function() {
            return uid;
        }
        agent_map.set(uid, agent);
        return agent;
    }

    this.removeAgent = function(agent){
        agent_map.delete(agent);
    }

    this.addEventHandler = function(ename, cb) {
        event_handlers[ename] = cb;
    };

    this.handleEvent = function(e) {
        if(this.event_handlers[e.name]) {
            return (this.event_handlers[e.name](e));
        }
    }

    this.step = function() {
        /* Handle the event */
        events.consumeAll(function(e) {
            agent_map.forEach(function(agent) {
                if(e.isActive()) {
                    agent.handleEvent(e);
                }
            });
        });

        /* Handle the left universe events */
        events.consumeAll(function(e) {
            this.handleEvent(e);
        });

        agent_map.forEach(function(agent) {
            agent.step();
        });
    }
}
