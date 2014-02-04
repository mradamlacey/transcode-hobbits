var config = {};

config.ffmpegPath = "z:\\tools\\ffmpeg\\bin";
config.rabbitMqUri = "amqp://localhost";
config.transcodeTaskQueueName = "transcodeVideoQueue";
config.workFolderPath = "z:\\media";
config.web = {
    port : process.env.PORT || 3000
};

module.exports = config;