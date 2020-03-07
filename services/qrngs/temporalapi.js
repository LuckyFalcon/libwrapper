// libTemporal (SteveLib) wrapper
const addon   = require('../../build/Release/TemporalFunctions');
const crypto  = require('crypto');

//Used to create an entropy object
function createEntropyObject(object_entropy, size) {
    var timestamp = Date.now();
    var entropy = object_entropy.substring(0, size);
    var gid = crypto.createHash('sha256').update(Buffer.from(entropy)).digest('hex');

    var entropyObject = {
        EntropySize: entropy.length,
        Timestamp: timestamp,
        Gid: gid,
        Entropy: entropy
    }

    return entropyObject;
}

exports.getEntropy = function (appRequest, appResponse, next) {
  var requestedSize = parseInt(appRequest.query.size);
  var buffer = addon.ohSteveOhSteveGiveMeRandomness(requestedSize);
  appResponse.writeHead(200, { 'Content-Type': 'application/json' });
  appResponse.end(JSON.stringify(createEntropyObject(buffer.slice(0, requestedSize).toString('hex'), requestedSize)));
}