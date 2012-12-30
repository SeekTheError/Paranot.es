var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");
s = encrypted.toString()
//console.log(s);
var decrypted = CryptoJS.AES.decrypt(s, "Secret Passphrase");
r = CryptoJS.enc.Utf8.stringify(decrypted);
//console.log(r);
/**
* login : the user login
  pass : the user pass, used for aes encryption
  path : the path of the file
  key : the sha1 of login+pass, used as an index in the local store
*/
var pn = function($, CryptoJS) {
		if(!$ || !CryptoJS) {
			console.error("Missing Dependencies");
		}
		/* this variable is used for two purpose:
		 *	on file Creation to autodisplay the new file
		 *	on reload to display the reloaded file
		 */
		this.nextPath = null;


		/*
		 * Event originated from the user interface
		 */
		this.init = function() {
			$("#connect").click(function() {
				checkUser();
			});
			$("#login").keypress(function(event) {
				if(!(event.which == 13)) {
					return true;
				} else {
					$("#pass").focus();
					event.preventDefault();
					return false;
				}
			});

			$("#logout").click(function() {
				window.location = ""
			});
			$("#refresh").click(function(event) {
				event.preventDefault();
				document.getElementById("input").innerHTML = "";
				nextPath = $("#input").data("path");
				checkUser();
				return false;
			})
			/**
			 *Load a file when the user click on a tab
			 */
			$("#inputs-navs li a.file").live('click', function(event) {
				event.preventDefault();
				load();
				return false;
			})
			/**
			 *
			 */
			$('#deleteFile').live("click", function() {
				event.preventDefault();
				var fileName = $("#input").data('path');
				if(!fileName) {
					window.alert("Please select the file that you want to delete first");
					return;
				}
				var toDelete = window.confirm("Are you sure that you want to delete the file " + decodeURIComponent(fileName));
				if(toDelete) {
					deleteFile();
				}
				return false;
			});

			$("#pass").change(function() {
				checkUser()
			});

			/*
			 * variable to prevent data loss
			 * autosave when the input area lose focus ( before changing doc, Signout,switching tab,etc)
			 */
			this.toSave = false;
			$("#input").focusout(function(event) {
				if(toSave) {
					save();
					toSave = false ;
				}
			});
			/*
			 *reload in case there was some modification from another browser on the same account
			 */
			$("#input").focusin(function(event) {
				if(!toSave) {
					toSave = true;
					//load();
				}
			});

			/**
			 * empty the new file box on click
			 */
			$('#newFileName').click( function(event) {
				event.preventDefault();
				$('#newFileName').html("");
				$('#newFileName').focus();
				return false;
			});
			/**
			* Save button for tactile interfaces
			*/
			$('#save').click(function(){
				console.log("SAVE");
				if(toSave) {
					save();
					toSave = false;
				}
			})

			/*
			 * Create a file when enter is pressed
			 */
			$("#newFileName").live('keypress', function(event) {
				//console.log(event);
				if(!(event.which == 13)) {
					return true;
				} else {
					createFile($('#newFileName').html());
					event.preventDefault();
					return false;
				}
			});
			/*
			 * Either create a new file if the #newFileName has been modified by the user,
			 * or set the focus on the #newFile
			 */
			$("#addNewFile").click( function(event) {
				event.preventDefault();
				if($('#newFileName i').length > 0) {
					$('#newFileName').html("");
					$('#newFileName').focus();
				} else {
					createFile($('#newFileName').html());
				}
				return false;
			})

			/*
			 *handle ctrl+s to save the # input
			 */
			$("#input").live('keypress', function(event) {
				//console.log(event);
				if(!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) {
					return true;
				} else {
					save();
					event.preventDefault();
					return false;
				}
			});
		}
		/*
		 * Load a file
		 */

		function load() {
			$("#input").hide();
			var login = $("#login").val();
			var pass = $("#pass").val();
			//The path if a tab is "clicked"
			var path = encodeURIComponent($("#inputs-navs li.active a.file").html());

			if(typeof path == "undefined") {
				console.log("aborting, cause: nothing to load")
			}
			var key = CryptoJS.SHA1(login + pass).toString();
			var url = "load";
			console.log(path)
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: path,
			}
			console.log("loading on" + url)
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})
		}


		/*
		 * Method to save the note on the current path on the server
		 */

		function save() {
			var input = document.getElementById('input').innerHTML;
			var login = $("#login").val();
			var pass = $("#pass").val();
			var path = $("#input").data('path');
			console.log("saving:", path);
			//TODO check if this bug is gone!!!
			if(!path) {
				console.log("abort, cause: no path");
				return;
			}

			//prevent useless save on the welcome page
			if(login == "" || pass == "") {
				console.log("abort")
				return false;
			}
			var content = CryptoJS.AES.encrypt(input, pass).toString();
			var key = CryptoJS.SHA1(login + pass).toString();

			var url = "/save";
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: path,
				content: content
			}
			console.log("saving on" + url)
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}

		function createFile(path) {
			//setting the path to display
			this.nextPath = encodeURIComponent(path);
			console.log("creating new file: " + path);
			$("#newFileName").html("<i>New Note</i>")
			var input = $("#input").html();
			var login = $("#login").val();
			var pass = $("#pass").val();
			var key = CryptoJS.SHA1(login + pass).toString();

			var url = "/createFile";
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: encodeURIComponent(path),
			}
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}


		function deleteFile() {
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
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}


		/*
		 * This method is called on user connection attempt
		 */

		function checkUser() {
			console.log("checking user");
			var login = $("#login").val();
			var pass = $("#pass").val();
			if(login == "" || pass == "") {
				console.log("abort")
				window.alert("Please enter a login and a password");
				return false;
			}
			$("#input").hide();

			//prevent useless save on the welcome page
			var key = CryptoJS.SHA1(login + pass).toString();

			var url = "/checkUser";
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key)
			}
			console.log("checkin user: " + login)
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})
		}

		function createUser() {
			console.log("creating user");
			var login = $("#login").val();
			var pass = $("#pass").val();
			//prevent useless save on the welcome page
			if(login == "" || pass == "") {
				console.log("abort")
				return false;
			}
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
				dispatch(data);
			})
		}
		/*
		 *
		 */
		function displayContent(response) {
			if(response) {
				$("#input").show();
				$("#input").attr('contenteditable', 'true');
				console.log("displaying", response)
				console.log("displaying: " + response.path);
				var source = response.content
				var pass = $("#pass").val();
				var raw = CryptoJS.AES.decrypt(source, pass);
				$("#input").show();
				var result = CryptoJS.enc.Utf8.stringify(raw);
				var input = document.getElementById('input');
				input.innerHTML = result.toString();
				$("#input").data('path', response.path);
				//toSave=false;
				console.log("Loaded");
				$("#input").focus()
			}
		}

		/*
		 *load or reload the tabs
		 */
		function initUserInterface(tabs) {
			console.log("init User Interface", tabs)
			$("#inputs-navs").html("");
			$(".command").show();
			$("#pass").hide();
			$("#login").attr("disabled", true)
			$("#connect").hide();
			$("#logout").show();
			var nav;
			var tab;
			var empty = true;
			for(var i = 0; i < tabs.length; i++) {
				var nav = $('<li>').html('<a class="file" href="#" data-toggle="tab">' + decodeURIComponent(tabs[i]) + '</a>')
				//if next path has been set on the createFile function
				if(nextPath == decodeURIComponent(tabs[i])) {
					$(nav).addClass("active");
					empty = false;
				}
				$("#inputs-navs").append(nav);
			};
			//Autoload 
			if(!empty && this.nextPath) {
				var path = this.nextPath;
				this.nextPath = null;
				load();
			}
		}

		/*
		 *Event originated from a server response
		 */
		function dispatch(response) {
			console.log("dispatcher: ", response);
			if(response.status == "userCreated") {
				console.log("userCreated");
				checkUser();
			}

			if(response.status == "userExist") {
				console.log("User Exist");
				initUserInterface(response.paths);
			}
			if(response.status == "userDontExist") {
				var create = confirm("This account does not exist, do you want to create it?");
				if(create) {
					createUser();
				}
			}
			if(response.status == "fileCreated") {
				console.log("File successfully created");
				checkUser();
			}
			if(response.status == "fileAlreadyExist") {
				window.alert("This File name is already taken");
			}

			if(response.status == "fileDontExist") {
				console.log(response);
			}
			if(response.status == "fileLoaded") {
				displayContent(response);
			}
			if(response.status == "invalidCredentials") {
				$(".command").hide();
				$("#inputs-navs").html("");
				window.alert("Invalid Password");
			}
			if(response.status == "invalidFileName") {
				window.alert("Invalid FileName");
				$('#newFileName').html('<i>New Note</i>');
			}
			if(response.status == "fileDeleted") {
				$("#input").data('path', null);
				checkUser();
			}
		}

		return this;

	}(jQuery, CryptoJS)
