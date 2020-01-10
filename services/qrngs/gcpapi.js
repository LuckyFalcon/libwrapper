// GCP API - API for Global Consciousness Project
const _ = require('lodash');
const request = require('request');
const csvparser = require('csv-parse');
const moment = require('moment');
const crypto  = require('crypto');

// eg. http://global-mind.org/cgi-bin/eggdatareq.pl?z=1&year=2020&month=1&day=10&stime=00%3A00%3A00&etime=23%3A59%3A59
const API_HOST = "http://global-mind.org";

// http://noosphere.princeton.edu/basket_CSV_v2.html
// Protocol Description: Type 10 Records
// Field 1: Type   Field 2: Item Field 3: Value     Field 4: Comment     Variable
// ...
// 10             4             Trials per sample "Trial size"         $trialsz
// "Trial size" seems fixed at 200 bits/sec so we'll const'ify it
const TRIAL_SIZE = 200;

// The number of seconds it seems to take for most eggs to send their data for near realtime updates
const ESTIMATED_GCP_UPDATE_DELAY_TIME = 300;

// the averaging number of eggs reporting from the past couple of years (as of 2020-01-10)
// seems to be 24-26, we'll be conversative and say 24
const AVG_REPORTING_EGGS = 24;

function makeRequestUrl(year, month, day, startTime, endTime) {
    var url = API_HOST +
        "/cgi-bin/eggdatareq.pl" +
        "?z=1" + // not sure what this does
        "&year=" + year +
        "&month=" + month +
        "&day=" + day +
        "&stime=" + startTime +
        "&etime=" + endTime;
    console.log("request url:" + url);
    return url;
}

//Used to create an entropy object
createEntropyObject = function (object_entropy, size) {
    var timestamp = Date.now();
    var entropy = object_entropy.substring(0, size);

    var entropyObject = {
        EntropySize: entropy.length,
        Timestamp: timestamp,
        Entropy: entropy
    }

    return entropyObject;
}

exports.getEntropy = function (appRequest, appResponse, next) {
    var now = moment(moment().utc()).subtract(ESTIMATED_GCP_UPDATE_DELAY_TIME, 'seconds');
    var endTimeFmt = moment(now).format('HH:mm:ss'); // current UTC 00:00:00
    var yearFmt = now.format('YYYY');
    var monthFmt = now.format('MM');
    var dayFmt = now.format('DD');
    var requestedByteSize = appRequest.query.size / 2; // divide by 2 because GET request param size is for the hex size
    var secsOfDataNeeded = Math.round(requestedByteSize / AVG_REPORTING_EGGS) + ESTIMATED_GCP_UPDATE_DELAY_TIME;
    var startTime = now.subtract(secsOfDataNeeded, 'seconds');
    var startTimeFmt = moment(startTime).format('HH:mm:ss') // current UTC 00:00:00 - secsOfDataNeeded
    if (startTime.isBefore(now, 'day')) {
        // if the start time's day yields to be any day before the current day, then as
        // the GCP API only seems to allow single-day queries, we'll set it to 00:00:00
        // and let the logic later on trigger extra API call(s) to get the extra entropy
        startTimeFmt = '00:00:00';
    }

    request(makeRequestUrl(yearFmt, monthFmt, dayFmt, startTimeFmt, endTimeFmt),
        function (gcpRequestError, gcpResponse, body) {
            if (gcpRequestError) {
                // TODO: return json error
                console.error(err);
                return;
            }

            if (gcpResponse.statusCode != 200) {
                // TODO: return json error
                console.error(gcpResponse.statusCode);
                return;
            }

            var hexEntropy = "";

            // parse the csv output
            // ref: http://noosphere.princeton.edu/basket_CSV_v2.html
            csvparser(
                body,
                { relax_column_count: true },
                function (csvParseError, records) {
                    if (csvParseError) {
                        // TODO: return json error
                        console.error(csvParseError);
                        return;
                    }

                    // iterate all lines, process only sample value rows
                    records.forEach(function (record) {
                        if (record[0] == 13) { // field type 13: actual sample data
                            _.slice(record, 3) // skip field type, unix timestamp, user friendly timestamp columns
                                .forEach(function (samplit) {
                                    if (!samplit) {
                                        return; // skip void sample values where there was no report from the egg
                                    }

                                    // normalize all sample values (0-200 sample range) into 0-0xff and convert to hex, concat
                                    // N.B. 200 seems a fixed constant, even though we can get it from the API response. hardcoding it seems fine...
                                    hexEntropy += Math.round((samplit / TRIAL_SIZE * 0xff)).toString(16);
                                });
                        }
                    });

                    console.log(hexEntropy.length);

                    var resp = createEntropyObject(hexEntropy, appRequest.query.size);
                    appResponse.writeHead(200, { 'Content-Type': 'application/json' });
                    appResponse.end(JSON.stringify(resp));
                });
        });
}