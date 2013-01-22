var UI = function(pn) {
		var ui = this;
		var pn = pn;

		//CONSTANTS
		ui.SAVING = 0;
		ui.SAVED = 1;

		var Store = {}

		ui.hideInput = function() {
			$("#input").hide();
		}

		ui.setSaveStatus = function(status) {
			if(status == ui.SAVING) {
				$("#saveStatus").html("Saving...");
				return;
			}
			if(status == ui.SAVED) {
				$("#saveStatus").html("Saved");
				return;
			}
		}

		ui.clearFileName = function() {
			$("#newFileName").html("")
		}
		ui.focusOnNewFileName = function() {
			$("#newFileName").html("").focus()
		}

		ui.hideCommands = function() {
			$(".command").hide();
		}



		/*
		 *load or reload the tabs, and load
		 */

		this.initUserInterface = function(tabs){
			console.log("init User Interface", tabs)
			$("#inputs-navs").html("");
			$(".command").show();
			$("#pass").hide();
			$("#login").hide()
			$("#connect").hide();
			$("#userName").html($("#login").val());
			$('#userName').show();
			$("#logout").show();
			var nav;
			var tab;
			var empty = true;
			for(var i = 0; i < tabs.length; i++) {
				var nav = $('<li>').html('<a class="file" href="#" data-toggle="tab">' + decodeURIComponent(tabs[i]) + '</a>')
				//if next path has been set on the createFile function
				if(pn.nextPath == decodeURIComponent(tabs[i])) {
					$(nav).addClass("active");
					empty = false;
				}
				$("#inputs-navs").append(nav);
			};
			//Autoload 
			if(!empty) {
				pn.load();
			}
		}

		$("#connect").click(function(event) {
			event.preventDefault();
			pn.loadUserDatas();
			return false;
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

		//trigger the user verification when the enter key is pressed
		$("#pass").keypress(function(event) {
			if(!(event.which == 13)) {
				return true;
			} else {
				event.preventDefault();
				pn.loadUserDatas();
				return false;
			}
		});

		// there is no cookie and no form, so reloading the page will log out
		$("#logout").click(function() {
			window.location = ""
		});

		//Reload the current file
		$("#refresh").click(function(event) {
			event.preventDefault();
			document.getElementById("input").innerHTML = "";
			Store.nextPath = $("#input").data("path");
			pn.loadUserDatas();
			return false;
		})

		/**
		 *Load a file when the user click on a tab
		 *The file to load is determined via the active element bootstrap put on tabs
		 */
		$("#inputs-navs li a.file").live('click', function(event) {
			event.preventDefault();
			pn.load();
			return false;
		})
		/**
		 *
		 */
		$('#deleteFile').live("click", function(event) {
			event.preventDefault();
			var fileName = $("#input").data('path');
			if(!fileName) {
				window.alert("Please select the file that you want to delete first");
				return;
			}
			var toDelete = window.confirm("Are you sure that you want to delete the file " + decodeURIComponent(fileName));
			if(toDelete) {
				pn.deleteFile();
			}
			return false;
		});


		/*
		 * variable to prevent data loss when changing file
		 */

		$("#input").focusout(function(event) {
			event.preventDefault();
			if(Store.inputSync) {
				pn.save();
			}
		});

		/**
		 * Save button for tactile interfaces
		 */
		$('#save').click(function(event) {
			event.preventDefault();
			console.log("SAVE");
			if(Store.inputSync) {
				pn.save();
				Store.inputSync = false;
			}
			return false;
		});

		/**
		 * Auto save when the content is modified
		 */

		//the time the user has to stop typing for the saved to be performed
		var TIME_OUT_VALUE = 300;
		//the saveStatus var is used in the state machine
		Store.currentState = "DONE_TYPING";
		$("#input").keyup(function(e) {
			Store.inputContent = $("#input").val();
			if(Store.currentState == "DONE_TYPING") {
				ui.setSaveStatus(ui.SAVING)
				Store.currentState = "IS_TYPING";
			};
			if(Store.currentState == "IS_TYPING") {
				//this variable will show weither the content has been modified after the call to
				//setTimeout. If not it will be saved. Without this, every keyUp event will trigger a save
				var lastInputContent = $("#input").html();
				setTimeout(function() {
					var inputContent = $("#input").html();
					if(inputContent && inputContent == lastInputContent && Store.currentState != "DONE_TYPING") {
						Store.currentState = "DONE_TYPING";
						pn.save();

					} else {
						return;
					}
				}, TIME_OUT_VALUE);
			}
		});


		/*
		 *handle ctrl+s to save the #input
		 */
		$("#input").live('keypress', function(event) {
			if(!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) {
				return true;
			} else {
				pn.save();
				event.preventDefault();
				return false;
			}
		});

		/*
		 * Create a file when enter is pressed
		 */
		$("#newFileName").live('keypress', function(event) {
			if(!(event.which == 13)) {
				return true;
			} else {
				pn.createFile($('#newFileName').html());
				event.preventDefault();
				return false;
			}
		});
		/*
		 * Either create a new file if the #newFileName has been modified by the user,
		 * or set the focus on the #newFile
		 */
		$("#addNewFile").click(function(event) {
			event.preventDefault();
			var fileName=$('#newFileName').val()
			if(!fileName) {
				ui.focusOnNewFileName();
			} else {
				pn.createFile(fileName);
				ui.clearFileName();
			}
			return false;
		});


		return ui;
		}