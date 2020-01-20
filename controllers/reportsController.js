'use strict';
const { check, validationResult } = require('express-validator');
const path        = require('path');
const checkAuth   = require(path.join(process.cwd(), "/services/authentication/check-auth.js"));
const reports     = require(path.join(process.cwd(), '/services/reports/save'));

// Used to save a trip report to the database
exports.saveReport = [
  check('point_id') // point ID generated when libwrapper generates the point
    .isString(),

  // check('user_id')
  //   .not().isEmpty()
  //   .isString(),

  // check('platform')
  //   .not().isEmpty()
  //   .isNumeric(),

  // check('intent_set')
  //   .not().isEmpty()
  //   .isBoolean(),

  // check('artifact_collected')
  //   .isBoolean(),

  // check('fucking_amazing')
  //   .isBoolean(),

  // check('rating_meaningfulness')
  //   .isString(),

  // check('rating_emotional')
  //   .isString(),

  // check('rating_importance')
  //   .isString(),

  // check('rating_strangeness')
  //   .isString(),
  
  // check('rating_synchroncity')
  //   .isString(),

 (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    res.writeHead(200, {'content-type': 'application/json'});

    reports.saveReport(req);

    res.write(JSON.stringify({status: 'OK'}));
    res.end();
  }
];