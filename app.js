var express = require('express'),
  	app = express(),
  	port = process.env.PORT || 3000;
  	bodyParser = require('body-parser');
  	errorHandler = require('./helpers/errorHandler');
  	router = require('./routes/Routes');

app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json());

app.use(function(req, res, next) {

  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  // Include cookies in the requests sent for JWT
  res.header('Access-Control-Allow-Credentials', true);

  next();

});

//Set Routes
app.use('/', router);

//Set error handler
app.use(errorHandler);

app.listen(port);

console.log('RESTful API server started on: ' + port);
