var queueMaster = require("../queue/master");
var dataStore = require("../persistence/esDataStore");

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
        if(req.body.filePath == null)
        {
            res.statusCode = 400;
            next(new Error("must supply filePath parameter"));
            return;
        }

        var task = req.body;

        // Generate an id for the task
        var taskId = Math.floor((Math.random() * 100000) + 1);

        task.taskId = taskId;

        // Persist the task
        dataStore.createTranscodeTask(task);

        // Queue up the task
        queueMaster.pushTranscodeTask(task);

        // Return task information to the caller
        res.json({ message: "Work item accepted", taskId: taskId });
    };

    controller.videoTasks = function(req, res)
    {
        var tasks = req.body;
        var responses = [];

        for (var i = 0; i < tasks.length; i++) {

            var task = tasks[i];

            // Validate the data
            if (task.filePath == null) {
                res.statusCode = 400;
                next(new Error("must supply filePath parameter"));
                return;
            }

            // Generate an id for the task
            var taskId = Math.floor((Math.random() * 100000) + 1);

            task.taskId = taskId;

            // Persist the task
            dataStore.createTranscodeTask(task);

            // Queue up the task
            queueMaster.pushTranscodeTask(task);

            responses.push({ message: "Work item accepted", taskId: taskId })
        }

        // Return task information to the caller
        res.json(responses);
    };

    controller.getVideoTask = function(req, res)
    {
        // Return the current status of the video task
        var taskId = req.params.id;

        console.log("Retrieving video task: " + taskId)

        dataStore.getTranscodeTask(taskId, function(error, response){
            if(error) {
                return res.send(500, { error: "Error retrieving"});
            }

            res.json(response);
        });

    };

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////

    app.get('/transcodeGrid/status', controller.status);

    app.post('/transcodeGrid/videoTask', controller.videoTask);
    app.post('/transcodeGrid/videoTasks', controller.videoTasks);

    app.get('/transcodeGrid/videoTask/:id', controller.getVideoTask);

}


