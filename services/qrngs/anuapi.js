//ANUapi
const https      = require('https')
const path       = require('path');
const fs         = require('fs');
const addon      = require('../../build/Release/AttractFunctions'); 
const crypto     = require('crypto');
const size_url   = 520;
const length_url = 500;

var data = {}
var pool;

//Used for getting entropy from ANU by Size
exports.getsizeqrng  = function(size, callback){
  if (size == 0){ callback(JSON.stringify(1)); return size}
  else if (size < 286) {callback(JSON.stringify(2)); return size}
  else if (size > 6000000) {callback(JSON.stringify(3)); return size}
  else {
  console.log("Start Entropy Reqeust of size: " + size)

  //One size_url generates 2 hex characters for every number. 
  //1 size_url generates 2 hex characters. 

  //A big query is 260000 Characters (520*500)
  var big_query;

  //A small qeury' length is undetermined, block size is 520.
  var small_query;

  var results = [];

  var size_url = 520;

  //Do sum
  var size_f = (size/2)

  if (size_f-(520*500) < 0){ //Check if there is no big query possible, only a small query
  big_query = 0; //No big query
  var size_f = Math.trunc(size_f/520); //We remove the remainder.
  var size_f = size_f+1; //We add one

  small_query = size_f;

  } else { //Check for big queries

  var big_query = Math.trunc(size_f/(520*500)) //This is the amount of big queries

  var size_f = size_f % (520*500); //We get the remainder
  
  if (size_f == 0) { //Check if remainder is zero

    small_query = size_f; //0 Small queries

  } else {

    var size_f = Math.trunc(size_f/520); //Remainder / 520 and we remove the fraction
    var size_f = size_f+1; //We add one

    small_query = size_f; //This is the amount of small queries
  }


  }

  //We send big_query x amount of times. 
  if (big_query != 0 && small_query == 0){
    var length_url = 500;
    var url = "https://qrng.anu.edu.au/API/jsonI.php?type=hex16&size="+size_url+"&length="+length_url;
  

    callanuBig(size, url, big_query, function(result) {
          callback(result)
    })

  //We only have small queries.
  } else if (small_query != 0 && big_query == 0) {
  var length = small_query;
  var url = "https://qrng.anu.edu.au/API/jsonI.php?type=hex16&size="+size_url+"&length="+length;


    anuSmall(size, length, url, function(result) {
        callback(result)
    });


  } else if (big_query != 0 && small_query != 0){
  var length = small_query;
  var length_url = 500;
  var url = "https://qrng.anu.edu.au/API/jsonI.php?type=hex16&size="+size_url+"&length="+length_url;

  callanumulti(size, url, big_query, length, function(result) {
       callback(result)
  })


  }

  } //End if beginning checks
} //End Function

//Used for calling ANU Quantum Random Numbers Server
function anu(url, length, callback){

  https.get(url, function(res){
    var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });

      res.on('end', function(){

        var object_entropy = undefined; 
        var fbResponse = JSON.parse(body);
        var tmpstring = fbResponse.data

        for (v = 0; v < length; v++){
          if(!object_entropy){
              object_entropy = tmpstring[v]
          } else {
              object_entropy += tmpstring[v]
          }         
        }

        callback(object_entropy)

    });


  }).on('error', function(e){
      console.log("Got an error: ", e);
  });

} //End Function

//Used for querying ANU for small queries
function anuSmall(size, length, url, callback){
  var results_anu = undefined; //This is a large array containing the entropy. 
  
  anu(url, length, function(result) {
    if(results_anu == undefined){
      results_anu = result; 
    } else { 
      results_anu += result; 
    }
        
        var entropyObject = createEntropyObject(results_anu, size)

        console.log(1 + " amounts of small queries done");
        console.log("Total entropy: " + results_anu.length);
        console.log("Added to pool: " + (results_anu.length - size));
        console.log("End Entropy Reqeust of size: " + entropyObject.EntropySize)

        fs.writeFile ('./services/entropy/'+entropyObject.Gid+".hex", JSON.stringify(entropyObject, null, 2), function(err) {
          if (err) throw err;
            callback(entropyObject)
        });
  })
} //End Function

//Used for querying ANU for big queries
function callanuBig(size, url, big_query, callback){
  var results_anu = undefined; //This is a large array containing the entropy. 

  for (i = 0; i < big_query; i++) {

    anu(url, length_url, function(result) {
      if(results_anu == undefined){
        results_anu = result; 
      } else { 
        results_anu += result; 
      }

      if(i == big_query){ 
        
        var entropyObject = createEntropyObject(results_anu, size)

        console.log(big_query + " amounts of big queries done");
        console.log("Total entropy: " + results_anu.length);
        console.log("Added to pool: " + (entropyObject.Entropy.length - size));
        console.log("End Entropy Reqeust of size: " + entropyObject.EntropySize)
        
        fs.writeFile ('./services/entropy/'+entropyObject.Gid+".hex", JSON.stringify(entropyObject, null, 2), function(err) {
          if (err) throw err;
            callback(entropyObject)
        });


      }
    })

  } // End loop
} //End Function

