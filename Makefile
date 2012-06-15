main-built.js:
	node node_modules/requirejs/bin/r.js -o toy-main.build.js

clean:
	rm -rf static/toy/main-built.js
