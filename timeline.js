/**
 * 
*/
// Timeline pos values
const startX = 75;
var endX;
var midY;
var zoomLevel;
var zoomValues;

// Timeline size values
const dateTickHeight = 24;
const tickHeight = 20;
const barThickness = 10;

var highlightedPoint = false;
var highlightedStart = false;
var highlightedEnd = false;
var highlightedEvent;
var dateSet;
var startDate;
var endDate;
var canvas;
var ctx;
var ticks;
var timelineProgress;
var progressLength;
var events;
var point = {
	x: 0,
	y: 0,
	d: 6,
	
	draw: function() {
		ctx.beginPath();
		
		ctx.arc(this.x, this.y, this.d, 0, Math.PI * 2, true);
		
		ctx.fill();
	},

	erase: function() {
		ctx.fillStyle = "rgb(255, 255, 255)";
		
		ctx.beginPath();
		
		ctx.arc(this.x, this.y, this.d+1, 0, Math.PI * 2, true);
		
		ctx.fill();
	}
};
var toolTip = {
	x: 0,
	y: 0,
	font: "13px serif",
	text: null,
	
	draw: function() {
		ctx.fillStyle = "rgb(100, 100, 100)";
		ctx.font = this.font;
		ctx.fillText(this.text, this.x, this.y);
	},
	
	erase: function() {
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(this.x-1, this.y-10, this.text.length*11, 20);
	}
};
var timelineId = null;

var debug = true;

