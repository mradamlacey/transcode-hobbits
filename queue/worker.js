var amqp = require('amqplib');
var config = require("../config");
var transcode = require("../transcode/transcode");
var fs = require('fs');

amqp.connect('amqp://localhost').then(function(conn) {

    console.log("[Worker] Connected to AMQP localhost");

    conn.once('SIGINT', function() {
        console.log("[Worker] Closing AMQP connection");
        conn.close();
    });

    return conn.createChannel().then(function(ch) {

        console.log("[Worker] Created channel");

        var ok = ch.assertQueue(config.transcodeTaskQueueName, {durable: true});

        ok = ok.then(function() { ch.prefetch(1); });

        ok = ok.then(function() {
            ch.consume(config.transcodeTaskQueueName, doWork, {noAck: false});
            console.log("[Worker]  [*] Waiting for messages. To exit press CTRL+C");
        });

        console.log("[Worker] returning ok...");

        return ok;

        function doWork(msg) {

            var task = null;
            try
            {
                task = JSON.parse(msg.content.toString());
            }
            catch(Error)
            {
                console.error("[Worker] Unable to parse message: " + msg.content.toString());
                ch.ack(msg);
                return;
            }

            console.log("[Worker] Received '%s'", msg.content.toString());

            var filePathParts = task.filePath.split("\\");
            var fileNameWithExtension = filePathParts[filePathParts.length - 1];
            var fileNameParts = fileNameWithExtension.split(".");
            var fileName = fileNameParts[0];
            var extension = fileNameParts[1];

            var inputFilePath = config.workFolderPath + "\\" + task.taskId + "." + extension;
            var transcodedOutputFilePath = config.workFolderPath + "\\" + task.taskId + ".mp4";

            var readStreamPromise = fs.createReadStream(task.filePath);
            var writeStreamPromise = fs.createWriteStream(inputFilePath);
            readStreamPromise.pipe(writeStreamPromise);

            writeStreamPromise.on("close", function(error, data){

                transcode.transcodeToMp4(inputFilePath, transcodedOutputFilePath, function(error, response){

                    if(error){
                        console.error("[Worker] Error in transcoding video task");
                        // Acknowledge the message
                        ch.ack(msg);
                        return;
                    }

                    console.log("[Worker] Successful transcoding: " + JSON.stringify(response));

                    // Acknowledge the message
                    ch.ack(msg);
                });

            });

        }

    });
}).then(null, console.warn);