var transcode = require("../transcode/transcode");

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

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////
    app.post('/api/videoTask', controller.videoTask);

}



