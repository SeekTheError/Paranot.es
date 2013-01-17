/* The Text processor handle the read-write operation on the #input area
 It also implete a binary state machine that prevent Write and Read operation to be parallelized */



var TEXTPROCESSOR = function() {

		TextProcessor = this;

		TextProcessor.cursor = null;

		TextProcessor.getInput = function() {
			if(setState(READING)) {
				var result = performOnInput();
				if(typeof result !== "string") {
					throw new Error("TextProcessorError", "function get Input must return Text of type string, check the Input proccessors chain");
				}
				return result;
				setState(READY);
			}
		}

		TextProcessor.setOutput = function(rawOutput) {
			if(!setState(WRITING)) {
				queu.addToQueu(rawOutput);
				return;
			} else {
				performOnOutput(rawOutput);
				if(typeof rawOutput !== "string") {
					throw new Error("TextProcessorError", "function set Output must get Text of type string as param");
				};
			}
		}


		var onReadFunctions = [

		function getContentAndPreventError() {
			//handle the case where there is no div at the beggining(after full removal of the text eg)
			var html = document.getElementById("input").innerHTML;
			looseStart = html.split("<")[0]
			if(looseStart != "") {
				var restoredId = "";
				//restore the cursor to prevent desync
				if(TextProcessor.cursor && pn.currentPath == TextProcessor.cursor.path) {
					var restoredID = TextProcessor.cursor.id;
					var newHtml = "<div id='" + restoredID + "' >" + looseStart + "</div>"
					document.getElementById("input").innerHTML = html.replace(looseStart, newHtml);
				}
			}
			//return the content split by divs
			content = $("#input > div");
			return content;
		}, function AffectUUIDS(divs) {
			var out = [];
			var missingIds = 0;
			var id = ""
			//in my version of webkit, the id of the div in the content editable was duplicated
			//so I avoid duplicate that way
			var previousUUIDS = [];
			TextProcessor.previousJs = {};
			for(var i = 0; i < divs.length; i++) {
				id = divs[i].id

				if(id == "" || id == "undefined" || $.inArray(id, previousUUIDS) != -1) {
					divs[i].id = pn.ExposedStore.UUIDS.pop();
				}
				previousUUIDS.push(divs[i].id);
				TextProcessor.previousJs[divs[i].id] = divs[i].innerHTML;
			};
			return divs;
		}, function convertToJson(divs) {
			var tmp = {};
			for(var i = 0; i < divs.length; i++) {
				tmp[i] = {
					index: i,
					id: divs[i].id,
					content: divs[i].innerHTML
				}
			};
			return JSON.stringify(tmp);
		}]


		var onWriteFunctions = [
		//TODO -> refactor this mess

		function loadOrUpdate(content) {
			var js = null;
			try {
				js = JSON.parse(content);
			} catch(error) {
				//compatibility mode with existing notes  
				return $("#input").html(content);
			}
			//display the content in a regular way;
			if(!pn.ExposedStore.modeReload) {
				TextProcessor.previousJs = {};
				var html = "";
				for(var i in js) {
					if(i == 0) {
						//save the cursor, so that it don't get deleted
						TextProcessor.cursor = {
							path: pn.currentPath,
							id: js[i].id
						}
					}
					html += '<div id="' + js[i].id + '">' + js[i].content + '</div>';
					//map the existing contents to their id for merge purpose
					TextProcessor.previousJs[js[i].id] = js[i].content;
				};
				console.log(js);
				document.getElementById("input").innerHTML = html;
			}
			//update the modified divs
			else {
				pn.ExposedStore.modeReload = false;
				console.log("reloading");
				var toUpdate = null;
				var newBlockIncrement = 0;
				var currentDivs = $("#input > div")
				for(var i in currentDivs) {
					for(var j in js) {
						if(js[j].id == currentDivs[i].id) currentDivs[i] = false
					}
				}
				//if a existing div is impossible to find, 
				//remove it(TODO > except if we are working on it)
				for(var i in currentDivs) {
					if(i != 0) $("#" + currentDivs[i].id).remove();
				}
				var merged = false;
				for(var i in js) {
					if(toUpdate = document.getElementById(js[i].id)) {
						if(toUpdate.innerHTML != js[i].content && toUpdate.innerHTML == TextProcessor.previousJs[js[i].id]) {
							//update, because nothing changed on our side
							toUpdate.innerHTML = js[i].content;
						} else if(toUpdate.innerHTML != TextProcessor.previousJs[js[i].id] && toUpdate.innerHTML != js[i].content) {
							//maybe pause the save when there is a load
							//changes on both sides haha!
							merged = true
							//for now, doing nothing is refusing the changes
							console.log("merge needed");
						}
					} else {
						//on new divs
						$($("#input > div")[js[i].index - 1]).after(
						$('<div id="' + js[i].id + '">' + js[i].content + '</div>'));

					}
				};

			}

		}]

		function performOnInput() {
			var pipe;
			for(var i = 0; i < onInputFunctions.length; i++) {
				pipe = onReadFunctions[i](pipe);
			}
			setState(READY);
			return pipe;
		}

		function performOnOutput(rawOutput) {
			var pipe = rawOutput;
			for(var i = 0; i < onOutputFunctions.length; i++) {
				pipe = onWriteFunctions[i](pipe);
			}
			setState(READY);
			return pipe;
		}

		var queu = function() {
				var queu = this;
				this.queu = [];
				this.addToQueu = function(request) {
					this.queu.push(request);
				}
				this.processQueu = function() {
					var request;
					if(this.queu.length) {
						request = queu[0];
						queu = queu.slice(1);
						return request;
					} else {
						return request;
					}
				}
				this.clearQueu = function() {
					this.queu = []
				}

				this.hasRequest = function() {
					return this.queu.length > 0
				}
				return this;
			}



		var loop = function() {
				loop = this;
				var interval = null;

				this.start = function() {
					loop.stop();
					interval = setInterval(function() {
						console.log("from loop:", currentState);
						if(getState() == READY_TO_READ) {
							console.log("from loop: saving");
							setState(READING);
							pn.send(performOnInput());
							return;
						}
						//TODO stop it;
						if(TextProcessor.queu.hasRequest() && setState("WRITING")) {
							request = TextProcessor.queu.processQueu();
							if(request) {
								console.log("loop: request found")
								performOnOutput(request);
							} else {
								console.log("loop: no request to proccess");
							}
						}

					}, 500);
				}
				this.stop = function() {
					if(interval) {
						clearInterval(interval);
					}

				}
				return loop;
			};



		var READY = "READY";
		var READING = "READING";
		var WRITING = "WRITING";
		var WRITING_NEXT_READ = "WRITING_NEXT_READ";
		var READY_TO_READ = "READY_TO_READ";

		var currentState = READY;

		var getState = function() {
				return currentState;
			}
			//TODO exposed for dev purpose only
			TextProcessor.getState = getState;


		var setState = function(requestedState) {
				if(currentState == READY) {
					currentState = requestedState;
					return true;
				}
				if(currentState == WRITING && requestedState == READING) {
					currentState = WRITING_NEXT_READ;
					return false;
				}
				if(currentState == WRITING && requestedState == WRITING) {
					return false;
				}
				if(currentState == WRITING && requestedState == READY) {
					currentState = READY;
					return true;
				}
				if(currentState == WRITING_NEXT_READ && requestedState == READY) {
					currentState = READY_TO_READ;
					return true
				}
				if(currentState == WRITING_NEXT_READ && requestedState == READING) {
					return false;
				}
				if(currentState == READING && requestedState == READY) {
					currentState = READY;
					return true
				}
				if(currentState == READY_TO_READ && requestedState == READING) {
					currentState = READING;
					return true
				}
				console.error("setState: no logical branch found")
				return false;
			}

			TextProcessor.setState = setState;

		(function(TextProcessor){
			TextProcessor.queu = new queu();
			TextProcessor.loop = new loop();
		})(TextProcessor);
		

		return TextProcessor;
	}

textProcessor = new TEXTPROCESSOR();

textProcessor.loop.start();

