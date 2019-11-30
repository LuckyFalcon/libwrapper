const path  = require('path');
const qrng  = require(path.join(process.cwd(), "/services/anuapi/anuapi.js"));
const addon = require(path.join(process.cwd(), '/build/Release/AttractFunctions'));
const cont  = require(path.join(process.cwd(), '/controllers/Controller'));
const now   = require("performance-now")

module.exports = function(limit, callback){
  
  //Set letiables recieved from the main function.
  let GID = limit.GID;
  let x = limit.x;
  let y = limit.y;
  let radius = limit.radius;
  let filter = limit.filter;
  let handle = limit.handle;
  let pool = limit.pool;
  
  //Check if GID is found
  qrng.getentropy(GID, pool, function(result) {
       if (result == "1") {callback(null, "GID invalid");
       } else {
        let gid_valid = true;

        //Set the hex to the result of the entropy
        let myHexString = result.Entropy;

        //Create a buffer for the hex string
        let buffer = Buffer.from(myHexString);

        //Init the instance
        let instanceWithHex = addon.initWithHex(handle, buffer, buffer.length);

        //Start timer
        let start = now()

        addon.CalculateResultsAsync(instanceWithHex, radius, x, y, GID, filter, function(results) {
          //End timer
          let end = now()

          //Total time calculation
          let calc_time = (end).toFixed(2);

          //We create a array from the results of making the attractors. 
          cont.makeattractor(GID, results, gid_valid, true, calc_time, function(results){

            //Return the results so the message can be send to the main function.   
            callback(null, results);

          });
          
        });
      }
        
  }); // End qrng getentropy
  
}; // End function