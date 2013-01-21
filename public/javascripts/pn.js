/**
* login : the user login
  pass : the user pass, used for aes encryption
  path : the path of the file
  key : the sha1 of login+pass, used as an index in the local store
*/
PN = function() {

	if(!$ || !CryptoJS || !Socket) {
		console.error("Missing Dependencies");
	}


	var pn = this;

	// a way to scope some variables at the pn object level;
	var Store = {};

	/* this variable is used for two purpose:
	 *	on file Creation to autodisplay the new file
	 *	on reload to display the reloaded file
	 */
	pn.nextPath = null;

	this.isInitialized = false;

	var ui;
	(function(pn) {
		ui = new UI(pn);
		loadExtensions(pn);
		pn.isInitialized = true;
		console.log("pn is ready");
	})(this);


	/*
	 * Load a file
	 * exposed
	 * path: an optional path (not used internally)
	 */

	this.load = function(path) {
		ui.hideInput();
		var login = $("#login").val();
		var pass = $("#pass").val();
		//The path if a tab is "clicked"
		if(!path) {
			var path = encodeURIComponent($("#inputs-navs li.active a.file").html());
		}
		if(typeof path == "undefined") {
			console.log("aborting, cause: nothing path to load")
		}
		var key = CryptoJS.SHA1(login + pass).toString();
		var url = "load";
		console.log(path)
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
		}
		Socket.emit("loadFile", data);
	}

	/*
	 * Method to save the current note on the server
	 * exposed
	 */
	this.save = function() {
		var input = document.getElementById('input').innerHTML;
		var login = $("#login").val();
		var pass = $("#pass").val();
		var path = $("#input").data('path');
		console.log("saving:", path);
		//TODO check if this bug is gone!!!
		if(!path) {
			throw "The save path is not defined"
			console.log("abort, cause: no path");
			return;
		}
		var content = CryptoJS.AES.encrypt(input, pass).toString();
		var key = CryptoJS.SHA1(login + pass).toString();

		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
			content: content
		}
		ui.setSaveStatus(ui.SAVING);
		Socket.emit('saveFile', data);
	}

	this.createFile = function(path) {
		//setting the path to display
		pn.nextPath = encodeURIComponent(path);
		console.log("creating new file: " + path);
		ui.clearFileName()
		var login = $("#login").val();
		var pass = $("#pass").val();
		var key = CryptoJS.SHA1(login + pass).toString();
		var content = "x";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: encodeURIComponent(path),
			content: "x",
			newFile: true
		}
		Socket.emit("saveFile", data);

	}


	this.deleteFile = function() {
		$("#input").html("");
		var login = $("#login").val();
		var pass = $("#pass").val();
		var path = $("#input").data('path');
		console.log("deleting file: " + path);
		var key = CryptoJS.SHA1(login + pass).toString();

		var url = "/deleteFile";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
		}
		$("#input").data('path', null);
		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatchAjaxResponses(data);
		});
	}

	/*
	 * This method is called upon user connection attempt
	 */
	this.loadUserDatas = function() {
		console.log("checking user");
		var login = $("#login").val();
		var pass = $("#pass").val();
		if(login == "" || pass == "") {
			console.log("abort")
			window.alert("Please enter a login and a password");
			return false;
		}
		$("#input").hide();
		var key = CryptoJS.SHA1(login + pass).toString();

		var url = "/checkUser";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key)
		}

		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatchAjaxResponses(data);
		})
	}

	this.createUser = function() {
		console.log("creating user");
		var login = $("#login").val();
		var pass = $("#pass").val();
		var key = CryptoJS.SHA1(login + pass).toString();
		var url = "/createUser";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key)
		}
		console.log("creating user: " + url)
		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatchAjaxResponses(data);
		})
	}
	/*
	 * Decrypt and display a note
	 */

	this.displayContent = function(response) {
		if(response) {
			$("#input").show();
			$("#input").attr('contenteditable', 'true');
			//console.log("displaying", response)
			console.log("displaying: " + response.path);
			var source = response.content
			var pass = $("#pass").val();
			var raw = CryptoJS.AES.decrypt(source, pass);
			var result = CryptoJS.enc.Utf8.stringify(raw);
			var input = document.getElementById('input');
			input.innerHTML = result.toString();
			// init the autosave function for the new note
			Store.lastSavedInput = result.toString();
			$("#input").data('path', response.path);
			pn.currentPath = response.path;
			console.log("Loaded");
			//this prevent a reload when the .focus method is called
			Store.inputSync = true;
			$("#input").focus();
		}
	}


	/*
	 *Route Event originated from a server response
	 */

	function dispatchAjaxResponses(response) {
		if(response.status == "userCreated") {
			console.log("userCreated");
			pn.loadUserDatas();
			return;
		}
		if(response.status == "userExist") {
			console.log("User Exist");
			ui.initUserInterface(response.paths);
			return;
		}
		if(response.status == "userDontExist") {
			var create = confirm("This account does not exist, do you want to create it?");
			if(create) {
				pn.createUser();
			}
			return;
		}

		if(response.status == "invalidCredentials") {
			$(".command").hide();
			window.alert("Invalid Password");
			return;
		}

		if(response.status == "fileDeleted") {
			$("#input").data('path', null);
			pn.loadUserDatas();
			return;
		}
		if(response.status == "error") {
			console.error(response.message);
			return;
		}
	}

	Socket.on("fileLoaded", function(data) {
		pn.displayContent(data);
	});

	Socket.on("userCreated", function() {
		console.log("userCreated");
		pn.loadUserDatas();
	});

	Socket.on("fileCreated", function() {
		console.log("File successfully created");
		pn.loadUserDatas();
	});
	Socket.on("fileAlreadyExist", function() {
		window.alert("This File name is already taken");
	});

	Socket.on("fileDontExist", function(data) {
		console.log("file don't exist");
	});

	Socket.on("invalidCredentials", function() {
		ui.hideCommands();
		window.alert("Invalid Password");
	});
	Socket.on("invalidFileName", function() {
		window.alert("Invalid FileName");
		ui.clearFileName();
	});
	Socket.on("fileDeleted", function() {
		pn.loadUserDatas();
	});

	Socket.on("error", function() {
		console.error(data.message);
	});

	Socket.on("fileSaved", function(data) {
		ui.setSaveStatus(ui.SAVED)
		console.info("saved");
	});
	Socket.on("invalidFileName", function(data) {
		window.alert("Invalid FileName");
		ui.clearFileName();
		ui.focusOnNewFileName();
	});
	Socket.on("fileUpdated", function(data) {
		console.log("file updated");
		pn.load();
	});
}


function loadExtensions(pn) {
	console.log("Loading pn extensions");
	//allow to click links on the content editable
	(function() {
		$('#input a').live('click', function(event) {
			if(!pn.isInitialized) return;
			event.preventDefault();
			var url = $(event.target).attr("href");
			window.open(url, '_blank');
			window.focus();
		})
		$('#input a').live('hover', function() {
			$('#input').attr("contenteditable", false)
		}, function() {
			if(!pn.isInitialized) return;
			$('#input').attr("contenteditable", true)
		});
	})();

}