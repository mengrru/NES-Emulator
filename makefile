.PHONY: build
build:
	tsc && cp -r public/* build/

clean:
	rm -rf build/

run:
	make clean && make build && http-server -p 3006 build/