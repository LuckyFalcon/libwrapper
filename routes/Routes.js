'use strict';
const controller = require('../controllers/Controller');
 
module.exports = function(app) {
 
  //GET route for version
  app.route('/Version')
  	.get(controller.list_version);
  
  //GET route for sizes
  app.route('/sizes')
    .get(controller.sizes);

  //GET for the running the pseudo instance
  app.route('/pseudo')
    .get(controller.psuedo);

  //POST for the setting own entropy
  app.route('/setentropy')
    .post(controller.setentropy);

  //GET for getting entropy
  app.route('/entropy')
    .get(controller.entropy);

  //GET for getting pool
  app.route('/pool')
    .get(controller.getPool);

  //GET for getting pools
  app.route('/getpools')
    .get(controller.getpools);

  //GET for getting attractors
  app.route('/attractors')
    .get(controller.attractors);

};

  