
/**
 * Module dependencies.
 */

// New Relic monitoring integration
var newrelic = require('newrelic');

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var master = require('./queue/master');
var worker = require('./queue/worker');

var app = express();
app.set('port', process.env.PORT || 3000);
app.configure(function(){
// all environments

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.static(path.join(__dirname, 'public')));
                        console.log("poo");
    app.use(app.router);
    app.use(express.bodyParser());

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

});

// Configure routing
routes(app);

// Initialize the queue master
//master();

http.createServer(app)
    .listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });

