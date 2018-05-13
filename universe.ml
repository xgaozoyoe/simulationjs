(****
 * The generic definition of Q matrix in discerete model 
 * estimate_t is usually a map from statet_t * action_t to int
 ****)

module type Estimation = sig
	type state_t 
	type action_t
	type estimate_t

	(* return the result value of a certain action *)
	val get_estimate : estimate_t -> state_t -> action_t -> int

	val update_estimate : estimate_t -> estimate_t 
	val actions_of_state : state_t -> action_t
	val pick_policy : estimate_t -> state_t -> action_t
end

(**** 
 * The location based estimate is the simplest estimate that evaluates the Q value based 
 * the location_t. 
 ****)

type location_t = {
	pos_x: int;
	pos_y: int;
};;

(****
 * Standard Q learning with no adjustment of the estimate
 ****)

module Qleaning : Sig
	type state_t;
	type action_t : location_t -> location_t
	type loc_estimate_t : (int list) list
	type award_t : location_t -> location_t
	type available_action_t : location_t -> action_t list

end = struct

	(* Compute the estimation matrix Q(state, action) *)
	let get_estimate loc_estimate location action = 
		let loc = action location in  
		loc_estimate.(loc.pos_x).(loc.pos_y) 

	let update_estimate loc_estimate_pre rewards avail_action_fn = last_est
		let update loc = Max (map (get_estimate loc_estimate_pre loc) (avail_action_fn loc)) in
		map (fun x -> map (fun y -> update {pos_x = x; pos_y = y} ) map.(x)) map 
end;;

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
	estimate_of_agent : Qlearning ;
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

(* Pick the best action based on the estimation of the agent *)
let pick_ability agent = 
	let current_est = estimation_matrix_of agent in
	let loc = loc_of_agent agent in
	let actions = current_est loc in
	let action = maximal_action actions in
	action

let step (i:int) = Ability.invoke_ability (pick_ability new_agent) in

for i = 1 to 100 do
	step i
done