function initialize() {
	document.getElementById("startup-div").style.display = "none";
	document.getElementById("content-div").style.display = "block";
	canvas = document.getElementById("canvas");

	zoomLevel = 6;
	zoomValues = [0.1, 0.25, 0.5, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
	endDate = null;
	startDate = null;
	timelineId = null;
	highlightedEvent = null;

	ctx = canvas.getContext("2d");
	events = new Array();
	
	ctx.font = "20px serif";
	
	calculateCanvasVariables();
	
	window.addEventListener("wheel", function(e) {
		let scroll = e.deltaY;
		if(scroll > 0) {
			zoomIn(parseInt(Math.sqrt(scroll), 10));
			console.log(Math.sqrt(scroll))
		}
		else {
			console.log(Math.sqrt(scroll*-1));
			zoomOut(parseInt(-(Math.sqrt(scroll*-1)), 10));
		}
	});
	window.addEventListener("resize", function(e) { onResized(); });
	canvas.addEventListener("mousemove", function(e) {
		var pos = getMousePos(e.x, e.y);
		for(i = 0; i < events.length; i++) {
			if(events[i].minimizedIcon == null) continue;
			let event = events[i];
			let miniX = event.minimizedIcon.x;
			if(pos.x >= miniX-5 && pos.x < miniX+5 && pos.y > midY - 8 && pos.y < midY + 8) {
				highlightedEvent = event;
				break;
			}
			else highlightedEvent = null;
		}
	});
	canvas.addEventListener("mousemove", function(e) {
		if(toolTip.text != null) {
			toolTip.erase();
			toolTip.text = null;
		}
		var pos = getMousePos(e.x, e.y);
		if(pos.x >= startX+5 && pos.x <= endX-5
				&& pos.y > midY - 8 && pos.y < midY + 8) {
			point.erase();
			
			drawTimeline();
			
			ctx.fillStyle = "rgb(0, 0, 0)";
			point.x = pos.x;
			if(highlightedEvent == null) point.draw();
			highlightedPoint = true;
			
			if(highlightedEvent != null) {
				let date = getDateFromCoord(pos.x);
				toolTip.text = "Event: " + getFormattedDateString(date);
				toolTip.x = highlightedEvent.minimizedIcon.x - 35;
				toolTip.draw();
			}
			else if(isStartAndEndDateSet()) {
				let date = getDateFromCoord(pos.x);
				toolTip.text = getFormattedDateString(date);
				toolTip.x = pos.x - 25;
				toolTip.draw();
			}
		}
		else if(highlightedPoint) {
			point.erase();
			drawTimeline();
			highlightedPoint = false;
		}
	});
	canvas.addEventListener("mousemove", function(e) {
		var pos = getMousePos(e.clientX, e.clientY);
		if(pos.x > startX - 8 && pos.x < startX + 8
				&& pos.y > midY - dateTickHeight - 5 && pos.y < midY + dateTickHeight + 5) {
			drawStartDateTick("rgb(255, 0, 0)");
			highlightedStart = true;
		}
		else if(highlightedStart) {
			drawStartDateTick("rgb(0, 0, 0)");
			highlightedStart = false;
		}
	});
	canvas.addEventListener("mousemove", function(e) {
		var pos = getMousePos(e.clientX, e.clientY);
		if(pos.x > endX - 8 && pos.x < endX + 8
				&& pos.y > midY - dateTickHeight - 5 && pos.y < midY + dateTickHeight + 5) {
			drawEndDateTick("rgb(255, 0, 0)");
			highlightedEnd = true;
		}
		else if(highlightedEnd) {
			drawEndDateTick("rgb(0, 0, 0)");
			highlightedEnd = false;
		}
	});
	canvas.addEventListener("click", function(e) {
		if(highlightedEvent != null) {
			setEventMinimized(highlightedEvent, false);
		}
		else if(highlightedStart) {
			animateHideHelperText();
			dateSet = "start";
			showDateModal();
		}
		else if(highlightedEnd) {
			animateHideHelperText();
			dateSet = "end";
			showDateModal();
		}
		else if(highlightedPoint) {
			if(isStartAndEndDateSet()) {
				addTimelineEvent(e.clientX, e.clientY);
				highlightedPoint = false;
			}
		}
	});
	if(debug) {
		dateSet = "start";
		setDate("2017-10-20");
		dateSet = "end";
		setDate("2017-11-15")
	}

	document.getElementById("timeline-name").value = "My Timeline";
}

function onResized() {
	calculateCanvasVariables();
	calculateEventPositions();
	if(isStartAndEndDateSet()) {
		calculateTickCoords();
		calculateProgress();
	}
	drawTimeline();
}

function calculateCanvasVariables() {
	let zoomWidth = 1;
	zoomWidth = zoomValues[zoomLevel];
	let div = document.getElementById("canvas_div");
	ctx.canvas.width  = (div.offsetWidth-10) * zoomWidth;
	ctx.canvas.height = window.innerHeight-300;

	endX = ((startX + canvas.width)-(startX*2));
	midY = canvas.height/2;
	
	point.y = midY;
	toolTip.y = midY - 20;
}

function calculateEventPositions() {
	for(i = 0; i < events.length; i++) {
		let event = events[i];
		let xCoord = getCoordFromDate(event.date);
		event.div.style.left = (xCoord - event.div.offsetWidth/2) + "px";
		event.xPos = xCoord;

		if(event.div.offsetTop < canvas.offsetTop) {
			event.div.style.top = 5 + "px";
		}
		else if(event.div.offsetTop + event.div.offsetHeight > canvas.offsetTop+canvas.height) {
			event.div.style.top = ((canvas.offsetTop+canvas.height) - event.div.offsetHeight) + "px";
		}
		else {
			event.div.style.top = (event.yPos - (event.div.offsetTop/2)) + "px";
		}
	}
}

function triggerButtonCooldown(buttonId) {
	document.getElementById(buttonId).disabled = true;
	setTimeout(function() {
		document.getElementById(buttonId).disabled = false;
	}, 250);
}

function displayLoadError(msg) {
	if(timelineId == null) {
		document.getElementById("input-err-label").textContent = msg;
		document.getElementById("load-timeline-button").disabled = false;
	}
	else {
		document.getElementById("modal-input-err-label").textContent = msg;
		document.getElementById("modal-load-timeline-button").disabled = false;
	}
}

function checkInputValidity(givenId) {
	if(givenId == "") {
		displayLoadError("Input Expected.");
		return false;
	}
	else if(givenId.length != 32) {
		displayLoadError("Incorrect length, must be 32 characters.");
		return false;
	}
	return true;
}

function loadTimeline() {
	var id = document.getElementById("input-id").value;
	if(!checkInputValidity(id)) return;
	loadFromDB(id);
}

function loadFromDB(id) {
	timelineHttp = new XMLHttpRequest();
	timelineHttp.onreadystatechange = function(e) {
		if (this.readyState == 4 && this.status == 200) {
			if(this.responseText == "empty") {
				displayLoadError("Invalid Timeline ID.");
				return;
			}
			else {
				initialize();
				hideHelperText();

				var responseArr = JSON.parse(this.responseText)[0];
				timelineId = id;
				
				dateSet = "start";
				setDate(responseArr[0]);
				dateSet = "end";
				setDate(responseArr[1]);
				document.getElementById("timeline-name").value = responseArr[2];

				drawTimeline();

				eventsHttp = new XMLHttpRequest();
				eventsHttp.onreadystatechange = function(e) {
					if (this.readyState == 4 && this.status == 200) {
						if(this.responseText != "empty") {
							var jsonMsg = JSON.parse(this.responseText);
							
							for(i = 0; i < jsonMsg.length; i++) {
								var xoffset = canvas.getBoundingClientRect().left;

								var event = createEvent(jsonMsg[i][5], jsonMsg[i][6]);

								event.isCompleted = jsonMsg[i][3] == 1;
								createEventDiv(jsonMsg[i][5], jsonMsg[i][6], event);
								event.header.textContent = jsonMsg[i][2];
								event.txt.value = jsonMsg[i][1];
								event.id = jsonMsg[i][0];
								setEventMinimized(event, jsonMsg[i][4] == 1);
								event.status = "ajour";
								
								events.push(event);
							}
						}
						drawTimeline();
					}
				}
				eventsHttp.open("GET", "/projects/timeline/load_events.php?id=" + id);
				eventsHttp.send();
			}
		}
		if(this.status == 500) {
			displayLoadError("Server error :( try again later.");
			return;
		}
	};
	timelineHttp.open("GET", "/projects/timeline/load_timeline.php?id=" + id, true);
	timelineHttp.send();
}

function getMousePos(xPos, yPos) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: xPos - rect.left,
		y: yPos - rect.top
	};
}

