	var readFunctions = [

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


	var writeFunctions = [
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