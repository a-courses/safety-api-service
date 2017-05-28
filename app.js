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
    console.log(req.body);
    console.log("---------------------------------------");
    var alertMessages =
    {
        "Type": "Notification",
        "MessageId": "a9ff8a52-feff-5656-b21a-dbcd4aba3ffb",
        "TopicArn": "arn:aws:sns:us-west-2:421971994929:FileAlertTopic",
        "Message": "{\"id\":\"5dc7dbae-1228-4dc2-97aa-bd387b6abfbb\",\"caller\":{\"phoneNumber\":\"8800094877\",\"emailId\":\"manmohan_saini82@rediffmail.com\",\"userName\":\"msaini\"},\"callee\":{\"phoneNumber\":\"8800094877\",\"emailId\":\"manmohan_saini82@rediffmail.com\",\"userName\":\"msaini\"},\"location\":{\"latitude\":14.0,\"longitude\":12.0},\"status\":\"new\",\"mediaType\":\"jpeg\",\"incidentType\":\"Fire\",\"time\":\"2017/05/12 16:38:48\",\"incidentId\":\"12345\"}",
        "Timestamp": "2017-05-24T16:17:09.732Z",
        "SignatureVersion": "1",
        "Signature": "KHdQr/jyyLZ6nt9p/BUTfIdfEpKXzQudBUHP9gbTbHD8euemE0UpfR70+GMHPzmybShynZf2ntY57ex4ZgrGi8nC7W5gyzbFJn/kHDrYEpJNgmtAufFrHFGjZRO+J0Ca7bAdrmWaZvDimbO9ZTrfMmYAO4R3EYBuXJuw8MVfi+yEx42pgLn1iUURiPTfP1TRHWUhSjquU91dhc/8UBRia/3bC+xMWOPS61GEbxHON8uxs6yQdiGbZE8hWO05HXegtnC/lzKJoon4LwKYZ7TL13+ukZGViR3ggzewc+ga4A/zMTxLMyJ73fN32uWsYy9cUYdtzNOkgRLYABRbp2MJhQ==",
        "SigningCertURL": "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
        "UnsubscribeURL": "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:421971994929:FileAlertTopic:9118ae30-a6b0-4bc9-8c42-5c1d2796f421"
    };

    if (req.body !== undefined && req.body.Type === 'Notification') {
        var messageBody = JSON.parse(req.body.Message);
        console.log("---------------------Alert Message------------------------");
        console.log(messageBody);
        console.log("----------------------------------------------------------");
        var client = connectDeepStream();
        var recordList = client.record.getList("safety/alerts");
        var name = 'alerts/' + client.getUid();
        var newRecordName = client.record.getRecord(name);
        newRecordName.set({
            id: messageBody.id,
            url: messageBody.url,
            fileName: messageBody.fileName,
            user: {
                phoneNumber: messageBody.user.phoneNumber,
                emailId: messageBody.user.emailId,
                userName: messageBody.user.userName
            },
            location: {
                latitude: messageBody.location.latitude,
                longitude: messageBody.location.longitude
            },
            status: messageBody.status,
            mediaType: messageBody.mediaType,
            incidentType: messageBody.incidentType,
            time: messageBody.time,
            incidentId: messageBody.incidentId
        });
        recordList.addEntry(name);
        console.log("--------[New record published to deepstream]--------");
        res.send("success");
    } else {
        res.send("request is invalid");
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
    console.log("-----------Error--------------");
    console.log(err)
    console.log("------------------------------");
});

module.exports = app;