function drawTimeline() {
	ctx.font = "20px serif";
	if(isStartAndEndDateSet()) eraseMinorTicks();
	
	ctx.strokeStyle = "rgb(0, 0, 0)";
	
	drawLine(startX, midY, endX, midY);
	
	if(isStartAndEndDateSet()) {
		drawProgressBar();
		drawMinorTicks();
	}
	
	for(i = 0; i < events.length; i++) {
		if(events[i] != undefined && events[i].status != "delete") {
			if(events[i].minimizedIcon == null) drawEventConnectingLine(events[i]);
			else drawMinimizedEvent(events[i]);
		}
	}
	
	drawStartDateTick("rgb(0, 0, 0)");
	drawEndDateTick("rgb(0, 0, 0)");
	drawStartDate();
	drawEndDate();
}

function showHelperText() {
	document.getElementById("helper-div").style.display = "inline-block";
	document.getElementById("helper-div").style.animationPlayState = "running";
}

function hideHelperText() {
	document.getElementById("helper-div").style.display = "none";
}

function animateHideHelperText() {
	var helper = document.getElementById("helper-div");
	helper.style.animationName = "popdown-animation";
}

function showDateModal() {
	let input = document.getElementById("dateForm");
	if(startDate != null) {
		let startISO = getISODateString(startDate);
		if(dateSet == "start") input.value = startISO;
		else input.min = startISO;
	}
	else if(endDate != null) {
		let endISO = getISODateString(endDate);
		if(dateSet == "end") input.value = endISO;
		else input.max = endISO;
	}
	
	document.getElementById("dateModal").style.display = "block";
}

function isStartAndEndDateSet() {
	return startDate != null && endDate != null;
}

function drawLine(x1, y1, x2, y2) {
	ctx.beginPath();
	
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	
	ctx.stroke();
}

function drawStartDateTick(rgb) {
	ctx.strokeStyle = rgb;
	
	drawLine(startX, midY-(dateTickHeight/2), startX, midY+(dateTickHeight/2));
}

function drawEndDateTick(rgb) {
	ctx.strokeStyle = rgb;
	
	drawLine(endX, midY-(dateTickHeight/2), endX, midY+(dateTickHeight/2));
}

function addTimelineEvent(x, y) {
	var pos = getMousePos(x, y);

	var event = createEvent(pos.x, 150);

	createEventDiv(pos.x, 150, event);
	events.push(event);

	drawTimeline();
}

