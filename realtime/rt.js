console.log("loadding socketio");

io.sockets.on('connection', function(socket) {
	socket.emit('connected', {
		status: 'connected'
	});

	socket.on('saveFile', function(data) {
		console.log("saveFile", data);


		if(!credentialsSet(data)) {
			socket.emit("invalidCredentials");
		}
		if(!pathSet(data)) {
			socket.emit("invalidFileName");
		}

		client.get(getUserNameSpace(data), function(err, reply) {
			if(!reply) {
				socket.emit("userDontExist");
			} else {
				if(reply != data.key) {
					socket.emit("refused");
				} else {
					client.set(getContentPath(data), data.content, function(err, reply) {
						if(reply) {
							var status = data.newFile ? "fileCreated" : "fileSaved";
							socket.emit(status)
						} else {
							socket.emit({
								status: "error",
								message: "troube while saving"
							});
						}
					});
				}
			}
		})
	});

	socket.on("loadFile", function(data) {
		if(!credentialsSet(data)) {
			socket.emit("invalidCredentials");
		}
		if(!pathSet(data)) {
			socket.emit("invalidFileName");
		}
		client.get(getUserNameSpace(data), function(err, reply) {
			if(!reply) {
				socket.emit("userDontExist");
			} else {
				if(reply != data.key) {
					socket.emit("invalidCredentials");
				} else {
					client.get(getContentPath(data), function(err, reply) {
						if(reply) {
							socket.emit("fileLoaded", 
							{
								content: reply,
								path: data.path
							}
							);
						} else {
							socket.emit("fileDontExist");
						}
					})
				}
			}
		})
	});


});

//helper functions

function credentialsSet(params) {
	if(params.login == "" || params.key == "") {
		return false;
	}
	return true;
}

function pathSet(params, res) {
	if(params.path == "") {
		return false;
	}
	return true;
}

function getUserNameSpace(params) {
	return "user:" + params.login;
}
/*
 * return the contentPath, witch is the redis key to a specific note
 */

function getContentPath(params) {
	return "user:" + params.login + ":" + params.path;
}