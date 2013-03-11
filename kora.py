#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import logging

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options



define("port", default=8805, help="Run on the given port", type=int)



class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/static/(.*)', tornado.web.StaticFileHandler, {'path': "static"}),
            (r"/(.*)", PageHandler),
            ]

        settings = dict()
        
        tornado.web.Application.__init__(self, handlers, **settings)

        print "Kora notation server running on port %d." % options.port



class PageHandler(tornado.web.RequestHandler): 
    def accept_type(self, name):
        if "Accept" in self.request.headers:
            return name.lower() in self.request.headers["Accept"].lower()
        return False

    def get(self, path):
        if not self.accept_type("json"):
            with open("static/index.html") as index:
                self.write(index.read())
                self.finish()
                return

        self.write("")
        self.finish()
        return



def main():
    tornado.options.parse_command_line()
    
    application = Application()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()



if __name__ == "__main__":
    main()
