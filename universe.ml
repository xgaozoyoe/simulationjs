type location_t = {
	pos_x: int;
	pos_y: int;
};;

type world_t = {
	map : (area_t array) array;
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
	let map = 
		Array.init 10 (fun y ->
			Array.init 10 (fun x->
				make_area (make_loc x y)
			)
		) in
	{ map = map; agents = []; events = [] };;

let make_agent name loc world = {
	name_of_agent = name;
	vision_of_agent = trivial_vision;
	loc_of_agent = loc;
	area_of_agent_p = ref (world.map.(loc.pos_x).(loc.pos_y))
};;

let ability_array :ability_t array = [|Stay; Idle; Move; Stall|];;

let new_world = make_world ();;

Printf.sprintf ("%d") (Array.length new_world.map) |> print_endline;;

let new_agent = make_agent "Adam" (make_loc 5 5) new_world;;

let step (i:int) = Ability.invoke_ability (Array.get ability_array (i mod 4)) new_agent in

for i = 1 to 100 do
	step i
done
