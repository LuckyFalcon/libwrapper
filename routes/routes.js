'use strict';
const express = require('express');
const controller = require('../controllers/libAttractController');
const InstructionsController = require('../controllers/InstructionsController');
const reportController = require('../controllers/reportsController'); 
const visualController = require('../controllers/visualController'); 
const userController = require('../controllers/user-controller');
const jwt = require('../helpers/jwt');
const router = express.Router();

//const roles = require('../helpers/roles');
//Roles -----> TODO: This should be moved externally and not be put here. It doesn't seem to pick it up from export!
const roles = {
  User: "user",
  Admin: "admin"
};
	
	
//GET for getting random point #TODO!
router.get('/getpointattractor', 
	//jwt([roles.User, roles.Admin]), --> Uncomment to enable Authentication
	controller.getPointAttractor);	
	
/* Authentication Routes  */

//POST route for user authentication
router.post('/authenticate', userController.authenticate);

//POST route for user registration
router.post('/register', userController.register);

//GET route for getting all users registered
router.get('/allusers', jwt(roles.Admin), userController.getAll);

/* Attractor Generation Routes  */

//GET route for version
router.get('/version', jwt(roles.Admin), controller.list_version);

//GET route for sizes
router.get('/sizes', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	controller.sizes);

//GET for the running the pseudo instance
router.get('/pseudo', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	controller.psuedo);

//POST for the setting own entropy
router.post('/setentropy', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication 
	controller.setentropy);

//GET for getting entropy
router.get('/entropy', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	controller.entropy);

//GET for getting pool
router.get('/pool', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	controller.getPool);

//GET for getting pools
router.get('/getpools', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	controller.getpools);

//GET for getting attractors
router.get('/attractors', 
	//jwt([roles.User, roles.Admin]), --> Uncomment to enable Authentication
	controller.attractors);

//GET for getting random point
router.get('/getpoint', controller.getPoint);

// POST for sending a trip report
router.post('/reports/save', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	reportController.saveReport);

// GET for viewing entropy
router.get('/visualizeentropy', 
	//jwt([roles.User, roles.Admin]),  --> Uncomment to enable Authentication
	visualController.visualizeEntropy);


/* Route Generation Routes  */

//GET for getting instructions from Mapbox
router.get('/directions/instructions/:option/:from1,:from2;:to1,:to2', jwt(roles.Admin), InstructionsController.getRouteInstructions);

//GET for getting instructions route locally (WIP)
router.get('/local/directions/instructions/:from1,:from2;:to1,:to2', jwt(roles.Admin), InstructionsController.getRouteInstructionsLocal);

//GET for getting attractors navigation in mapbox locally (WIP)
router.get('/directions/v5/mapbox/:profile/:from1,:from2;:to1,:to2', jwt(roles.Admin), InstructionsController.getRouteNavigationsLocal);


// GET for getting list of reports
// TODO: Do we need this?
//app.route('/reports/list')
//.get(reportController.getReports)

module.exports = router;