var transcode = require("../transcode/transcode");
var dataStore = require("../persistence/esDataStore");
var moment = require("moment");

module.exports = function(app){

    var controller = {};

    controller.videoTask = function(req, res)
    {
        // Validate the data

        // Generate an id for the task
        var taskId = Math.floor((Math.random() * 100000) + 1);

        // Perform the transcode job synchronously
        transcode.transcodeToMp4(req.body.filePath, function(error, response){
            console.log("In transcode callback");

            if(error != null)
            {
                var msg = "Error in completing transcode job, error code: " + error.errorCode;
                console.log(msg);
                res.json({ "errorCode": error.errorCode,
                    "message": msg
                });
                return;
            }

            // Return task completion info to the caller
            res.json({ "taskId": taskId,
                "taskCompletionTimeSec": 38983,
                "outputFilePath": response.outputFilePath
            });

        });

    };

    controller.stats = function(req, res)
    {
        var stats = {};

        dataStore.getThroughput(function(error, response){
            if(error)
            {
                res.statusCode = 500;
                res.json({ "message": "Error retrieving throughput" });
                return;
            }

            stats.throughputLast30Mins = response[0];
            stats.throughputLast10Mins = response[1];
            stats.throughputLast5Mins = response[2];
            stats.throughputLast1Mins = response[3];

            dataStore.getTotalTimeStats(function(error, response){

                if(error)
                {
                    res.statusCode = 500;
                    res.json({ "message": "Error retrieving total time stats" });
                    return;
                }

                stats.totalTimeStatsLast30Mins = response[0];
                stats.totalTimeStatsLast10Mins = response[1];
                stats.totalTimeStatsLast5Mins = response[2];
                stats.totalTimeStatsLast1Mins = response[3];

                dataStore.getWorkTimeStats(function(error, response){

                    if(error)
                    {
                        res.statusCode = 500;
                        res.json({ "message": "Error retrieving work time stats" });
                        return;
                    }

                    stats.workTimeStatsLast30Mins = response[0];
                    stats.workTimeStatsLast10Mins = response[1];
                    stats.workTimeStatsLast5Mins = response[2];
                    stats.workTimeStatsLast1Mins = response[3];

                    res.json(stats);

                });

            });

        });
    };

    controller.throughput = function(req, res)
    {
        var startMoment = moment(req.body.startTime);
        var endMoment = moment(Date.now());
        if(req.body.endTime)
        {
            endMoment = moment(req.body.endTime);
        }

        dataStore.getThroughputBetweenTimes(startMoment, endMoment, function(error, response){
            if(error)
            {
                return res.send(500, { error: "Error retrieving throughput between times"});
            }
            res.json(response);
        });

    };

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////
    app.post('/api/videoTask', controller.videoTask);
    app.get('/api/stats', controller.stats);
    app.post('/api/throughput', controller.throughput);
}