function createEvent(x, y) {
	return {
		id: -1,
		xPos: x,
		yPos: y,
		header: null,
		div: null,
		txt: null,
		date: null,
		isCompleted: false,
		status: "new",
		minimizedIcon: null,
		setCompleted: function(completed) {
			this.isCompleted = completed;
			if(completed) {
				this.div.style.borderColor = "lime";
			}
			else {
				this.div.style.borderColor = "black";
			}
		},
		checkDeadlineSeverity: function() {
			if(this.isCompleted) return;
			if(getDayFromMillis(getDateFromCoord(getMidPoint(this).x).getTime()) < getDayFromMillis(new Date().getTime()) + 3) {
				this.div.style.borderColor = "red";
			}
			else this.setCompleted(false);
		}
	};
}

function createEventDiv(x, y, event) {
	var inputDiv = document.createElement("div");
	inputDiv.className = "input-div";

	var headerDiv = document.createElement("div");
	headerDiv.id = "input-header";

	var p  = document.createElement("span");
	p.style.pointerEvents = "none";
	p.style.userSelect = "none";
	p.textContent = getFormattedDateString(getDateFromCoord(x));
	headerDiv.appendChild(p);

	let closeButton = document.createElement("button");
	closeButton.style.float = "right";
	closeButton.innerHTML = "&times";
	headerDiv.appendChild(closeButton);

	let minimizeButton = document.createElement("button");
	minimizeButton.style.float = "right";
	minimizeButton.innerHTML = "-";
	headerDiv.appendChild(minimizeButton);

	inputDiv.appendChild(headerDiv);

	let midDiv = document.createElement("div");
	midDiv.id = "input-mid";

	var textArea = document.createElement("textarea");
	textArea.id = "text-area";
	textArea.maxLength = 120;
	textArea.rows = 5;
	midDiv.appendChild(textArea);
	
	inputDiv.appendChild(midDiv);

	let footerDiv = document.createElement("div");
	footerDiv.id = "input-footer";

	var checkCompleted = document.createElement("input");
	checkCompleted.name = "chck-complete";
	checkCompleted.checked = event.isCompleted;
	checkCompleted.onclick = function(e) { 
		event.setCompleted(checkCompleted.checked);
		event.status = "changed";
	};
	checkCompleted.type = "checkbox";
	footerDiv.appendChild(checkCompleted);

	let labelComplete = document.createElement("label");
	labelComplete.for = checkCompleted;
	labelComplete.textContent = "Completed";
	footerDiv.appendChild(labelComplete);

	inputDiv.appendChild(footerDiv);

	document.getElementById("canvas_div").appendChild(inputDiv);
	
	headerDiv.onmousedown = function(e) { dragStarted(event, e); };

	textArea.oninput = function(e) { 
		event.status = "changed"; 
	};
	closeButton.onclick = function(e) {
		document.getElementById("canvas_div").removeChild(inputDiv);
		events[events.indexOf(event)].status = "delete";
		refresh();
	};
	minimizeButton.onclick = function(e) { setEventMinimized(event, true); };

	event.div = inputDiv;
	event.txt = textArea;
	event.header = p;

	let divY = y - (inputDiv.offsetHeight/2);
	
	if(!checkAxisConformity(inputDiv, x, y, "left")) x = startX;
	else if(!checkAxisConformity(inputDiv, x, y,  "right")) x = endX;
	if(!checkAxisConformity(inputDiv, x, divY,  "up")) divY = 0;
	else if(!checkAxisConformity(inputDiv, x, divY,  "down")) divY = (canvas.height) - inputDiv.offsetHeight;

	inputDiv.style.left = (x - (inputDiv.offsetWidth/2)) + "px";
	inputDiv.style.top = divY + "px";

	event.date = getDateFromCoord(x);
	event.setCompleted(checkCompleted.checked);
	event.checkDeadlineSeverity();
}

