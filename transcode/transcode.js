var config = require("../config");
var spawn = require("child_process").spawn;

var progressRegExp = /frame=\s(\d*)\sfps=.*size=\s*(\d*).*time=(.*)\sbitrate=(.*)kbits/g;

var parseStdOutResults = function (data) {

    var logMessage = data.toString('utf-8');
    if(progressRegExp.test(logMessage))
    {
        //var progressData = progressRegExp.exec(logMessage);
        console.log("[ffmpeg PROGRESS] " + logMessage);
    }
    else
    {
        console.log('[ffmpeg] ' + data);
    }

};

var echoProcessResults = function (data) {

    console.log('[ffmpeg] ' + data);

};

exports.transcodeToMp4 = function(inputFilePath, outputFilePath, callback)
{
    console.log("Transcoding: " + inputFilePath + " to: " + outputFilePath);

    var ffmpeg = spawn(config.ffmpegPath + "\\ffmpeg.exe",
        ["-i", inputFilePath, "-y", "-vcodec", "mpeg4", "-acodec", "aac", "-strict", "-2", outputFilePath],
        {
            cwd: process.cwd(),
            env: process.env
        });
    // Dont have the parent wait for this process to exit...
    ffmpeg.unref();

    ffmpeg.stdout.on('data', echoProcessResults);
    ffmpeg.stderr.on('data', echoProcessResults);

    ffmpeg.on('close', function (code) {
        console.log('[ffmpeg] exited with code ' + code);

        if(code != 0)
        {
            callback({ message: "ffmpeg exited with error", errorCode: code}, null);
        }
        else
        {
            var resp = { "outputFilePath": outputFilePath };
            callback(null, resp);
        }
    });

}