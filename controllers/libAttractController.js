'use strict';
const { check, validationResult } = require('express-validator');
const path       = require('path');
const crypto     = require('crypto');
const addon      = require(path.join(process.cwd(), '/build/Release/AttractFunctions'));
const anuQrng    = require(path.join(process.cwd(), "/services/qrngs/anuapi.js"));
const gcpQrng   =  require(path.join(process.cwd(), "/services/qrngs/gcpapi.js"));
const checkAuth  = require(path.join(process.cwd(), "/services/authentication/check-auth.js"));
const workerFarm = require('worker-farm')
    , workers    = workerFarm({maxConcurrentWorkers : 3, maxConcurrentWorkers : 1}, require.resolve(path.join(process.cwd(), "/services/getAttractor/forkedlongComputation.js")))
const reports    = require(path.join(process.cwd(), "/services/reports/save"));

//Used to get the current version of libAttract
exports.list_version = (req, res) => {

   //Call Functions from libAttractFunctions and set variables
   let VersionMajor = addon.getVersionMajor();
   let VersionMinor = addon.getVersionMinor();
   let VersionPatch = addon.getVersionPatch();

   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

   //Create object containing the version information
   let versionObject = {
     Name: 'LibAttract',
     Version: VersionMajor + "." + VersionMinor + "." + VersionPatch,
     Major: VersionMajor,
     Minor: VersionMinor,
     Patch: VersionPatch
   }

   //Convert object to JSON and end response. 
   res.end(JSON.stringify(versionObject));
}

//Used to get current pool of entropy
exports.getPool = (req, res) => {
  
  //Set the content type and status code
  res.writeHead(200, {'content-Type': 'application/json'});

  anuQrng.getpool(function(result) {
      res.end(JSON.stringify(result));
  });
}

//Used to get all pools available
exports.getpools = (req, res) => {
  
  //Set the content type and status code
  res.writeHead(200, {'content-Type': 'application/json'});

  anuQrng.getpools(function(result) {
      res.end(JSON.stringify(result));
  });
}


//Used to set own entropy
exports.setentropy = [
  check('size')
    .isNumeric()
    .not().isEmpty(),

  check('timestamp')
    .isNumeric()
    .optional(),

  check('entropy')
    .not().isEmpty()
    .isHexadecimal(),

 (req, res, next) => { /* the rest of the existing function */ 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  if (req.body.size < 286) {res.writeHead(400, {'content-Type': 'application/json'}); res.end(JSON.stringify("Size Error, size has to be set to 286 Minimum"))}
  else if (req.body.size > 6000000) {res.writeHead(400, {'content-Type': 'application/json'}); res.end(JSON.stringify("Size Error, size has to be set to 6000000 Maximum"))}
  else {
  //Set the content type and status code
  res.writeHead(200, {'content-Type': 'application/json'});
  
  //Set variables to params
  var size = parseFloat(req.body.size); 
  var entropy = req.body.entropy;
  var gid = crypto.createHash('sha256').update(req.body.entropy).digest('hex');

  //Check if timestamp is specified otherwise generate
  if(req.body.timestamp){
    var timestamp = parseFloat(req.body.timestamp);
   } else {
    var timestamp = Date.now();  
   } // End if


  //Check if the entropy is the same as the specified size. 
  if (entropy.length != req.body.size){
      res.end(JSON.stringify("size does not match length of entropy string"));
  } else {
      var hexfromAnu = anuQrng.saveentropy(entropy, size, gid, timestamp, function(result) {
          res.end(JSON.stringify(result));
      });
  } // End if

}
}
];

