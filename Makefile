universe : universe.ml
	ocamlopt -o universe.bin universe.ml

clean :
	rm universe.cmx universe.cmi