function setEventMinimized(event, isMini) {
	if(isMini) {
		event.minimizedIcon = {
			x: getMidPoint(event).x,
			oldY: event.div.offsetTop + event.div.offsetHeight/2,
			d: 7,
			color: event.div.style.borderColor !== "black" ? event.div.style.borderColor : "rgb(0, 0, 255)",
			draw: function() {
				let oldFill = ctx.fillStyle;

				if(highlightedEvent != event) ctx.fillStyle = this.color;
				else ctx.fillStyle = "black";
				
				ctx.beginPath();
			
				ctx.arc(this.x, midY, this.d, 0, Math.PI * 2, true);
				
				ctx.fill();
				ctx.fillStyle = oldFill;
			}
		}
		event.div.style.display = "none";
	}
	else {
		event.div.style.display = "inline-block";
		event.minimizedIcon = null;
		highlightedEvent = null;
	}
	event.status = "changed";
	refresh();
}

function dragStarted(event, e) {
	let pos = getMousePos(e.clientX, e.clientY);

	event.xPos = pos.x;
	event.yPos = pos.y;

	event.status = "changed";
	document.onmouseup = function(e) { onDragEnded(event, e); };
	document.onmousemove = function(e) { onDragEvent(event, e); };
}

function onDragEvent(event, e) {
	let pos = getMousePos(e.clientX, e.clientY);

	let x = pos.x;
	let y = pos.y;
	
	let divX = event.div.offsetLeft - (event.xPos - x);
	let divY = event.div.offsetTop - (event.yPos - y);
	
	if(!checkAllAxisConformity(event.div, divX + event.div.offsetWidth/2, divY)) return;

	eraseAll();

	event.div.style.left = divX + "px";
	event.div.style.top = divY + "px";

	event.xPos = x;
	event.yPos = y;

	event.date = getDateFromCoord(getMidPoint(event).x);
	event.header.textContent = getFormattedDateString(event.date);

	event.checkDeadlineSeverity();

	drawTimeline();
}

function onDragEnded(event, e) {
	document.onmouseup = null;
    document.onmousemove = null;

	drawTimeline();
}

function checkAllAxisConformity(div, x, y) {
	return checkAxisConformity(div, x, y, "left") && checkAxisConformity(div, x, y, "right") && 
	checkAxisConformity(div, x, y, "up") && checkAxisConformity(div, x, y, "down");
}

function checkAxisConformity(div, x, y, direction) {
	if(direction == "left") return getDateFromCoord(x).getTime() >= startDate.getTime();
	else if(direction == "right") return getDateFromCoord(x).getTime() <= endDate.getTime();
	else if(direction == "up") return y >= 0;
	else if(direction == "down") return y + div.offsetHeight < canvas.offsetTop+canvas.height;
	return true;
}

function getMidPoint(event) {
	if(event.minimizedIcon == null) {
		return {
			x: event.div.offsetLeft + (event.div.offsetWidth/2),
			y: event.div.offsetTop + (event.div.offsetHeight/2)
		};
	}
	else {
		return {
			x: event.minimizedIcon.x,
			y: event.minimizedIcon.oldY,
		};
	}
}

function drawEventConnectingLine(event) {
	let pos = getMidPoint(event);
	drawLine(pos.x, pos.y, pos.x, midY);
}

function drawMinimizedEvent(event) {
	event.minimizedIcon.draw();
}

function clearAll() {
	for(i = 0; i < events.length; i++) {
		document.getElementById("canvas_div").removeChild(events[i].div);
	}
	highlightedEvent = null;
	startDate = null;
	endDate = null;
	events = new Array();
	document.getElementById("input-id").value = "";
	hideHelperText();
}

function showSetupMenu() {
	closeSettingsWindow();
	clearAll();
	document.getElementById("content-div").style.display = "none";
	document.getElementById("startup-div").style.display = "block";
}

function closeSaveModal() {
	document.getElementById("save-modal").style.display = "none";
}

function openSettingsWindow() {
	var settings = document.getElementById("settings-div");
	if(timelineId != null) document.getElementById("settings-id").innerHTML = "Timeline ID: " + timelineId;
	else document.getElementById("settings-id").innerHTML = "Timeline ID:<br>Not generated yet.";

	settings.style.display = "inline-block";
	settings.style.animationFillMode = "none";
	settings.style.animationName = "fade-in-animation";
}

function animateCloseSettingsWindow() {
	var settings = document.getElementById("settings-div");
	settings.style.animationFillMode = "forwards";
	settings.style.animationName = "zoom-out";
}