//Get the attractors
exports.attractors = [
  check('gid')
    .isHexadecimal(),

  check('center[0]')
    .isNumeric(),

  check('center[1]')
    .isNumeric(),

  check('radius')
    .isNumeric(),

  check('filtering')
    .isFloat({ min: 0, max: 4 })
    .optional(),

  check('pool')
    .isBoolean()
    .optional(),

 async function attractors(req, res, next) { /* the rest of the existing function */ 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  try {

  //We fork our process
  //const forked = fork(path.join(process.cwd(), 'services/getAttractor/forkedlongComputation.js'));

  //Get GID from the qeury
  var GID = req.query.gid;
    
  //Center, consists of x for latitude and y for longitude
  var x = parseFloat(req.query.center[0]);
  var y = parseFloat(req.query.center[1]);

  //Radius, radius is used to determine the radius of the attractor
  var radius = parseFloat(req.query.radius); 

  //Set handle
  var handle = addon.getHandle();

  if (req.query.filtering) {var filter = parseFloat(req.query.filtering); 
  } else { var filter = 4.0; } //end if
    //Set pool
  if (req.query.pool){var pool = req.query.pool;
  } else {var pool = false;}
      
  //Create object with parameters to send to fork
  var myObj = {
      'GID': GID,
      'handle': handle,
      'x': x,
      'y': y,
      'radius': radius,
      'filter': filter,
      'pool': pool
  }

  //Send object to worker
  workers(myObj, function (err, output) {
    if (err){
      res.json({ error: err || err.toString() });
    }

    //When the worker sends a message we send the result to the client
    res.json(output);
  })
  
  } catch (err) {

    console.log('Err');
   
  }
}
];

//Search for entropy with GID or reqeust entropy based on size
exports.entropy = [
  check('gid')
    .isHexadecimal()
    .optional(),

  check('raw')
    .isAlpha()
    .optional(),

  check('size')
    .isNumeric()
    .optional(),

  check('gcp')
    .isBoolean()
    .optional(),
    
  check('pool')
    .isBoolean()
    .optional(),

 (req, res, next) => { /* the rest of the existing function */ 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

    //Check for GCP request
    if (req.query.gcp) {
      gcpQrng.getEntropy(req, res, next);
      return;
    }

    //Check for GID
    if (req.query.gid && !req.query.size){ 

      anuQrng.getentropy(req.query.gid, req.query.pool, function(result) {
        if (result == "1") { //File not found
            res.end(JSON.stringify("GID was not found"));     
        } else {//File is found, check for raw.
        //Set the content type and status code
        res.writeHead(200, {'content-Type': 'application/json'});
            if (!req.query.raw){
              delete result.Entropy; 
              res.end(JSON.stringify(result));
            } else {
              res.end(JSON.stringify(result));
            }
        }
      }); //End anuQrng.getentropy 


    //Check for size
    } else if (req.query.size && !req.query.gid) {
     
      var entropy = anuQrng.getsizeqrng(req.query.size, function(result) {
        if (result == "1") {res.writeHead(400, {'content-Type': 'application/json'}); res.end(JSON.stringify("Size Error, size has to be set to 286 minimum"))}
        else if (result == "2") {res.writeHead(400, {'content-Type': 'application/json'}); res.end(JSON.stringify("Size Error, Minimum size can be set to 286"))}
        else if (result == "3") {res.writeHead(400, {'content-Type': 'application/json'}); res.end(JSON.stringify("Size Error, Maximum size can be set to 6000000"))}
        else if (req.query.raw == 'false'){

          res.writeHead(200, {'content-Type': 'application/json'});

          delete result.Entropy; 
          res.end(JSON.stringify(result));
        } else {

          res.writeHead(200, {'content-Type': 'application/json'});

          res.end(JSON.stringify(result));
        }

      });
     
   } else if (req.query.size && req.query.gid) {//No gid or Size
    //Set the content type and status code
    res.writeHead(400, {'content-Type': 'application/json'});
    
    res.end(JSON.stringify("Only one parameter should be specified."));

   } else if (!req.query.size && !req.query.gid) {//No gid or Size
    //Set the content type and status code
    res.writeHead(400, {'content-Type': 'application/json'});
    
    res.end(JSON.stringify("Gid or Size not specified"));

   }
   
}
];

