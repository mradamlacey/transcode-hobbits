
exports.transcodeToMp4 = function(filePath, callback)
{
    // Simulate some work time...
    setTimeout(function(){

        var resp = { outputFilePath: "/output/file.mp4" };

        // Invoke the callback
        callback(null, resp);

    }, 3000)

}