function closeSettingsWindow() {
	document.getElementById("settings-div").style.display = "none";
}

function downloadCanvas(link, fileName) {
	link.href = canvas.toDataURL();
    link.download = fileName;
}

function checkEventIsEmpty(event) {
	let inputLength = event.txt.value.length;
	if(inputLength == 0) {
		event.txt.placeholder = "Event did not get saved, description is empty.";
		return true;
	}
	return false;
}

function saveTimeline() {
	saveChangesToDB();
}

function saveChangesToDB() {
	var timeline = { "id":timelineId, "startDate":getISODateString(startDate), "endDate":getISODateString(endDate), 
		"name":document.getElementById("timeline-name").value };
	var timelineJSON = JSON.stringify(timeline);

	var httpTimeline = new XMLHttpRequest();
	httpTimeline.onreadystatechange = function() {
		if (this.readyState == 4) {
			if(this.status == 500) {
				alert("Unable to save :( try again later.");
				return;
			}
			var id = timelineId;
			if(id == null) {
				timelineId = this.responseText;
			}

			var ids = new Array(events.length);
			var descriptions = new Array(events.length);
			var deadlines = new Array(events.length);
			var completions = new Array(events.length);
			var statuses = new Array(events.length);
			var minimizes = new Array(events.length);
			var xcoords = new Array(events.length)
			var ycoords = new Array(events.length)

			for(i = 0; i < events.length; i++) {
				ids[i] = events[i].id;
				descriptions[i] = events[i].txt.value;
				deadlines[i] = events[i].header.textContent;
				completions[i] = events[i].isCompleted ? 1 : 0;
				if(checkEventIsEmpty(events[i])) events[i].status = "invalid";
				statuses[i] = events[i].status;
				minimizes[i] = events[i].minimizedIcon !== null ? 1 : 0;
				let pos = getMidPoint(events[i]);
				xcoords[i] = pos.x;
				ycoords[i] = pos.y;
			}

			var eventses = { "ids":ids, "timeline_id":timelineId, "descriptions":descriptions, "deadlines":deadlines, "completions":completions, 
				"statuses":statuses, "minimizes":minimizes, "xcoords":xcoords, "ycoords":ycoords };
			var eventsJSON = JSON.stringify(eventses);
			
			let httpEvents = new XMLHttpRequest();
			httpEvents.onreadystatechange = function() {
				if (this.readyState == 4) {
					if(this.status == 500) {
						console.log(this.responseText);
						alert("Unable to save :( try again later.");
						return;
					}
					else if(this.responseText != "empty") {
						var jsonResp = JSON.parse(this.responseText);
						for(i = 0; i < jsonResp.length; i++) {
							if(events[i].status == "delete") events[i] = undefined;
							else if(events[i].status != "invalid") {
								events[i].id = jsonResp[i];
								events[i].status = "ajour";
							}
						}
					}
				}
			};

			httpEvents.open("GET", "/projects/timeline/save_events.php?ev=" + eventsJSON, true);
			httpEvents.send();

			if(id == null) {
				document.getElementById("ref-link").textContent = timelineId;
				document.getElementById("save-modal").style.display = "inline-block";
				document.getElementById("save-modal").style.animationPlayState = "running";
			}
		}
	};
	
	httpTimeline.open("GET", "/projects/timeline/save_timeline.php?tl=" + timelineJSON, true);
	httpTimeline.send();
}

function zoomOut(amount) {
	if(zoomLevel + amount > zoomValues.length-1) return;
	eraseAll();
	zoomLevel += amount;	
	if(document.getElementById("zoom-out-button").disabled) document.getElementById("zoom-out-button").disabled = false;
	if(zoomLevel == zoomValues.length-1) document.getElementById("zoom-in-button").disabled = true;
	onResized();
}

function zoomIn(amount) {
	if(zoomLevel - amount < 0) return;
	eraseAll();
	zoomLevel -= amount;
	if(document.getElementById("zoom-in-button").disabled) document.getElementById("zoom-in-button").disabled = false;
	if(zoomLevel == 0) document.getElementById("zoom-out-button").disabled = true;
	onResized();
}

function newTimeline() {
	clearAll();
	initialize();
	drawTimeline();
}

