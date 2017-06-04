var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var deepStream = require('deepstream.io-client-js');

var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.text({type: '*/*'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var router = express.Router();
function connectDeepStream() {
    var client = deepStream(deepStreamServerURL).login();

    return client;
}
var deepStreamServerURL = 'wss://035.deepstreamhub.com?apiKey=74a08c64-7558-4adf-a71a-71e555580d1a';
router.get('/getAlertMessages', function (req, res) {
    var client = connectDeepStream();
    var connection = client.record.getList("safety/alerts");
    connection.subscribe(function (data) {
        console.log(data);
        res.send(JSON.stringify(data));
    });
});

router.post("/writeAlertMessages", function (req, res) {
    req.setEncoding('utf8');
    console.log("---------------------------------------");
    var requestType = req.get('Content-Type');
    console.log(requestType);

    req.body = JSON.parse(req.body);
    console.log(req.body);
    console.log(req.body.Type === 'Notification');
    console.log("---------------------------------------");

    if (req.body !== undefined && req.body.Type === 'Notification') {
        var messageBody = JSON.parse(req.body.Message);
        console.log("---------------------Alert Message------------------------");
        console.log(messageBody);
        console.log("----------------------------------------------------------");
        var client = connectDeepStream();
        var recordList = client.record.getList("safety/alerts");
        if (messageBody.notificationType === 'upload' || messageBody.notificationType === 'stream') {
            var name = 'alerts/' + client.getUid();
            var newRecordName = client.record.getRecord(name);
            console.log("----In create of " + messageBody.notificationType + "-------------: " + name);
            newRecordName.set({
                type: messageBody.notificationType,
                id: messageBody.alert.id,
                url: messageBody.alert.url,
                fileName: messageBody.alert.fileName,
                user: {
                    phoneNumber: messageBody.alert.user.phoneNumber,
                    emailId: messageBody.alert.user.emailId,
                    userName: messageBody.alert.user.userName
                },
                location: {
                    latitude: messageBody.alert.location.latitude,
                    longitude: messageBody.alert.location.longitude
                },
                status: messageBody.alert.status,
                mediaType: messageBody.alert.mediaType,
                incidentType: messageBody.alert.incidentType,
                time: messageBody.alert.time,
                incidentId: messageBody.alert.incidentId
            });
            recordList.addEntry(name);
            console.log("--------[New upload alert published to deepstream]--------");
            res.send("SUCCESS : New '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
        }
        if (messageBody.notificationType === 'call') {
            var name = 'alerts/' + client.getUid();
            var newRecordName = client.record.getRecord(name);
            console.log("----In create of " + messageBody.notificationType + "-------------:" + name);
            newRecordName.set({
                type: messageBody.notificationType,
                id: messageBody.alert.id,
                caller: {
                    phoneNumber: messageBody.alert.caller.phoneNumber,
                    emailId: messageBody.alert.caller.emailId,
                    userName: messageBody.alert.caller.userName
                },
                callee: {
                    phoneNumber: messageBody.alert.callee.phoneNumber,
                    emailId: messageBody.alert.callee.emailId,
                    userName: messageBody.alert.callee.userName
                },
                location: {
                    latitude: messageBody.alert.location.latitude,
                    longitude: messageBody.alert.location.longitude
                },
                status: messageBody.alert.status,
                mediaType: messageBody.alert.mediaType,
                incidentType: messageBody.alert.incidentType,
                time: messageBody.alert.time,
                incidentId: messageBody.alert.incidentId
            });
            recordList.addEntry(name);
            console.log("--------[New call alert published to deepstream]--------");
            res.send("SUCCESS : New '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
        }
        if (messageBody.notificationType === 'incident') {
            console.log("----In create of " + messageBody.notificationType + "-------------");
            var name = 'alerts/' + client.getUid();
            var newRecordName = client.record.getRecord(name);
            console.log("----In create of " + messageBody.notificationType + "-------------:" + name);
            newRecordName.set({
                notificationType: messageBody.notificationType,
                alert: {
                    id: messageBody.alert.id,
                    time: messageBody.alert.time,
                    name: messageBody.alert.name,
                    parentAlert: [
                        {
                            id: messageBody.alert.parentAlert.id,
                            caller: {
                                phone: messageBody.alert.parentAlert.caller.phone,
                                emailId: messageBody.alert.parentAlert.caller.emailId,
                                userName: messageBody.alert.parentAlert.caller.userName
                            },
                            callee: {
                                phone: messageBody.alert.parentAlert.callee.phone,
                                emailId: messageBody.alert.parentAlert.callee.emailId,
                                userName: messageBody.alert.parentAlert.callee.userName
                            },
                            location: {
                                latitude: messageBody.alert.parentAlert.latitude,
                                longitude: messageBody.alert.parentAlert.longitude
                            },
                            status: messageBody.alert.parentAlert.status,
                            mediaType: messageBody.alert.parentAlert.mediaType,
                            incidentType: messageBody.alert.parentAlert.incidentType,
                            time: messageBody.alert.parentAlert.time,
                            incidentId: messageBody.alert.parentAlert.incidentId
                        }
                    ],
                    mappedAlerts: messageBody.alert.mappedAlerts,
                    createdBy: messageBody.alert.createdBy,
                    msadescription: messageBody.alert.msadescription,
                    status: messageBody.alert.status,
                    assignedTo: [
                        {
                            phone: messageBody.alert.assignedTo.phone,
                            emailId: messageBody.alert.assignedTo.emailId,
                            userName: messageBody.alert.assignedTo.userName
                        }
                    ],
                    alertUsers: [
                        {
                            phone: messageBody.alert.alertUsers.phone,
                            emailId: messageBody.alert.alertUsers.emailId,
                            userName: messageBody.alert.alertUsers.userName
                        }
                    ]
                }
            });
            recordList.addEntry(name);
            console.log("--------[New incident published to deepstream]--------");
            res.send("SUCCESS : New '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
        }
    }
    else {
        console.log("request is invalid");
        res.error("request is invalid");
    }
});
app.use('/api', router);

module.exports = app;
