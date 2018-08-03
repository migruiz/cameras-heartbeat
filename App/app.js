
var amqp = require('amqplib');
var await = require('asyncawait/await');
var async = require('asyncawait/async');



const serverURI="amqp://mslgcpgp:n5Ya32JaLtoYt7Qu0uemu7SFNPpGw8T5@puma.rmq.cloudamqp.com/mslgcpgp";
const queuename='restartCamera'
const config={ durable: true, noAck: false }


function onMessageReceived(){
    console.log("message received");
}





function reportError() {
    console.log(Math.floor(new Date() / 1000));
}
function monitorConnection(connection) {
    var onProcessTerminatedHandler = function () { connection.close(); };
    connection.on('error', function (err) {
        console.log("on error queue" + serverURI + queuename);
        console.log(err);
        reportError();
        setTimeout(function () {
            listenToQueue(serverURI, queuename, config, onMessageReceived);
        }, 1000);
    });
    process.once('SIGINT', onProcessTerminatedHandler);
}
var asyncFx = async(function () {
    try {
        var connection = await(amqp.connect(serverURI));
    }
    catch (connerr) {
        console.log("error connecting queue" + serverURI + queuename);
        reportError();
        setTimeout(function () {
            listenToQueue(serverURI, queuename, config, onMessageReceived);
        }, 1000);
        return;
    }
    monitorConnection(connection);
    var channel = await(connection.createChannel());
    await(channel.assertQueue(queuename, { durable: config.durable }));
    channel.consume(queuename, function (msg) {
        try {
            onMessageReceived(channel, msg);
        } catch (err) {
            console.log("err consuming message" + serverURI + queuename);
            console.log(msg);
        }
    }, { noAck: config.noAck });

});
asyncFx();





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