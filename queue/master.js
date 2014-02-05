var amqp = require('amqplib');
var when = require('when');
var config = require("../config");

var connection;

amqp.connect(config.rabbitMqUri).then(function(conn) {

    console.log("[Master] created AMQP connection: " + config.rabbitMqUri);
    connection = conn;

    return when(conn.createChannel().then(function(ch) {

        channel = ch;
        console.log("[Master] created channel");

        var q = config.transcodeTaskQueueName;
        var ok = ch.assertQueue(q, {durable: true});

        return ok.then(function() {
            console.log("[Master] queue: " + config.transcodeTaskQueueName + " available");

            //var msg = process.argv.slice(2).join(' ') || "Hello World!"
           // ch.sendToQueue(q, new Buffer(msg), {deliveryMode: true});
            //console.log(" [x] Sent '%s'", msg);

            // Don't close the channel - we will reuse
            //return ch.close();
        });
    }))
        .ensure(function() {
            // Don't close the connection - we will reuse
            //console.log("[Master] closing AMQP connection");
            //conn.close();
        });
}).then(null, console.warn);

module.exports.pushTranscodeTask = function(task)
{
    var q = config.transcodeTaskQueueName;
    var msg = JSON.stringify(task);

    channel.sendToQueue(q, new Buffer(msg), {deliveryMode: true});

    console.log("[Master] pushed transcode task: '%s'", msg);
}

