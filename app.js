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
    // var client = deepStream(deepStreamServerURL).login();
    var client = connectDeepStream();
    var connection = client.record.getList("safety/alerts");
    connection.subscribe(function (data) {
        console.log(data);
        res.send(JSON.stringify(data));
    });
});
router.post("/writeAlertMessages", function (req, res) {
    req.setEncoding('utf8');

    var alertMessages = {
        "Type": "Notification",
        "MessageId": "f9a037e9-389f-5eb2-8749-664dbad67398",
        "TopicArn": "arn:aws:sns:us-west-2:421971994929:FileAlertTopic",
        "Message": {
            "id": "9bdb3690-7d97-4b4d-a861-6785786c69a3",
            "url": "https://esbucketservice.s3.amazonaws.com/5555555-Test.pdf",
            "fileName": "5555555-Test.pdf",
            "user": {
                "phoneNumber": "8800094877",
                "emailId": "manmohan_saini82@rediffmail.com",
                "userName": "msaini"
            },
            "location": {
                "latitude": 14,
                "longitude": 12
            },
            "status": "read",
            "mediaType": "jpeg",
            "incidentType": "Fire",
            "time": "2017/05/25 06:50:04",
            "incidentId": "12345"
        },
        "Timestamp": "2017-05-28T07:45:13.261Z",
        "SignatureVersion": "1",
        "Signature": "MUAEZcOqI4cRpn73Mc5kwAAr8KFJPKuoAKbI1HU8BvwwWBY5tv8WTtlmJmKU9lCyfuX5LAh5XWpF66aTA0ONKqqOAKzoKEMI9uuswOv1w0ZWHmQqDQSASRTXiW9zjyxFDHwOgkaCrSmz8978R9B1AsaPdKZpFvjU2NQasqvU1owghGG/yDmkC7BDyuOswdUfwg+5obQQQHFLFrKpe++e7wjj9LVdfL8475z6IjJhVDjza9V8t51D+iEShbo8+Dl+WOjLBwBjC+cM+rHfHai89Y/S9h8PC2O7qpCGUoN2Ey52Hrrai+5LJKUIaw1S6DoEI4ViJ6qjpKMqyjN5Tk7QTA==",
        "SigningCertURL": "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
        "UnsubscribeURL": "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:421971994929:FileAlertTopic:3ab86d28-daa4-41d8-9824-eb60a2c39bf9"
    };

    if (alertMessages.Type === 'Notification') {
        var client = connectDeepStream();
        var recordList = client.record.getList("safety/alerts");
        client.record.getRecord('alerts/j38ixnmc-148a2pk2g3x').delete();
        var name = 'alerts/' + client.getUid();
        var newRecordName = client.record.getRecord(name);
        newRecordName.set({
            id: alertMessages.Message.id,
            url: alertMessages.Message.url,
            fileName: alertMessages.Message.fileName,
            user: {
                phoneNumber: alertMessages.Message.user.phoneNumber,
                emailId: alertMessages.Message.user.emailId,
                userName: alertMessages.Message.user.userName
            },
            location: {
                latitude: alertMessages.Message.location.latitude,
                longitude: alertMessages.Message.location.longitude
            },
            status: alertMessages.Message.status,
            mediaType: alertMessages.Message.mediaType,
            incidentType: alertMessages.Message.incidentType,
            time: alertMessages.Message.time,
            incidentId: alertMessages.Message.incidentId
        });
        recordList.addEntry(name);
        res.send("success");
    }


});
app.use('/api', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    console.log(err)
});

module.exports = app;
