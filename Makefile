main-built.js:
	node node_modules/requirejs/bin/r.js -o main.build.js

clean:
	rm -rf main-built.js
