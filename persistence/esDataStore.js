// Model to perform CRUD for various documents needed for the solution

var config = require("../config");
var moment = require("moment");
var when = require("when");

var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    hosts: config.elasticSearchHosts,
    log: {
        type: 'file',
        level: 'trace',
        path: config.logPath + '\\elasticsearch.log'
    },
    apiVersion: "0.90"
});

var transcodeTaskType = "transcodeTask";

module.exports.createTranscodeTask = function(task)
{
    task.startTimestamp = Date.now();
    task.status = "queued";

    client.create({
        index: config.elasticSearchIndex,
        type: transcodeTaskType,
        id: task.taskId,
        body: task
    }, function(error, response){
        if(error){
            console.error("[esDataStore] Error creating transcode task: " + error);
            return;
        }

        console.log("[esDataStore] Created " + transcodeTaskType + " id: " + task.taskId);
    });
}

module.exports.updateCompletedTranscodeTask = function(task, callback)
{

    getTranscodeTask(task.taskId, function(error, response){

        if(error)
        {
            return callback(error, null);
        }

        var taskDoc = response;

        taskDoc.endTimestamp = Date.now();
        taskDoc.totalTime = taskDoc.endTimestamp - taskDoc.startTimestamp;
        taskDoc.workTime = taskDoc.endTimestamp - task.workStartTimestamp;
        taskDoc.status = "complete";

        client.index({
            index: config.elasticSearchIndex,
            type: transcodeTaskType,
            id: task.taskId,
            body: taskDoc
        }, function(error, response){
            if(error)
            {
                return callback(error, null);
            }
            if(callback){
                callback(error, response);
            }
        });

    });


}

module.exports.updateTranscodeTaskStatus = function (taskId, status, callback) {


    getTranscodeTask(taskId, function(error, response){

        if(error)
        {
            throw new Error("Error getting document id: " + taskId);
        }

        var task = response;

        task.status = status;

        client.index({
            index: config.elasticSearchIndex,
            type: transcodeTaskType,
            id: taskId,
            body: task
        }, function (error, response) {
            if (error) {
                throw new Error("Error updating document type: " + transcodeTaskType + " id: " + taskId);
            }
            if(callback){
                callback(error, response);
            }
        });

    });

}

function getTranscodeTask(taskId, callback)
{
    client.get({
        index: config.elasticSearchIndex,
        type: transcodeTaskType,
        id: taskId
    }, function (error, response) {
        if(callback){
            callback(error, response._source);
        }
    });

}

module.exports.getTranscodeTask = getTranscodeTask;

module.exports.getWorkTimeStats = function(callback)
{
    getFieldStats("workTime", callback);
}

module.exports.getTotalTimeStats = function(callback)
{
    getFieldStats("totalTime", callback);
}

module.exports.getThroughput = getThroughput;

module.exports.getThroughputBetweenTimes = getThroughputBetweenTimes;

function getFieldStats(fieldName, callback)
{
    var deferreds = [];

    var dateFormat = "YYYY-MM-DDTHH:mm:ss";

    var endMoment = moment();
    var last30MinsMoment = moment(endMoment).subtract("minutes", 30);
    var last10MinsMoment = moment(endMoment).subtract("minutes", 10);
    var last5MinsMoment = moment(endMoment).subtract("minutes", 5);
    var last1MinsMoment = moment(endMoment).subtract("minutes", 1);

    deferreds.push(getStatsByFieldOverTimeWindow(fieldName, last30MinsMoment.valueOf(), endMoment.valueOf(), "last30min")) ;
    deferreds.push(getStatsByFieldOverTimeWindow(fieldName, last10MinsMoment.valueOf(), endMoment.valueOf(), "last10min"));
    deferreds.push(getStatsByFieldOverTimeWindow(fieldName, last5MinsMoment.valueOf(), endMoment.valueOf(), "last5min")) ;
    deferreds.push(getStatsByFieldOverTimeWindow(fieldName, last1MinsMoment.valueOf(), endMoment.valueOf(), "last1min"));

    when.all(deferreds).then(function(responses){

            if(callback)
            {
                callback(null, responses);
            }
        },
        function(error){
            console.error("Error retrieving " + fieldName + " stats: " + JSON.stringify(error));

            if(callback)
            {
                callback(error, null);
            }
        });
}

