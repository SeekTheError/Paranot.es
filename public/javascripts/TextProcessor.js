/* The Text processor handle the read-write operation on the #input area
 It also implete a binary state machine that prevent Write and Read operation to be parallelized */



var TEXTPROCESSOR = function() {

		TextProcessor = this;

		TextProcessor.cursor = null;

		TextProcessor.start = function(){
			loop.start()
		}

		TextProcessor.stop = function(){
			loop.stop()
		}
		var path=null;

		getSavePath = function (){
			return path;
		}

		setSavePath = function(p){
			path=p
		}

		function perform(funcArray,callback,request,arg) {
			var pipe;
			if(request){
				pipe=request;
			}
			for(var i = 0; i < funcArray.length; i++) {
				pipe = funcArray[i](pipe);
			}
			setState(READY);
			if(callback){
				callback(pipe,arg)
			};
			return pipe;
		}

		TextProcessor.getInput = function(path) {
			setSavePath(path);
			setState(READING);
		}

		TextProcessor.setOutput = function(rawOutput) {
			queu.addToQueu(rawOutput);
			setState(WRITING);
		}

		var queu = function() {
				var queu = this;
				 var internalArray = [];
				 this.internalArray=internalArray;
				this.addToQueu = function(request) {
					internalArray.push(request);
				}
				this.processQueu = function() {
					var request;
					if(internalArray.length > 0) {
						request = internalArray[0];
						internalArray = internalArray.slice(1);
						return request;
					}
				}
				this.clearQueu = function() {
					internalArray = []
				}

				
				return this;
			}

		var queu = new queu();
		TextProcessor.queu=queu;

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
							var input=perform(readFunctions,pn.send,null,getSavePath());
							return;
						}
						//TODO stop it;
						if(queu.internalArray && getState() == READY_TO_WRITE) {
							var request = queu.processQueu();
							setState(WRITING);
							if(request) {
								console.log("loop: request found")
								perform(writeFunctions,null,request);
							} else {
								console.log("loop: no request to proccess");
							}
						}

					}, 100);
				}
				this.stop = function() {
					if(interval) {
						clearInterval(interval);
					}
				}
				return loop;
			};
			var loop = new loop();


		var READY = "READY";
		var READING = "READING";
		var WRITING = "WRITING";
		var WRITING_NEXT_READ = "WRITING_NEXT_READ";
		var READY_TO_READ = "READY_TO_READ";
		var READY_TO_WRITE = "READY_TO_WRITE";

		var currentState = READY;

		var getState = function() {
				return currentState;
			}
			//TODO exposed for dev purpose only
			TextProcessor.getState = getState;


		var setState = function(requestedState) {
				if(currentState == READY && requestedState == READING){
					currentState=READY_TO_READ;
					return true;
				}

				if(currentState == READY && requestedState == WRITING){
					currentState=READY_TO_WRITE;
					return true;
				}

				if(currentState == READY_TO_WRITE && requestedState == WRITING){
					currentState=WRITING;
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
				if(currentState == READING && requestedState == WRITING) {
					
					return false;
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

		return TextProcessor;
	}

textProcessor = new TEXTPROCESSOR();

textProcessor.start();

