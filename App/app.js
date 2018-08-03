
var amqp = require('amqplib');
var fs = require('mz/fs')
var Inotify = require('inotify').Inotify;
var inotify = new Inotify();
var await = require('asyncawait/await');
var async = require('asyncawait/async');
var sensorDataPath = '/sensorsdata/';




inotify.addWatch({
    path: sensorDataPath,
    watch_for: Inotify.IN_ALL_EVENTS,
    callback: onNewFileGenerated
});

function onNewFileGenerated(event) {
    var mask = event.mask;
    if (mask & Inotify.IN_CLOSE_WRITE) {
        var fileName = event.name;
        handleReadingFileGeneratedV2(fileName);
    }
}

function handleReadingFileGeneratedV2(fileName) {
    var filePath = sensorDataPath + fileName;
    async(function () {
        try {
            var data = await(fs.readFile(filePath, 'utf8'));
            var content = { data: data, fileName: fileName };
            await(reportContentAsync("amqp://mslgcpgp:n5Ya32JaLtoYt7Qu0uemu7SFNPpGw8T5@puma.rmq.cloudamqp.com/mslgcpgp", content));
            await(fs.unlink(filePath));
        }
        catch (error) {
            console.log(error);
        }

    })();
}
function reportContentAsync(uri, content) {
    var connection;
    try {
        connection = await(amqp.connect(uri));
        var channel = await(connection.createChannel());
        var queue = 'doorOpenEvents';
        var msg = JSON.stringify(content);
        await(channel.assertQueue(queue, { durable: true }));
        await(channel.sendToQueue(queue, Buffer.from(msg)));
        await(channel.close());
    }
    catch (err) {
        console.log("TEMPER error connecting queue" + uri + queue);
        console.log(err);
        setTimeout(function () {
            var asyncFx = async(function () {
                reportContentAsync(uri, content)
            });
            asyncFx();

        }, 1000);
        return;
    }
    finally {
        if (connection) {
            connection.close();
        }
    }



}


// Catch uncaught exception
process.on('uncaughtException', err => {
    console.dir(err, { depth: null });
    process.exit(1);
});
process.on('exit', code => {
    console.log('Process exit');
    process.exit(code);
});
process.on('SIGTERM', code => {
    console.log('Process SIGTERM');
    process.exit(code);
});