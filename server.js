#!/bin/env node
//  OpenShift sample Node application

/*global require, console */
/*global process */
/*global readFileSync */
/*global module */
/*jslint nomen: true*/
/*global __dirname */

var express = require('express'),
    fs      = require('fs'),
    favicon = require('static-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    http = require('http'),
    path = require('path'),
    socketio  = require('socket.io'),
    Pusher = require('pusher'),
    nodeMailer = require('nodemailer'),
    pusher,
    MasherNodeAppj,
    routesHtml,
    api,
    resource,
    app_id,
    app_key,
    app_secret,
    MasherNodeApp;

//     nodemailer = require("nodemailer");
//     smtpTransport = require('nodemailer-smtp-transport');

routesHtml = require('./routes/index.js');
api = require('./routes/api');
//     contact = require('./routes/contact');  // Contact Form

resource = require('express-resource');

app_id = '40938';
app_key = '5c6bad75dc0dd1cec1a6';
app_secret = '54546672d0196be97f6a';

pusher = new Pusher({appId: app_id, key: app_key, secret: app_secret});

api.setPusher(pusher);

/**
 *  Define the sample application.
 */
MasherNodeApp = function () {
    "use strict";
    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function () {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP  || '127.0.0.1';
        self.port      = process.env.PORT || 8080; //process.env.OPENSHIFT_NODEJS_PORT || 3035;
        // api.setHostEnvironment(self.ipaddress, self.port);
        api.setHostEnvironment('https://maplinkr-simpleserver.herokuapp.com', '8100');
        console.log('listen on:');
        console.log(self.port);
        console.log(self.ipaddress);

        if (self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function () {
        if (!self.zcache) {
            self.zcache = {
                'index.html': ''
            };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function (key) {
        return self.zcache[key];
    };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
             'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
            ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.

urls = (
    '/', 'Index',
  '/leaflet/?', 'Leaflet',
  '/arcgis/?', 'ArcGIS',
  '/googlemap/?', 'GoogleMap',
  '/pusher/auth/?', 'AuthHandler'
)
     */


    self.createRoutes = function () {
        self.routes = { };

        self.routes['/asciimo'] = function (req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };
        self.routes['/indexchannel/:name'] = routesHtml.indexchannel;

        // self.routes['/'] = function(req, res) {
            // res.setHeader('Content-Type', 'text/html');
            // res.send(self.cache_get('index.html') );
        // };

        // JSON API
        self.routes['/username'] = api.getUserName;
        self.routes['/userid'] = api.getUserId;
        self.routes['/wndseqno'] = api.getNextWindowSeqNo;
        self.routes['/hostenvironment'] = api.getHostEnvironment;

        // self.routes['/pusher/auth'] = api.getAuth;
        self.app.get('/pusher/auth', function (req, res) {
            console.log('getAuth');
            console.log('%s %s %s', req.method, req.url, req.path);
            console.log('req.body.socket_id is %s', req.query.socket_id);
            console.log('req.body.channel_name is %s', req.query.channel_name);
            var socketId = req.query.socket_id,
                channel = req.query.channel_name,
                callback = req.query.callback,
                auth = JSON.stringify(pusher.authenticate(socketId, channel)),
                cb = callback.replace(/\"/g,"") + "(" + auth + ");";
            res.set({
              "Content-Type": "application/javascript"
            });
            res.send(cb);
        });
        // self.app.post('/contact', contact.process);  // Contact form route


        // self.routes['/api/MarkdownSimple/:id'] = api.getDoc;

        // redirect all others to the index (HTML5 history)
        self.routes['*'] = routesHtml.index;
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function () {
        var r;
        self.app = express(); //.createServer();
        self.initSomeOptions();
        self.createRoutes();

        //  Add handlers for the app (from the routes).
        for (r in self.routes) {
            if (self.routes.hasOwnProperty(r)) {
                self.app.get(r, self.routes[r]);
            }
        }
        // self.initDB();
        console.log("server is initialized");
    };

    self.initSomeOptions = function () {
        self.app.set('views', __dirname + '/views');
        // self.app.set('view engine', 'jade');
        self.app.set('view options', {
            layout: false
        });

        self.app.use(favicon());
        self.app.use(logger('dev'));
        //app.use(bodyParser());
        self.app.use(bodyParser.json());
        self.app.use(bodyParser.urlencoded({ extended: false }));
        //app.use(methodOverride());
        self.app.use(cookieParser());
        // app.use(express.static(path.join(__dirname, 'public')));
        self.app.use(express.static(__dirname + '/www'));
        //self.app.use(self.app.router);    DEPRECATED
        self.app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "http://localhost:8100");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        self.app.post('/send-email', function (req, res) {
            nodemailer = require('nodemailer');

            // Generate SMTP service account from ethereal.email
            nodemailer.createTestAccount((err, account) => {
                if (err) {
                    console.error('Failed to create a testing account. ' + err.message);
                    return process.exit(1);
                }

                console.log('Credentials obtained, sending message...');

                // Create a SMTP transporter object
                let transporter = nodemailer.createTransport({
                    host: account.smtp.host,
                    port: account.smtp.port,
                    secure: account.smtp.secure,
                    auth: {
                        user: account.user,
                        pass: account.pass
                    }
                });

                // Message object
                let message = {
                    from: 'MapLinkr <mapsyncr@gmail.com>',
                    to: req.body.to,
                    subject: req.body.subject,
                    text: req.body.text,
                    html: '<p><b>MapLinkr</b> click link to open this MapLinkr map in browser</p>'
                };

                transporter.sendMail(message, (err, info) => {
                    if (err) {
                        console.log('Error occurred. ' + err.message);
                        return process.exit(1);
                    }

                    console.log('Message sent: %s', info.messageId);
                    // Preview only available when sending through an Ethereal account
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
            });
        });
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function () {
        self.setupVariables();
        // self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };
    /*
    self.initDB = function() {
        // Make our db accessible to our router
        self.app.use(function(req,res,next){
            req.db = db;
            next();
        });
    };
    */
        // / catch 404 and forwarding to error handler
       /*  self.app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
    };
    */

    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function () {
        //  Start the app on the specific interface (and port).
        console.log("now start");
        /*
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
         */
         /*
        var server = self.app.listen(self.port, self.ipaddress),
            io = require('socket.io').listen(server);
        */
        var server = self.app.listen(self.port, function() {
                console.log('Our app is running on http://localhost:' + self.port);
            }),
            io = require('socket.io').listen(server);
        io.sockets.on('connection', function (socket) {
            console.log('io.sockets.on is connecting?');
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new MasherNodeApp();
zapp.initialize();
module.exports = zapp.app;
zapp.start();
