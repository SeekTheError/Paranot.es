/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'); 

var app = express();

port=process.argv[2];

app.configure(function() {
  app.set('port', port || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/save', routes.save);
app.post('/createUser', routes.createUser);
app.post('/checkUser', routes.checkUser);
app.post('/createFile', routes.createFile);
app.post('/deleteFile', routes.deleteFile);
app.post('/load', routes.load);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});


