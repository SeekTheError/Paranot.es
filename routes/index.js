/*
 * GET home page.
 */

exports.index = function(req, res) {
	res.render('index');
};

/*
 * Init redis
 */
var redis = require("redis"),
	client = redis.createClient();

client.on("error", function(err) {
	console.error("Error " + err);
});

/*
 * Check if the credentials are set and not null, 
 *return true if everything is okay
 * else respond to the client directly
 */

function credentialsSet(params, res) {
	if(params.login == "" || params.key == "") {
		res.send({
			status: "invalidCredentials"
		});
		return false;
	}
	return true;
}

/*
* Check
*/
function pathSet(params,res){
	if(params.path == "" ) {
		res.send({
			status: "invalidFileName"
		});
		return false;
	}
	return true;
}

/*
 * return the UserNameSpace, whitch is basically the user account key on redis
 */

function getUserNameSpace(params) {
	return "user:" + params.login;
}
/*
 * return the contentPath, witch is the redis key to a specific note
 */

function getContentPath(params) {
	return "user:" + params.login + ":" + params.path;
}

exports.deleteFile = function(req, res) {
	var params = req.body;
	if(!credentialsSet(params, res)) {
		return;
	}

	if(!pathSet(params)) {
		return;
	}

	client.get(getUserNameSpace(params), function(err, reply) {
		if(!reply) {
			res.send({
				status: "userDontExist"
			});
		} else {
			if(reply != params.key) {
				res.send({
					status: "invalidCredentials"
				});
				return;
			}
			client.get(getContentPath(params), function(err, reply) {
				if(reply) {
					client.del(getContentPath(params), function(err, reply) {
						if(reply) {
							res.send({
								status: "fileDeleted"
							});
							io.sockets.in(getUserNameSpace(params)).emit('fileDeleted');
						} else {
							res.send({
								status: "error",
								message: "Could not delete the file"
							});
						}
					});
				} else {
					res.send({
						status: "deleteFileDontExist"
					});
				}
			});
		}
	})
};


/*
* Return userExist and the file that the user have
*/
exports.checkUser = function(req, res) {
	var params = req.body;
	if(!credentialsSet(params, res)) {
		return;
	}
	client.get(getUserNameSpace(params), function(err, reply) {
		if(!reply) {
			res.send({
				status: "userDontExist"
			});
		} else {
			if(reply == params.key) {
				pathsNamespace = getUserNameSpace(params) + ":*"
				client.keys(pathsNamespace, function(err, reply) {
					var paths = reply;
					for(var i = paths.length - 1; i >= 0; i--) {
						paths[i] = paths[i].substring(pathsNamespace.length - 1)
					};
					res.send({
						status: "userExist",
						paths: paths
					});
				});
			} else {
				res.send({
					status: "invalidCredentials"
				});
			}
		}
	})
};


/**
 * Create a user and a new empty file for a user
 */
exports.createUser = function(req, res) {
	var params = req.body;
	//checking user existence
	if(!credentialsSet(params, res)) {
		return;
	}
	client.get(getUserNameSpace(params), function(err, reply) {
		if(!reply) {
			client.set(getUserNameSpace(params), params.key, function(err, reply) {
				//create a doc for a new user
				var homeNameSpace = getUserNameSpace(params) + ":Home";
				console.log("creating home: " + homeNameSpace);
				// x as a value because it won't be allocated if empty
				client.set(homeNameSpace, "x", function(err, reply) {
					console.log("home creation response: " + reply)
					res.send({
						status: "userCreated",
					});
				});
			})
		} else {
			res.send({
				status: "error",
				message: "trying to create a user that already exist"
			});
		}
	});
};