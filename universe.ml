type location_t = {
	pos_x: int;
	pos_y: int;
};;

type world_t = {
	map : (area_t list) list;
	agents : agent_t list;
	events : event_t list;
}

and area_t = {
	stacked_resource: turf_t list;
	stacked_agents: agent_t list;
	loc_of_area : location_t;
}

and vision_t = {
	event_filter : int; (* So far is a mask bit to filt the events *)
	areas_of_vision: (area_t ref) list;
}

and agent_t = {
	name_of_agent : string;
	vision_of_agent : vision_t;
	loc_of_agent : location_t;
	area_of_agent_p : area_t ref;
}

and turf_t = {
	resource_limit : int; (* resource limit *)
	resource_regen : int; (* resource rengeneration speed *)
}

and event_descript_t = {
	description : string;
}

and event_t = GlobalEvent of agent_t * event_descript_t
	| LocalEvent of agent_t * event_descript_t
;;


type ability_t = Stay | Idle | Move | Stall;;

module Ability : sig

	(* FIXME: currently there is no way to hotplug abilities *)

	(* once an ability is invoked, the agent's status might change which will
	   trigger a list of global events *)
	val invoke_ability : ability_t -> agent_t -> event_t list
	val dump_ability : ability_t -> agent_t -> string


	(* Debug functions *)
	val string_of_ability : ability_t -> string

end =
struct
	(* Implementation of debug functions *)
	let string_of_ability ability = match ability with
		| Stay -> "Stay"
		| Idle -> "Idle"
		| Move -> "Move"
		| Stall -> "Stall"


	let dump_ability ability agent =
		let ability_str = string_of_ability ability in
	    let str = Printf.sprintf ("[%s |- %s]") ability_str (agent.name_of_agent) in
		str

	let invoke_ability ability agent = 
		let () = print_endline (dump_ability ability agent) in
		[]
end;;

Random.self_init();;

let trivial_vision = {event_filter=0; areas_of_vision=[]};;

let make_loc x y = {pos_x = x; pos_y = y};;

let make_area loc = {
	stacked_resource=[];
	stacked_agents=[];
	loc_of_area=loc
};; 

let make_world () = 
	let map = [||] in
	for y = 0 to 10 do
		map.(y) <- [];
		for x = 0 to 10 do
			map.(y).(x) <- make_area (make_loc x y);
		done;
	done;
	map;;

let make_agent name loc area_ref = {
	name_of_agent = "Adam";
	vision_of_agent = trivial_vision;
	loc_of_agent = loc;
	area_of_agent_p = area_ref
};;

let ability_array :ability_t array = [|Stay; Idle; Move; Stall|] in

let step (i:int) = Ability.dump_ability (Array.get ability_array (i mod 4))  in

for i = 1 to 1000 do
	step i
done