//Do a psuedo run
exports.psuedo = [
  check('n')
    .isNumeric(),

  check('center[0]')
    .isNumeric(),

  check('center[1]')
    .isNumeric(),

  check('radius')
    .isNumeric(),

  check('spotradius')
    .isNumeric()
    .optional(),

  check('filtering')
    .isFloat({ min: 0, max: 4 })
    .optional(),

 (req, res, next) => { /* the rest of the existing function */ 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  if (req.query.n && req.query.center[0] && req.query.center[1] && req.query.radius && !req.query.seed && !req.query.filtering){
   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

   var GID = 1;

   var filter = parseFloat(req.query.filtering); 

   //Call Functions from C++ and save them in var
   var n = parseFloat(req.query.n); 
   var radius = parseFloat(req.query.radius); 

   //Coordinates x for latitude and y for longitude
   var x = parseFloat(req.query.center[0]);
   var y = parseFloat(req.query.center[1]);

   //Get Handle
   var handle = addon.getHandle();
 
   //Run psuedoInstance and get findAttractors
   var psuedoInstance = addon.initWithPseudo(handle, n);

   //Find and Calculate attractors
   addon.CalculateResultsAsync(psuedoInstance, radius, x, y, GID, filter, function(results) {        
           res.end(JSON.stringify(results));
   });

  } else if (req.query.n && req.query.center[0] && req.query.center[1] && req.query.radius && req.query.seed && !req.query.filtering){
   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

   var GID = 1;

   var filter = parseFloat(req.query.filtering); 

   //Call Functions from C++ and save them in var
   var n = parseFloat(req.query.n); 
   var radius = parseFloat(req.query.radius); 
   var seed = parseFloat(req.query.seed); 

   //Coordinates x for latitude and y for longitude
   var x = parseFloat(req.query.center[0]);
   var y = parseFloat(req.query.center[1]);

   //Get Handle
   var handle = addon.getHandle();

   //Run psuedoInstance and get findAttractors
   var psuedoInstance = addon.initWithPseudo(handle, n, seed);

   //Find and Calculate attractors
   addon.CalculateResultsAsync(psuedoInstance, radius, x, y, GID, filter, function(results) {        
           res.end(JSON.stringify(results));
   });

  } else if (req.query.n && req.query.center[0] && req.query.center[1] && req.query.radius && !req.query.seed && req.query.filtering){
   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

   var GID = 1;

   var filter = parseFloat(req.query.filtering);

   //Call Functions from C++ and save them in var
   var n = parseFloat(req.query.n); 
   var radius = parseFloat(req.query.radius); 
   var seed = parseFloat(req.query.seed); 

   //Coordinates x for latitude and y for longitude
   var x = parseFloat(req.query.center[0]);
   var y = parseFloat(req.query.center[1]);

   //Get Handle
   var handle = addon.getHandle();

   //Run psuedoInstance and get findAttractors
   var psuedoInstance = addon.initWithPseudo(handle, n);

   //Find and Calculate attractors
   addon.CalculateResultsAsync(psuedoInstance, radius, x, y, GID, filter, function(results) {        
           res.end(JSON.stringify(results));
   });


  } else if (req.query.n && req.query.center[0] && req.query.center[1] && req.query.radius && req.query.seed && req.query.filtering){
   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

   var GID = 1;

   var filter = parseFloat(req.query.filtering);

   //Call Functions from C++ and save them in var
   var n = parseFloat(req.query.n); 
   var radius = parseFloat(req.query.radius); 
   var seed = parseFloat(req.query.seed); 

   //Coordinates x for latitude and y for longitude
   var x = parseFloat(req.query.center[0]);
   var y = parseFloat(req.query.center[1]);

   //Get Handle
   var handle = addon.getHandle();

   //Run psuedoInstance and get findAttractors
   var psuedoInstance = addon.initWithPseudo(handle, n, seed);

   //Find and Calculate attractors
   addon.CalculateResultsAsync(psuedoInstance, radius, x, y, GID, filter, function(results) {        
           res.end(JSON.stringify(results));
   });


  } else {
   //Set the content type and status code
   res.writeHead(400, {'content-Type': 'application/json'});

    
   res.end(JSON.stringify("n, center[0], center[1] and radius not specified. seed and filtering are optional."));
  }

}
]

