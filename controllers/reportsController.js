'use strict';
const { check, validationResult } = require('express-validator');
const path       = require('path');
const crypto     = require('crypto');
const checkAuth  = require(path.join(process.cwd(), "/services/authentication/check-auth.js"));

// Used to save a trip report to the database
exports.saveReport = [
  check('point_id') // point ID generated when libwrapper generates the point
    .not().isEmpty()
    .isHexadecimal(),

  check('intent_set')
    .isBoolean(),

  check('artifact_collected')
    .isBoolean(),

  check('fucking_amazing')
    .isBoolean(),

  check('rating_meaningfulness')
    .isString(),

  check('rating_emotional')
    .isString(),

  check('rating_importance')
    .isString(),

  check('rating_strangeness')
    .isString(),

 (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

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
   }
}
];