//Used for calling ANU for big and small queries
function callanumulti(size, url, big_query, small_query_length, callback){
  var results_anu = undefined; //This is a large array containing the entropy. 
  var timesRun = 0;

  for (i = 0; i < big_query; i++) {
    anu(url, length_url, function(result) {
        ++timesRun
        if(results_anu == undefined){
          results_anu = result; 
        } else {
          results_anu += result; }

        if(timesRun == big_query){
          var url = "https://qrng.anu.edu.au/API/jsonI.php?type=hex16&size="+size_url+"&length="+small_query_length;
          
          anu(url, small_query_length, function(result){
              results_anu += result;

              var entropyObject = createEntropyObject(results_anu, size)

              console.log(big_query + " amounts of big queries done");
              console.log("Small query of " + small_query_length + " length done");
              console.log("Total entropy: " + results_anu.length);
              console.log("Added to pool: " + (results_anu.length - size));
              console.log("End Entropy Reqeust of size: " + entropyObject.EntropySize)

              fs.writeFile ('./services/entropy/'+entropyObject.Gid+".hex", JSON.stringify(entropyObject, null, 2), function(err) {
                if (err) throw err;
                  callback(entropyObject)
              }); 


          }) //End anu function

        }
    })

  } // End loop
} //End Function

//Used for setting own entropy
exports.saveentropy = function gettoken(entropy, size, gid, timestamp, callback){

        //Create object to store results
        var entropyObject = {
            EntropySize: size,
            Timestamp: timestamp,
            Gid: gid,
            Entropy: entropy
        }

        //Write file to disk by GID
        fs.writeFile ('./services/entropy/'+gid+".hex", JSON.stringify(entropyObject, null, 2), function(err) {
          if (err) throw err;
            console.log('complete');
            callback(entropyObject);
        });      
} //End Function

//Used for getting entropy with GID
exports.getentropy = function gettoken(gid, pool, temporal, gcp, callback){
  
  switch("true"){
    case pool:
        fs.readFile ('./services/entropy/pool/'+gid+".pool", "utf8", function(err, data) {
          if (err){
            callback(JSON.stringify(1));
          } else {
            callback(JSON.parse(data));
          }
        });
        break;
    case temporal:
        fs.readFile ('./services/entropy/temporal/'+gid+".steve", "utf8", function(err, data) {
          if (err){
            callback(JSON.stringify(1));
          } else {
            callback(JSON.parse(data));
          }
        });
        break;
    case gcp:
        fs.readFile ('./services/entropy/gcp/'+gid+".gcp", "utf8", function(err, data) {
          if (err){
            callback(JSON.stringify(1));
          } else {
            callback(JSON.parse(data));
          }
        });
        break;
    default:
      fs.readFile ('./services/entropy/'+gid+".hex", "utf8", function(err, data) {
          if (err){
              callback(JSON.stringify(1));
          } else {
              callback(JSON.parse(data));
          }
        });
  }

} //End Function

//Used for getting all pools available
exports.getpools = function gettoken(callback){

  let files = fs.readdirSync('./services/entropy/pool/');
  let objects = [];

  let counter = 0;
    
    files.forEach(function(file) {
        if (file == '.empty') return;
        var stats = fs.statSync('./services/entropy/pool/'+file);
        let obj = {
                  "pool": 0,
                  "time": 0
              }

        obj.pool = file
        obj.time = stats.mtime;
        objects.push(obj)
    });

    callback(objects)

} //End Function

//Used for getting pool entropy with GID
exports.getpool = function(callback){
  let timestamp = Date.now(); 
  let gid = 0;
  let length_pool = 0;

  if(pool == undefined){
    gid = 0;
    length_pool = 0;
  } else {
    gid = crypto.createHash('sha256').update(pool).digest('hex');
    length_pool = pool.length;
  }

  let poolObject = {
      GidCurrentPool: gid,
      TimestampReqeustPool: timestamp,
      PoolSize: length_pool,
      PoolEntropy: pool
  }
  pool = undefined;
  //Write file to disk by GID
  fs.writeFile ('./services/entropy/pool/'+gid+".pool", JSON.stringify(poolObject, null, 2), function(err) {
    if (err) throw err;
      callback(poolObject);
  });
} //End Function

//Used for getting entropy with GID
writePool = function(callback){

  let timestamp = Date.now(); 
  let gid = crypto.createHash('sha256').update(pool).digest('hex');
  let length_pool = pool.length;

  let poolObject = {
      GID: gid,
      Timestamp: timestamp,
      Size: length_pool,
      Entropy: pool
  }
  pool = undefined;
  //Write file to disk by GID
  fs.writeFile ('./services/entropy/pool/'+gid+".pool", JSON.stringify(poolObject, null, 2), function(err) {
    if (err) throw err;
      return('Written to pool');
    });
} //End Function

//Used to create an entropy object
createEntropyObject = function(object_entropy, size){

  var gid = crypto.createHash('sha256').update(object_entropy).digest('hex');
  var timestamp = Date.now(); 
  var entropy = object_entropy.substring(0,size); 
          
  if(pool == undefined){
    pool = object_entropy.substring(size, object_entropy.length); 
    if(pool.length >= 1000000){
      writePool()
    }
  } else {
    pool += object_entropy.substring(size, object_entropy.length); 
    if(pool.length >= 1000000){
      writePool()
    }           
  }
          
  var entropy_size = entropy.length;

  var entropyObject = {
    EntropySize: entropy_size,
    Timestamp: timestamp,
    Gid: gid,
    Entropy: entropy
  }

  return(entropyObject)
} //End Function

//end ANUapi
