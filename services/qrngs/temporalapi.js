// libTemporal (SteveLib) wrapper
const addon   = require('../../build/Release/TemporalFunctions');
const crypto  = require('crypto');
const fs      = require('fs');

// Used to create an entropy response object
function createResponseObject(entropy, size) {
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

exports.getEntropy = function (appRequest, appResponse, callback) {
  var requestedSize = parseInt(appRequest.query.size);
  console.log("invoking libTemporal at requestedSize = " + requestedSize);

  var buffer = addon.ohSteveOhSteveGiveMeRandomness(requestedSize);

  var responseObject = createResponseObject(buffer.slice(0, requestedSize));

  // Write file to disk by GID
  fs.writeFile ('./services/entropy/temporal/'+responseObject.Gid+".steve", JSON.stringify(responseObject), function(err) {
    if (err){
      callback(JSON.stringify(1));
    } else {
      console.log('complete');
      callback(responseObject);
    }
  });
}