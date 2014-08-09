'use strict';

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');

var app = express();
var redis = require('redis');
var client = redis.createClient();

var port = process.env.PORT;

app.set('port', port || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.logger('short'));
app.use(express.bodyParser());
app.use(app.router);

if (app.env === 'development') {
  app.use(express.errorHandler()); 
}

app.get('/', routes.index);
app.post('/createUser', routes.createUser);
app.post('/checkUser', routes.checkUser);
app.post('/deleteFile', routes.deleteFile);

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Paranot.es server listening on port ' + app.get('port'));
});

var io = socketio.listen(server);

routes.init(io);

var redisPort = 6379;
var redisHost = 'localhost';

var RedisStore = require('socket.io-redis');
var pub = redis.createClient(redisPort, redisHost);
var sub = redis.createClient(redisPort, redisHost);
var store = redis.createClient(redisPort, redisHost);

//global redis client
client = redis.createClient(redisPort, redisHost);

//no auth for now;
/*pub.auth(password, function (err) { if (err) throw err; });
sub.auth(password, function (err) { if (err) throw err; });
client.auth(password, function (err) { if (err) throw err; });*/
  io.set('store', new RedisStore({
    redisPub: pub,
    redisSub: sub,
    redisClient: store
  }));
/**io.configure(function() {
  io.enable('browser client minification'); // send minified client
  io.enable('browser client etag'); // apply etag caching logic based on version number
  io.enable('browser client gzip'); // gzip the file
  io.set('log level', 1); // reduce logging
  io.set('transports', [ // enable all transports (optional if you want flashsocket)
  'websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
  var RedisStore = require('socket.io/lib/stores/redis');

});*/

// enable socket io
var realtime = require('./realtime/rt.js');
realtime(io, client);
