
/**
 * Module dependencies.
 */

// New Relic monitoring integration
var newrelic = require('newrelic');

var config = require("./config");
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var master = require('./queue/master');

var fork = require("child_process").fork;

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

    app.use(app.router);
    app.use(express.bodyParser());

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

});

// Configure routing
routes(app);

http.createServer(app)
    .listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });

if(config.worker)
{
    console.log("Initialzing worker mode");

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    var workers = Math.floor(cpuCount * config.workersPerCore);

    // Create queue workers
    for (var i = 0; i < workers; i += 1) {
        var workerProcess = fork("./queue/worker.js", null, { silent: true });

        if(workerProcess == null){

            console.error("Unable to fork queue worker process");
        }

    }
}

if(config.debugWorkerMode){
    require("./queue/worker");
}

