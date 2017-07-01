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
            if (messageBody.alert.status.toUpperCase() === 'new'.toUpperCase()) {
                if (messageBody.notificationType === 'upload' || messageBody.notificationType === 'stream') {
                    var name = 'alerts/' + client.getUid();
                    var newRecordName = client.record.getRecord(name);
                    console.log("----In create of " + messageBody.notificationType + "-------------: " + name);
                    newRecordName.set({
                        notificationType: messageBody.notificationType,
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
                        notificationType: messageBody.notificationType,
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
                    var parentAlerts = [];
                    var assignedToList = [];
                    var alertUsersList = [];
                    var mappedAlertList = [];
                    for (var i in messageBody.alert.parentAlert) {
                        if (i.notificationType === 'call') {
                            var singleAlert = {
                                alertId: messageBody.alert.parentAlert[i].alertId,
                                alertType: 'call',
                                caller: {
                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                },
                                callee: {
                                    phoneNumber: messageBody.alert.parentAlert[i].callee.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].callee.emailId,
                                    userName: messageBody.alert.parentAlert[i].callee.userName
                                },
                                location: {
                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                }
                            };
                        } else {
                            var singleAlert = {
                                alertId: messageBody.alert.parentAlert[i].alertId,
                                alertType: 'file',
                                user: {
                                    phoneNumber: messageBody.alert.parentAlert[i].user.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].user.emailId,
                                    userName: messageBody.alert.parentAlert[i].user.userName
                                },
                                location: {
                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                }
                            };
                        }

                        parentAlerts.push(singleAlert);
                    }
                    console.log(parentAlerts.length);
                    for (var i in messageBody.alert.mappedAlerts) {
                        if (i.notificationType === 'call') {
                            var singleAlert = {
                                alertId: messageBody.alert.parentAlert[i].alertId,
                                alertType: 'call',
                                caller: {
                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                },
                                callee: {
                                    phoneNumber: messageBody.alert.parentAlert[i].callee.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].callee.emailId,
                                    userName: messageBody.alert.parentAlert[i].callee.userName
                                },
                                location: {
                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                }
                            };
                        } else {
                            var singleAlert = {
                                alertId: messageBody.alert.parentAlert[i].alertId,
                                alertType: 'file',
                                user: {
                                    phoneNumber: messageBody.alert.parentAlert[i].user.phoneNumber,
                                    emailId: messageBody.alert.parentAlert[i].user.emailId,
                                    userName: messageBody.alert.parentAlert[i].user.userName
                                },
                                location: {
                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                }
                            };
                        }
                        mappedAlertList.push(singleAlert);
                    }
                    console.log(mappedAlertList.length);

                    for (var i in messageBody.alert.assignedTo) {
                        var assign = {
                            phoneNumber: messageBody.alert.assignedTo[i].phoneNumber,
                            emailId: messageBody.alert.assignedTo[i].emailId,
                            userName: messageBody.alert.assignedTo[i].userName
                        };
                        assignedToList.push(assign);
                    }

                    console.log(assignedToList.length);

                    for (var i in messageBody.alert.alertUsers) {
                        var user = {
                            phoneNumber: messageBody.alert.alertUsers[i].phoneNumber,
                            emailId: messageBody.alert.alertUsers[i].emailId,
                            userName: messageBody.alert.alertUsers[i].userName
                        };
                        alertUsersList.push(user);
                    }
                    console.log(alertUsersList.length);

                    newRecordName.set({
                        notificationType: messageBody.notificationType,
                        alert: {
                            id: messageBody.alert.id,
                            time: messageBody.alert.time,
                            name: messageBody.alert.name,
                            parentAlert: parentAlerts,
                            mappedAlerts: messageBody.alert.mappedAlerts,
                            createdBy: messageBody.alert.createdBy,
                            msadescription: messageBody.alert.msadescription,
                            status: messageBody.alert.status,
                            assignedTo: assignedToList,
                            alertUsers: alertUsersList
                        }
                    });
                    recordList.addEntry(name);
                    console.log("--------[New incident published to deepstream]--------");
                    res.send("SUCCESS : New '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                }
            } else {
                recordList.whenReady(function (recordList) {
                    var entries = recordList.getEntries();
                    console.log(entries);
                    for (var entry in entries) {
                        var existingRecords = client.record.getRecord(entries[entry]);
                        existingRecords.whenReady(function (existingRecord) {
                            console.log("====================================================");
                            console.log(existingRecord.name);
                            console.log(existingRecord.get('incidentId') + "===" + messageBody.alert.incidentId);
                            console.log("--------------------^incidentId^---------------------------------");
                            if (existingRecord.get('incidentId') === messageBody.alert.incidentId) {
                                if (messageBody.notificationType === 'upload' || messageBody.notificationType === 'stream') {
                                    console.log("----In update of " + messageBody.notificationType + "-------------");
                                    existingRecord.set({
                                        notificationType: messageBody.notificationType,
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
                                    console.log("--------[Updated upload/stream alert published to deepstream]--------");
                                    res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                                }
                                if (messageBody.notificationType === 'call') {
                                    console.log("----In update of " + messageBody.notificationType + "-------------");
                                    existingRecord.set({
                                        notificationType: messageBody.notificationType,
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
                                    console.log("--------[updated CALL alert published to deepstream]--------");
                                    res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                                }
                                if (messageBody.notificationType === 'incident') {
                                    console.log("----In update of " + messageBody.notificationType + "-------------")
                                    var parentAlerts = [];
                                    var assignedToList = [];
                                    var alertUsersList = [];
                                    var mappedAlertList = [];
                                    for (var i in messageBody.alert.parentAlert) {
                                        if (i.notificationType === 'call') {
                                            var singleAlert = {
                                                id: messageBody.alert.parentAlert[i].id,
                                                caller: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                                },
                                                callee: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].callee.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].callee.emailId,
                                                    userName: messageBody.alert.parentAlert[i].callee.userName
                                                },
                                                location: {
                                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                                }
                                            };
                                        } else {
                                            var singleAlert = {
                                                id: messageBody.alert.parentAlert[i].id,
                                                user: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                                },
                                                location: {
                                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                                }
                                            };
                                        }
                                        parentAlerts.push(singleAlert);
                                    }
                                    console.log(parentAlerts.length);
                                    for (var i in messageBody.alert.mappedAlerts) {
                                        if (i.notificationType === 'call') {
                                            var singleAlert = {
                                                id: messageBody.alert.parentAlert[i].id,
                                                caller: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                                },
                                                callee: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].callee.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].callee.emailId,
                                                    userName: messageBody.alert.parentAlert[i].callee.userName
                                                },
                                                location: {
                                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                                }
                                            };
                                        } else {
                                            var singleAlert = {
                                                id: messageBody.alert.parentAlert[i].id,
                                                user: {
                                                    phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                                                    emailId: messageBody.alert.parentAlert[i].caller.emailId,
                                                    userName: messageBody.alert.parentAlert[i].caller.userName
                                                },
                                                location: {
                                                    latitude: messageBody.alert.parentAlert[i].location.latitude,
                                                    longitude: messageBody.alert.parentAlert[i].location.longitude
                                                }
                                            };
                                        }
                                        mappedAlertList.push(singleAlert);
                                    }
                                    console.log(mappedAlertList.length);

                                    for (var i in messageBody.alert.assignedTo) {
                                        var assign = {
                                            phoneNumber: messageBody.alert.assignedTo[i].phoneNumber,
                                            emailId: messageBody.alert.assignedTo[i].emailId,
                                            userName: messageBody.alert.assignedTo[i].userName
                                        };
                                        assignedToList.push(assign);
                                    }

                                    console.log(assignedToList.length);

                                    for (var i in messageBody.alert.alertUsers) {
                                        var user = {
                                            phoneNumber: messageBody.alert.alertUsers[i].phoneNumber,
                                            emailId: messageBody.alert.alertUsers[i].emailId,
                                            userName: messageBody.alert.alertUsers[i].userName
                                        };
                                        alertUsersList.push(user);
                                    }
                                    console.log(alertUsersList.length);

                                    existingRecord.set({
                                        notificationType: messageBody.notificationType,
                                        alert: {
                                            id: messageBody.alert.id,
                                            time: messageBody.alert.time,
                                            name: messageBody.alert.name,
                                            parentAlert: parentAlerts,
                                            mappedAlerts: messageBody.alert.mappedAlerts,
                                            createdBy: messageBody.alert.createdBy,
                                            msadescription: messageBody.alert.msadescription,
                                            status: messageBody.alert.status,
                                            assignedTo: assignedToList,
                                            alertUsers: alertUsersList
                                        }
                                    });
                                    console.log("--------[Incident updated to deepstream]--------");
                                    res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                                }
                            }
                        });
                    }
                });
            }
        }
        else {
            console.log("request is invalid");
            res.error("request is invalid");
        }
    }
);
router.post("/updateAlertMessages", function (req, res) {
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
        recordList.whenReady(function (recordList) {
            var entries = recordList.getEntries();
            console.log(entries);
            for (var entry in entries) {
                var existingRecords = client.record.getRecord(entries[entry]);
                existingRecords.whenReady(function (existingRecord) {
                    console.log("====================================================");
                    console.log(existingRecord.name);
                    console.log(existingRecord.get('incidentId') + "===" + messageBody.alert.incidentId);
                    console.log("-----------------------------------------------------");
                    if (existingRecord.get('incidentId') === messageBody.alert.incidentId) {
                        if (messageBody.notificationType === 'upload' || messageBody.notificationType === 'stream') {
                            console.log("----In update of " + messageBody.notificationType + "-------------");
                            existingRecord.set({
                                notificationType: messageBody.notificationType,
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
                            console.log("--------[Updated upload/stream alert published to deepstream]--------");
                            res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                        }
                        if (messageBody.notificationType === 'call') {
                            console.log("----In update of " + messageBody.notificationType + "-------------");
                            existingRecord.set({
                                notificationType: messageBody.notificationType,
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
                            console.log("--------[updated CALL alert published to deepstream]--------");
                            res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                        }
                        /*if (messageBody.notificationType === 'incident') {
                         console.log("----In update of " + messageBody.notificationType + "-------------")
                         var parentAlerts = [];
                         var assignedToList = [];
                         var alertUsersList = [];
                         var mappedAlertList = [];
                         for (var i in messageBody.alert.parentAlert) {
                         var singleAlert = {
                         id: messageBody.alert.parentAlert[i].id,
                         caller: {
                         phoneNumber: messageBody.alert.parentAlert[i].caller.phoneNumber,
                         emailId: messageBody.alert.parentAlert[i].caller.emailId,
                         userName: messageBody.alert.parentAlert[i].caller.userName
                         },
                         callee: {
                         phoneNumber: messageBody.alert.parentAlert[i].callee.phoneNumber,
                         emailId: messageBody.alert.parentAlert[i].callee.emailId,
                         userName: messageBody.alert.parentAlert[i].callee.userName
                         },
                         location: {
                         latitude: messageBody.alert.parentAlert[i].location.latitude,
                         longitude: messageBody.alert.parentAlert[i].location.longitude
                         }
                         };
                         parentAlerts.push(singleAlert);
                         }
                         console.log(parentAlerts.length);
                         for (var i in messageBody.alert.mappedAlerts) {
                         var singleAlert = {
                         id: messageBody.alert.mappedAlerts[i].id,
                         caller: {
                         phoneNumber: messageBody.alert.mappedAlerts[i].caller.phoneNumber,
                         emailId: messageBody.alert.mappedAlerts[i].caller.emailId,
                         userName: messageBody.alert.mappedAlerts[i].caller.userName
                         },
                         callee: {
                         phoneNumber: messageBody.alert.mappedAlerts[i].callee.phoneNumber,
                         emailId: messageBody.alert.mappedAlerts[i].callee.emailId,
                         userName: messageBody.alert.mappedAlerts[i].callee.userName
                         },
                         location: {
                         latitude: messageBody.alert.mappedAlerts[i].location.latitude,
                         longitude: messageBody.alert.mappedAlerts[i].location.longitude
                         }
                         };
                         mappedAlertList.push(singleAlert);
                         }
                         console.log(mappedAlertList.length);

                         for (var i in messageBody.alert.assignedTo) {
                         var assign = {
                         phoneNumber: messageBody.alert.assignedTo[i].phoneNumber,
                         emailId: messageBody.alert.assignedTo[i].emailId,
                         userName: messageBody.alert.assignedTo[i].userName
                         };
                         assignedToList.push(assign);
                         }

                         console.log(assignedToList.length);

                         for (var i in messageBody.alert.alertUsers) {
                         var user = {
                         phoneNumber: messageBody.alert.alertUsers[i].phoneNumber,
                         emailId: messageBody.alert.alertUsers[i].emailId,
                         userName: messageBody.alert.alertUsers[i].userName
                         };
                         alertUsersList.push(user);
                         }
                         console.log(alertUsersList.length);

                         existingRecord.set({
                         notificationType: messageBody.notificationType,
                         alert: {
                         id: messageBody.alert.id,
                         time: messageBody.alert.time,
                         name: messageBody.alert.name,
                         parentAlert: parentAlerts,
                         mappedAlerts: messageBody.alert.mappedAlerts,
                         createdBy: messageBody.alert.createdBy,
                         msadescription: messageBody.alert.msadescription,
                         status: messageBody.alert.status,
                         assignedTo: assignedToList,
                         alertUsers: alertUsersList
                         }
                         });
                         console.log("--------[Incident updated to deepstream]--------");
                         res.send("SUCCESS : updated '" + messageBody.notificationType.toUpperCase() + "' alert published to deepstream");
                         }*/
                    }
                });
            }
        });
    }
    else {
        console.log("request is invalid");
        res.error("request is invalid");
    }
})
;
app.use('/api', router);

module.exports = app;