//Get size data
exports.sizes = [
  check('radius')
    .isNumeric(),

  check('spotradius')
    .isNumeric()
    .optional(),

 (req, res, next) => { /* the rest of the existing function */ 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  //Radius is manditory, spotradius is optional
  
   //For both the Radius and Spotradius
   if(req.query.radius && req.query.spotradius){
   
    
   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});

       //Parse parameters given in request
       var radius = parseFloat(req.query.radius); 
       var spotRadius = parseFloat(req.query.spotradius);

       var n = addon.getDotsBySpotRadius(spotRadius, radius);
       var spot = addon.getSpotSize(addon.getOptimizedDots(radius), radius);           

       var th = addon.getOptimizedDots(radius); 
       var hexSize = addon.requiredEnthropyHex(th);

       //Create object containing the version information
       var sizeObject = {
        "Type": 'direct',
        "N": n,
        "spot": spot,
        "hexsize": hexSize
       }

       //Convert object to JSON and end response. 
       res.end(JSON.stringify(sizeObject));

   //For Radius only
   } else if (req.query.radius) {

   //Set the content type and status code
   res.writeHead(200, {'content-Type': 'application/json'});


    //Parse parameters given in request
    var radius = parseFloat(req.query.radius); 

    var n = addon.getOptimizedDots(radius);
    var spot = addon.getSpotSize(addon.getOptimizedDots(radius), radius);

    var th = addon.getOptimizedDots(radius); 
    var hexSize = addon.requiredEnthropyHex(th);

    //Create object containing the version information
    var sizeObject = {
        "Type": 'optimized',
        "N": n,
        "spot": spot,
        "hexsize": hexSize
    }

    //Convert object to JSON and end response. 
    res.end(JSON.stringify(sizeObject));

   } else {
   //Set the content type and status code
   res.writeHead(400, {'content-Type': 'application/json'});

   res.end(JSON.stringify("radius was not provided"));
   }
}
]

//Make attractors
exports.makeattractor = function(GID, attractors, gid_valid, centervalid, calc_time, callback) {
  
  //Loop over results and pass it to the Array
  var empDetails = attractors
  var i;

  var myArray = [];
   //Create object containing the version information
  for (i = 0; i < empDetails.length; i++){
  var myObj = {
     GID: GID,
     TID: empDetails[i].TID,
     LID: empDetails[i].LID,
     type: empDetails[i].type,
     x: empDetails[i].x,
     y: empDetails[i].y,
      center: {
        Latlng: {
          point: {
            latitude: empDetails[i].latitude,
            longitude: empDetails[i].longitude

          },
          bearing: {
            distance: empDetails[i].distance,
            initialBearing: empDetails[i].initialBearing,
            finalBearing: empDetails[i].finalBearing,
          },
        },

      },    
     side: empDetails[i].side,
     distanceErr: empDetails[i].distanceErr,
     radiusM: empDetails[i].radiusM,
     n: empDetails[i].n,
     mean: empDetails[i].mean,
     rarity: empDetails[i].rarity,
     power_old: empDetails[i].power_old,
     power: empDetails[i].power,
     z_score: empDetails[i].z_score,
     probability_single: empDetails[i].probability_single,
     integral_score: empDetails[i].integral_score,
     significance: empDetails[i].significance,
     probability: empDetails[i].probability,
     FILTERING_SIGNIFICANCE: empDetails[i].FILTERING_SIGNIFICANCE
   }

   // Save generated point and stats from lib to DB
   console.log("############ START SAVE DB"); // TODO: remove
   reports.saveGeneratedPoints(myArray, calc_time);
   console.log("############ END SAVE DB"); // TODO: remove

   myArray.push({
        "gid_valid": gid_valid,
        "centervalid": centervalid, 
        "calc_time": calc_time, 
        "attractors": myObj
    }); 
  }

  callback(myArray);
}

//End Controller
