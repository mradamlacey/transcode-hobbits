
module.exports = function(app){

    var controller = {};

    controller.videoTask = function(req, res)
    {
        // Validate the data

        // Generate an id for the task

        // Perform the transcode job synchronously

        // Return task completion info to the caller

        res.json({ taskId: 53939, taskCompletionTimeSec: 38983, outputFilePath: "/output/file.mp4" });
    };

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////
    app.post('/api/videoTask', controller.videoTask);

}



