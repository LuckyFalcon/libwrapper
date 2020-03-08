// libTemporal (SteveLib) wrapper
const addon   = require('../../build/Release/TemporalFunctions');
const crypto  = require('crypto');

//Used to create an entropy object
function createEntropyObject(entropy, size) {
    var timestamp = Date.now();
    var gid = crypto.createHash('sha256').update(entropy).digest('hex');

    var entropyObject = {
        EntropySize: entropy.length,
        Timestamp: timestamp,
        Gid: gid,
        Entropy: entropy.toString('hex')
    }

    return entropyObject;
}

exports.getEntropy = function (appRequest, appResponse, next) {
  var requestedSize = parseInt(appRequest.query.size);
  var buffer = addon.ohSteveOhSteveGiveMeRandomness(requestedSize);
  console.log("invoking libTemporal at requestedSize = " + requestedSize);
  appResponse.writeHead(200, { 'Content-Type': 'application/json' });
  var response = JSON.stringify(createEntropyObject(buffer.slice(0, requestedSize), requestedSize));
  //console.log("response>>\n" + response)
  appResponse.end(response);
}