function showLoadInput() {
	document.getElementById("modal-load-div").style.display = "block";
}

function hideLoadInput() {
	document.getElementById("modal-load-div").style.display = "none";
}

function loadNewTimeline() {
	var id = document.getElementById("modal-input-id").value;
	if(!checkInputValidity(id)) return;
	clearAll();
	loadFromDB(id);
	hideLoadInput();
	closeSettingsWindow();
}

function resetTimeline() {
	clearAll();
	refresh();
}

function refresh() {
	eraseAll();
	drawTimeline();
}

function eraseAll() {
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function setDateFromModal() {
	setDate(document.getElementById("dateForm").value);
}

function alertInvalidDate() {
	alert("Invalid Date!");
}

function setDate(dateString) {
	if(dateString == undefined) {
		alertInvalidDate();
		return;
	}
	
	var date = new Date(dateString);
	if(date == "Invalid Date") {
		alertInvalidDate();
		return;
	}
	
	if(dateSet == "start") {
		startDate = date;
		drawStartDate();
	}
	else {
		endDate = date;
		drawEndDate();
	}
	if(isStartAndEndDateSet()) {
		eraseAll();
		if(endDate.getDate() == startDate.getDate()) {
			startDate.setHours(0);
			endDate.setHours(23);
		}
		calculateTickCoords();
		calculateProgress();
		calculateEventPositions();
	}
	drawTimeline();
}

function drawStartDate() {
	if(startDate != null) {
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(startX-40, midY-45, 110, 20);
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillText(getFormattedDateString(startDate), startX-30, midY-30);
	}
}

function drawEndDate() {
	if(endDate != null) {
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(endX-80, midY-45, 110, 20);
		ctx.fillStyle = "rgb(0, 0, 0)"
		ctx.fillText(getFormattedDateString(endDate), endX-70, midY-30);
	}
}

function getFormattedDateString(date) {
	return date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
}

function getDeformattedDateString(dateString) {
	let arr = dateString.split("/");
	return arr[2] + "-" + arr[1] + "-" + arr[0];
}

function getISODateString(date) {
	let month = date.getMonth()+1;
	let day = date.getDate();

	if(month < 10) month = "0" + month;
	if(day < 10) day = "0" + day;

	return date.getFullYear() + "-" + month + "-" + day;
}

function getDayFromMillis(millis) {
	return millis/1000/60/60/24;
}

function getDateFromCoord(xCoord) {
	var milliDiff = endDate.getTime() - startDate.getTime();
	var ratio = (xCoord - startX) / (endX - startX);
	var dateInMillis = startDate.getTime() + (milliDiff * ratio);
	return new Date(dateInMillis);
}

function getCoordFromDate(date) {
	var distDif = endX - startX;
	var ratio = (date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
	var coord = startX + (distDif * ratio);
	return coord;
}

function calculateTickCoords() {
	var diff = getDayFromMillis(endDate.getTime()) - getDayFromMillis(startDate.getTime());
	if(diff > 30) {
		diff = diff/(diff/30);
	}
	var factor = (endX - startX)/diff+1;
	ticks = new Array();
	
	for(i = 0; i < diff; i++) {
		ticks.push(startX + (factor*i));
	}
}

function eraseMinorTicks() {
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(startX + 2, midY - tickHeight, endX - startX - 4, tickHeight * 2);
}

function drawMinorTicks() {
	ctx.strokeStyle = "rgb(0, 0, 0)";
	for(i = 0; i < ticks.length; i++) {
		drawLine(ticks[i], midY-tickHeight/2, ticks[i], midY+tickHeight/2);
	}
}

function calculateProgress() {
	var startInMillis = startDate.getTime();
	var endInMillis = endDate.getTime();
	var currentInMillis = new Date().getTime();
	
	var diffEndStart = endInMillis - startInMillis;
	currentInMillis -= startInMillis;
	
	timeLineProgress = currentInMillis/diffEndStart;
	
	progressLength = (endX - startX)*timeLineProgress;
}

function drawProgressBar() {
	ctx.fillStyle = "rgb(204, 204, 51)";
	ctx.fillRect(startX + 1, midY - (barThickness/2), progressLength, barThickness);
}