var spawn = require('child_process').spawn;


var mqtt = require('./mqttCluster.js');
global.mtqqLocalPath = process.env.MQTTLOCAL;
global.restartCameraTopic="restartCameraTopic"
global.onCode=process.env.OnCode
global.offCode=process.env.OffCode
global.waitForNextCommand=500
global.waitForTurnOn=5 *1000
global.roundCycles=6

const timeout = ms => new Promise(res => setTimeout(res, ms))

(async function(){
    var mqttCluster=await mqtt.getClusterAsync()   
    mqttCluster.subscribeData(global.restartCameraTopic, async function(content){
        await executeMultipleCommandsAsync(global.offCode)
        await timeout(global.waitForTurnOn);
        await executeMultipleCommandsAsync(global.onCode) 
    });
})();








async function executeMultipleCommandsAsync(code) {
    for (var i = 0; i < global.roundCycles; i++) {
        await executeSingleCommandAsync(code);
        await timeout(global.waitForNextCommand);
    }
}

function executeSingleCommandAsync(code) {
    return new Promise(function (resolve, reject) {
        const command = spawn('/433Utils/RPi_utils/codesend'
            , [
                code
                , '-l'
                , '180'
            ]);
        command.stdout.on('data', data => {
            console.log(data.toString());
        });
        command.on('exit', function (code, signal) {
            console.log('exited');
            resolve();
        });
    });
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
