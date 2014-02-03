var config = {};

config.ffmpegPath = "z:\\tools\\ffmpeg\\bin";
config.rabbitMqUri = "amqp://localhost:";
config.web = {
    port : process.env.PORT || 3000
};

module.exports = config;