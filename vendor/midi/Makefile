SHELL := /bin/bash
.PHONY : all clean

ROOT = "https://raw.github.com/mudcube/MIDI.js/master"

all : ../../static/midi AudioDetect.js LoadPlugin.js Plugin.js Player.js DOMLoader.XMLHttp.js DOMLoader.script.js WebMIDIAPI.js Base64.js base64binary.js

clean :

../../static/midi :
	mkdir -p $@


AudioDetect.js :
	wget $(ROOT)/js/MIDI/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

LoadPlugin.js :
	wget $(ROOT)/js/MIDI/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

Plugin.js :
	wget $(ROOT)/js/MIDI/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

Player.js :
	wget $(ROOT)/js/MIDI/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@


DOMLoader.XMLHttp.js :
	wget $(ROOT)/js/Window/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

DOMLoader.script.js :
	wget $(ROOT)/js/Window/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@


WebMIDIAPI.js :
	wget $(ROOT)/inc/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

Base64.js :
	wget $(ROOT)/inc/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

base64binary.js :
	wget $(ROOT)/inc/$@ -O $@ || rm -f $@
	ln -sf ../../vendor/midi/$@ ../../static/midi/$@

