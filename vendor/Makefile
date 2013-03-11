SHELL := /bin/bash

all : jquery.min.js underscore-min.js backbone-min.js jquery.history.js URI.min.js

clean :
	rm -f backbone-min.js underscore-min.js jquery.history.js URI.min.js

jquery.min.js:
	wget http://code.jquery.com/jquery.min.js -O $@ || rm -f $@
	ln -sf ../vendor/$@ ../static/$@

underscore-min.js:
	wget https://raw.github.com/documentcloud/underscore/master/underscore-min.js -O $@ || rm -f $@
	ln -sf ../vendor/$@ ../static/$@

backbone-min.js:
	wget https://raw.github.com/documentcloud/backbone/master/backbone-min.js -O $@ || rm -f $@
	ln -sf ../vendor/$@ ../static/$@

jquery.history.js:
	wget https://raw.github.com/balupton/history.js/master/scripts/bundled/html4+html5/jquery.history.js -O $@ || rm -f $@
	ln -sf ../vendor/$@ ../static/$@

URI.min.js:
	wget https://raw.github.com/medialize/URI.js/gh-pages/src/URI.min.js -O $@ || rm -f $@
	ln -sf ../vendor/$@ ../static/$@