function getThroughput(callback)
{
    var deferreds = [];

    var dateFormat = "YYYY-MM-DDTHH:mm:ss";

    var endMoment = moment();
    var last30MinsMoment = moment(endMoment).subtract("minutes", 30);
    var last10MinsMoment = moment(endMoment).subtract("minutes", 10);
    var last5MinsMoment = moment(endMoment).subtract("minutes", 5);
    var last1MinsMoment = moment(endMoment).subtract("minutes", 1);

    deferreds.push(getThroughputOverTimeWindow(last30MinsMoment.valueOf(), endMoment.valueOf(), "last30min")) ;
    deferreds.push(getThroughputOverTimeWindow(last10MinsMoment.valueOf(), endMoment.valueOf(), "last10min"));
    deferreds.push(getThroughputOverTimeWindow(last5MinsMoment.valueOf(), endMoment.valueOf(), "last5min")) ;
    deferreds.push(getThroughputOverTimeWindow(last1MinsMoment.valueOf(), endMoment.valueOf(), "last1min"));

    when.all(deferreds).then(function(responses){

            if(callback)
            {
                callback(null, responses);
            }
        },
        function(error){
            console.error("Error retrieving throughput: " + JSON.stringify(error));

            if(callback)
            {
                callback(error, null);
            }
        });
}

function getThroughputBetweenTimes(startTime, endTime, callback)
{
    var startMoment = moment(startTime);
    var endMoment = moment(endTime);

    getThroughputOverTimeWindow(startMoment.valueOf(), endMoment.valueOf(), "betweenTimes")
        .then(function(response){
             if(callback)
             {
                 callback(null, response);
             }
    },
    function(error){
        if(callback)
        {
            console.error("Error getting throughput over time window");
            callback(error, null);
        }
    })
}


function getStatsByFieldOverTimeWindow(fieldName, startTime, endTime, description)
{
    var deferred = when.defer();

    client.search({
        index: config.elasticSearchIndex,
        type: transcodeTaskType,
        body: {
            "query" : {
                "match_all" : {}
            },
            "facets" : {
                "stat1" : {
                    "statistical" : {
                        "field" : fieldName
                    },
                    "facet_filter" : {
                        "range" : {
                            "endTimestamp" : {
                                "gte" : startTime,
                                "lte" : endTime
                            }
                        }
                    }
                }
            }
        }
    }, function (error, response) {
        if(error)
        {
            deferred.reject(new Error("Unable to retrieve stats filter on '" + fieldName + "' field"));
        }

        deferred.resolve(response.facets.stat1);

    });

    return deferred.promise;
}

function getThroughputOverTimeWindow(startTime, endTime, description)
{
    var deferred = when.defer();

    client.search({
        index: config.elasticSearchIndex,
        type: transcodeTaskType,
        body: {
            "query" : {
                "match_all" : {}
            },
            "facets" : {
                "taskThroughput" : {
                    "range" : {
                        "field" : "endTimestamp",
                        "ranges" : [
                            { "from" : startTime,
                                "to" : endTime }
                        ]
                    }
                }
            }
        }
    }, function (error, response) {
        if(error)
        {
            deferred.reject(new Error("Unable to retrieve range facet filter on 'endTimestamp' field"));
            return;
        }

        var dateFormat = "YYYY-MM-DD HH:mm:ss";

        var count = response.facets.taskThroughput.ranges[0].count;

        var startMoment = moment(startTime);
        var endMoment = moment(endTime);
        var diffMs = endMoment.diff(startMoment);

        var throughPutInfo = {
            description: description,
            startTime: startMoment.format(dateFormat),
            endTime: endMoment.format(dateFormat),
            throughputPerSec: count / diffMs * 1000,
            throughputPerMin: count / diffMs * 1000 * 60,
            count: count
        }
        deferred.resolve(throughPutInfo);

    });

    return deferred.promise;
}