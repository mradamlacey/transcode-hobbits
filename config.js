var config = {};

config.ffmpegPath = __dirname + "\\tools";
config.rabbitMqUri = "amqp://localhost";
config.transcodeTaskQueueName = "transcodeVideoQueue";
config.workFolderPath = "z:\\media";
config.web = {
    port : process.env.PORT || 3000
};
config.master = true;
config.worker = true;
config.debugWorkerMode = false;
config.workersPerCore = 0.5;
config.elasticSearchHosts = [
    'http://irvlinidx01.dev.local:9200',
    'http://irvlinidx02.dev.local:9200',
    'http://irvlinidx04.dev.local:9200'
];
config.elasticSearchIndex = "adam";
config.logPath = "z:\\logs";

module.exports = config;