var pid = process.pid;
console.log("[Worker] Starting queue worker: " + pid);

process.on('uncaughtException', function(err) {

    console.error(err);
    process.exit();

});

var amqp = require('amqplib');
var config = require("../config");
var transcode = require("../transcode/transcode");
var fs = require('fs');
var dataStore = require("../persistence/esDataStore");

var LOG_ID = "[Worker " + pid + "] ";

amqp.connect(config.rabbitMqUri).then(function(conn) {

    console.log(LOG_ID + "Connected to AMQP: " + config.rabbitMqUri);

    conn.once('SIGINT', function() {
        console.log(LOG_ID + "Closing AMQP connection");
        conn.close();
    });

    return conn.createChannel().then(function(ch) {

        console.log(LOG_ID + "Created channel");

        var ok = ch.assertQueue(config.transcodeTaskQueueName, {durable: true});

        ok = ok.then(function() { ch.prefetch(1); });

        ok = ok.then(function() {
            ch.consume(config.transcodeTaskQueueName, doWork, {noAck: false});
            console.log(LOG_ID + "Waiting for messages. To exit press CTRL+C");
        });

        console.log(LOG_ID + "returning ok...");

        return ok;

        function doWork(msg) {

            var task = null;
            try
            {
                task = JSON.parse(msg.content.toString());
            }
            catch(Error)
            {
                console.error(LOG_ID + "Unable to parse message: " + msg.content.toString());
                ch.ack(msg);
                return;
            }

            task.workStartTimestamp = Date.now();

            console.log(LOG_ID + "Received '%s'", msg.content.toString());

            dataStore.updateTranscodeTaskStatus(task.taskId, "started");

            var filePathParts = task.filePath.split("\\");
            var fileNameWithExtension = filePathParts[filePathParts.length - 1];
            var fileNameParts = fileNameWithExtension.split(".");
            var fileName = fileNameParts[0];
            var extension = fileNameParts[1];

            var inputFilePath = config.workFolderPath + "\\" + task.taskId + "." + extension;
            var transcodedOutputFilePath = config.workFolderPath + "\\" + task.taskId + ".mp4";

            transcode.transcodeToMp4Stream(task.filePath, transcodedOutputFilePath, function(error, response){
                if(error){
                    console.error(LOG_ID + "Error in transcoding video task");
                    // Acknowledge the message
                    return ch.ack(msg);
                }

                console.log(LOG_ID + "Successful transcoding: " + JSON.stringify(response));

                dataStore.updateCompletedTranscodeTask(task);

                // Acknowledge the message
                ch.ack(msg);
            });

            /*
            fs.exists(task.filePath, function(exists){

                if(!exists){
                    console.error("File: " + task.filePath + " does not exist, unable to process message");
                    ch.ack(msg);
                }
                else
                {
                    var readStreamPromise = fs.createReadStream(task.filePath);
                    var writeStreamPromise = fs.createWriteStream(inputFilePath);
                    readStreamPromise.pipe(writeStreamPromise);

                    dataStore.updateTranscodeTaskStatus(task.taskId, "copying");

                    writeStreamPromise.on("close", function(error, data){

                        dataStore.updateTranscodeTaskStatus(task.taskId, "transcoding");

                        transcode.transcodeToMp4(inputFilePath, transcodedOutputFilePath, function(error, response){

                            if(error){
                                console.error(LOG_ID + "Error in transcoding video task");
                                // Acknowledge the message
                                ch.ack(msg);
                                return;
                            }

                            console.log(LOG_ID + "Successful transcoding: " + JSON.stringify(response));

                            dataStore.updateCompletedTranscodeTask(task);

                            // Acknowledge the message
                            ch.ack(msg);
                        });

                    });
                }
            });  */

        }

    });
}).then(null, console.warn);