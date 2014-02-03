
module.exports = function(app){

    var controller = {};
    controller.status = function(req, res){

        var status = { workInProcess: 4,
            workCompleted: 7,
            workPerSec: 5.332,
            averageWorkCompletionTimeSec: 34.889,
            medianWorkCompletionTimeSec: 31.333,
            stdDevWorkCompletionTimeSec: 4.551
        };

        res.json(status);
    };

    controller.videoTask = function(req, res)
    {
        // Validate the data

        // Generate an id for the task

        // Queue up the task

        // Return task information to the caller

        res.json({ message: "Work item accepted", taskId: 53939 });
    };

    controller.getVideoTask = function(req, res)
    {
        // Return the current status of the video task
        var taskId = req.params.id;

        console.log("Retrieving video task: " + taskId)

        res.json({ "taskId": taskId, status: "pending" });
    };

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////

    app.get('/transcodeGrid/status', controller.status);

    app.post('/transcodeGrid/videoTask', controller.videoTask);

    app.get('/transcodeGrid/videoTask/:id', controller.getVideoTask);

}


