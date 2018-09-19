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
var dragLine = false;
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

var debug = false;

function initialize(id=null) {
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

	/*
	window.addEventListener("wheel", function(e) {
		let scroll = e.deltaY;
		if(scroll > 0) zoomIn(scroll/100);
		else zoomOut(-scroll/100);
	}); */
	window.addEventListener("resize", function(e) { onResized(); });
	// Add listener for determining whether the mouse is hovering above a minimized event,
	// as well as determining whether the mouse is hovering above a event-connecting line.
	canvas.addEventListener("mousemove", function(e) {
		var pos = getMousePos(e.x, e.y);
		let contentDiv = $("#content-div").get(0);
		let changeCursor = false;
		let draggableEvent = null;
		for(i = 0; i < events.length; i++) {
			let event = events[i];
			let midX = getCoordFromDate(event.date);
			if (pos.x >= midX-5 && pos.x < midX+5) {
				if(event.minimizedIcon != null) {
					if(pos.y > midY - 8 && pos.y < midY + 8) {
						highlightedEvent = event;
						break;
					}
					else highlightedEvent = null;
				}
				else {
					let eventY = event.div.offsetTop;
					if ((eventY < midY && pos.y > eventY+event.div.offsetHeight+10 && pos.y < midY) || (eventY > midY && pos.y < eventY-10 && pos.y > midY)) {
						contentDiv.style.cursor = "e-resize";
						changeCursor = true;
						draggableEvent = event;
						break;
					}
				}
			}
		}
		if (!changeCursor) {
			// Cursor is not over a connecting line, change cursor to default.
			contentDiv.style.cursor = "auto";
			if (dragLine) {
				// We were able to drag previously, set this to false.
				document.onmousedown = null;
				dragLine = false;
			}
		}
		else if (!dragLine) {
			// We should now be able to drag, but weren't previously. Enable dragging.
			document.onmousedown = function(e) { lineDragStarted(draggableEvent, e); }
			dragLine = true;
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
	canvas.addEventListener("mousedown", function(e) {
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
	if(debug || id == null) {
		var now = new Date();
		now.setTime(now.getTime() - (1000*60*60*24));
		dateSet = "start";
		setDate(getISODateString(now));
		now.setTime(now.getTime() + (1000*60*60*24*2));
		dateSet = "end";
		setDate(getISODateString(now));
		document.getElementById("timeline-name").value = "My Timeline";
		setTimelineDimensions();
	}
}

function setTimelineDimensions() {
	calculateCanvasVariables();
	
	calculateTickCoords();
	calculateProgress();
	drawTimeline();
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

	let contentDiv = $("#content-div").get(0);
	contentDiv.style.height = (window.innerHeight-contentDiv.offsetTop-50) + "px";

	let div = document.getElementById("canvas_div");
	div.style.height = (contentDiv.offsetHeight - ($("#option-bar").get(0).offsetHeight) - 20) + "px";
	canvas.width  = (div.offsetWidth-10) * zoomWidth;
	canvas.height = div.offsetHeight*0.99;

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
		displayLoadError("Incorrect ID length, must be 32 characters.");
		return false;
	}
	return true;
}

function loadTimeline(timeId=null) {
	let inputField = $("#input-id").get(0);
	var id = timeId == null ? inputField.value : timeId;
	if(!checkInputValidity(id)) {
		if (timeId != null) inputField.value = id
		return;
	}
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
				initialize(id);

				hideHelperText();

				var responseArr = JSON.parse(this.responseText)[0];
				timelineId = id;
				
				dateSet = "start";
				setDate(responseArr[0]);
				dateSet = "end";
				setDate(responseArr[1]);
				document.getElementById("timeline-name").value = responseArr[2];
				setPageTitle();

				eventsHttp = new XMLHttpRequest();
				eventsHttp.onreadystatechange = function(e) {
					if (this.readyState == 4 && this.status == 200) {
						if(this.responseText != "empty") {
							var jsonMsg = JSON.parse(this.responseText);

							if (document.readyState == "complete") addEventsFromDB(jsonMsg);
							else {
								document.onreadystatechange = () => {
									if (document.readyState == "complete") addEventsFromDB(jsonMsg);
								};
							}
						}
						
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

function addEventsFromDB(jsonMsg) {
	setTimelineDimensions();

	for(i = 0; i < jsonMsg.length; i++) {
		var event = createEvent(endX * jsonMsg[i][5], canvas.height * jsonMsg[i][6], new Date(getDeformattedDateString(jsonMsg[i][2])));

		event.isCompleted = jsonMsg[i][3] == 1;
		createEventDiv(event.xPos, event.yPos, event);
		event.header.textContent = jsonMsg[i][2];
		event.txt.value = jsonMsg[i][1];
		event.id = jsonMsg[i][0];
		setEventMinimized(event, jsonMsg[i][4] == 1);
		event.status = "ajour";
		
		events.push(event);
	}
	drawTimeline();
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

function createEvent(x, y, date=null) {
	return {
		id: -1,
		xPos: x,
		yPos: y,
		header: null,
		div: null,
		txt: null,
		date: date,
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

	let date = event.date == null ? getDateFromCoord(x) : event.date;
	
	var p  = document.createElement("span");
	p.style.pointerEvents = "none";
	p.style.userSelect = "none";
	p.textContent = getFormattedDateString(date);
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
	
	headerDiv.onmousedown = function(e) { divDragStarted(event, e); };

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

	let divX = x - (inputDiv.offsetWidth/2);

	inputDiv.style.left = divX + "px";
	inputDiv.style.top = divY + "px";

	if (event.date == null) event.date = getDateFromCoord(x);
	event.setCompleted(checkCompleted.checked);
	event.checkDeadlineSeverity();
}

function setEventMinimized(event, isMini) {
	if(isMini) {
		event.minimizedIcon = {
			x: getCoordFromDate(event.date),
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

function getXPct(x) {
	return x/endX;
}

function getYPct(y) {
	return y/this.canvas.height;
}

function divDragStarted(event, e) {
	let pos = getMousePos(e.clientX, e.clientY);

	event.xPos = pos.x;
	event.yPos = pos.y;

	event.status = "changed";
	document.onmouseup = function(e) { onDivDragEnded(event, e); };
	document.onmousemove = function(e) { onDivDragEvent(event, e); };
}

function onDivDragEvent(event, e) {
	let pos = getMousePos(e.clientX, e.clientY);

	let x = pos.x;
	let y = pos.y;
	
	let divX = event.div.offsetLeft - (event.xPos - x);
	let divY = event.div.offsetTop - (event.yPos - y);
	
	eraseAll();

	event.div.style.left = divX + "px";
	event.div.style.top = divY + "px";

	event.xPos = x;
	event.yPos = y;

	drawTimeline();
}

function onDivDragEnded(event, e) {
	document.onmouseup = null;
	document.onmousemove = null;
	
	if (!fixAxisConformity(event)) eraseAll();

	drawTimeline();
}

function lineDragStarted(event, e) {
	event.status = "changed";
	document.onmouseup = function(e) { onLineDragEnded(event, e); };
	document.onmousemove = function(e) { onLineDragEvent(event, e); };
}

function onLineDragEvent(event, e) {
	let pos = getMousePos(e.clientX, e.clientY);

	let x = pos.x;
	let dateX = getCoordFromDate(event.date);
	
	let newX = dateX - (dateX - x);
	
	eraseAll();

	event.date = getDateFromCoord(newX);
	event.header.textContent = getFormattedDateString(event.date);

	drawTimeline();
}

function onLineDragEnded(event, e) {
	document.onmouseup = null;
	document.onmousemove = null;
	
	if(!fixAxisConformity(event)) eraseAll();

	drawTimeline();
}

function fixAxisConformity(event) {
	let midP = getMidPoint(event);
	if (!checkAxisConformity(event.div, midP.x, midP.y, "left")) {
		let newX = getCoordFromDate(startDate);
		event.div.style.left = (newX - event.div.offsetWidth/2) + "px";
		event.xPos = newX;
		event.date = startDate;
		event.header.textContent = getFormattedDateString(event.date);
		return false;
	}
	else if (!checkAxisConformity(event.div, midP.x, midP.y, "right")) {
		let newX = getCoordFromDate(endDate);
		event.div.style.left = (newX - event.div.offsetWidth/2) + "px";
		event.xPos = newX;
		event.date = endDate;
		event.header.textContent = getFormattedDateString(event.date);
		return false;
	}
	if (!checkAxisConformity(event.div, midP.x, event.div.offsetTop, "up")) {
		let newY = 0;
		event.div.style.top = newY + "px";
		event.yPos = newY;
		return false;
	}
	else if (!checkAxisConformity(event.div, midP.x, event.div.offsetTop, "down")) {
		let newY = canvas.offsetTop+canvas.height;
		event.div.style.top = (newY-event.div.offsetHeight) + "px";
		event.yPos = newY;
		return false;
	}
	return true;
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
	let divPos = getMidPoint(event);
	let datePos = getCoordFromDate(event.date).toFixed(0);

	if (datePos != divPos.x) {
		let botY = event.div.offsetTop+event.div.offsetHeight;
		let midLineY = divPos.y < midY ? botY + 10 : event.div.offsetTop - 10;
		drawLine(divPos.x, divPos.y, divPos.x, midLineY);
		drawLine(divPos.x, midLineY, datePos, midLineY);
		drawLine(datePos, midLineY, datePos, midY);
	}
	else drawLine(divPos.x, divPos.y, divPos.x, midY);
}

function drawMinimizedEvent(event) {
	event.minimizedIcon.draw();
}

function clearAll() {
	for(i = 0; i < events.length; i++) {
		document.getElementById("canvas_div").removeChild(events[i].div);
	}
	highlightedEvent = null;
	dragLine = false;
	startDate = null;
	endDate = null;
	events = new Array();
	document.getElementById("input-id").value = "";
	document.onmousedown = null;
	hideHelperText();
}

function showSetupMenu() {
	window.location.href = getBaseURL();
}

function getBaseURL() {
	let index = window.location.href.lastIndexOf("timeline");
	return window.location.href.substring(0, index) + "timeline";
}

function getTimelineURL() {
	let baseLoc = getBaseURL();

	return baseLoc+"/\n"+timelineId;
}

function openSaveModal() {
	document.getElementById("ref-link").textContent = getTimelineURL();
	document.getElementById("save-modal").style.display = "inline-block";
	document.getElementById("save-modal").style.animationPlayState = "running";
}

function closeSaveModal() {
	document.getElementById("save-modal").style.display = "none";
}

function openSettingsWindow() {
	var settings = document.getElementById("settings-div");
	if(timelineId != null) document.getElementById("settings-id").innerHTML = "Timeline URL: " + getTimelineURL();
	else document.getElementById("settings-id").innerHTML = "Timeline ID:<br>Not generated yet.";

	settings.style.display = "inline-block";
	settings.style.animationFillMode = "none";
	settings.style.animationName = "fade-in-animation";

	blurBackground(true);
}

function animateCloseSettingsWindow() {
	var settings = document.getElementById("settings-div");
	settings.style.animationFillMode = "forwards";
	settings.style.animationName = "zoom-out";
	blurBackground(false);
}

function closeSettingsWindow() {
	document.getElementById("settings-div").style.display = "none";
	blurBackground(false);
}

function animateCloseGuideWindow() {
	var guide = $("#guide-div").get(0);
	guide.style.animationFillMode = "forwards";
	guide.style.animationName = "zoom-out";
	blurBackground(false);
}

function openGuideWindow() {
	let guide = $("#guide-div").get(0);
	guide.style.display = "block";
	guide.style.animationFillMode = "none";
	guide.style.animationName = "fade-in-animation";
	blurBackground(true);
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

function setPageTitle() {
	let nameInput = $("#timeline-name").get(0);
	let title = "Timeline - " + nameInput.value;
	if (document.title != title) {
		document.title = title;
	}
}

function saveTimeline() {
	if(!isStartAndEndDateSet()) return;
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
				xcoords[i] = getXPct(pos.x);
				ycoords[i] = getYPct(pos.y);
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
				openSaveModal();
			}
			setPageTitle();
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
	closeSettingsWindow();
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

function blurBackground(blur) {
	let div = $("#blur-wrapper").get(0);
	let display = blur ? "block" : "none";
	if (blur) {
		div.style.display = "block";
		div.style.animationPlayState = "running";
	}
	else {
		div.style.animationPlayState = "running";
	}
	setTimeout(() => {
		div.style.animationPlayState = "paused";
		div.style.display = display;
	}, 700);
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

function alertInvalidDate(error="Invalid Date.") {
	alert(error);
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
		if (isStartAndEndDateSet() && date.getTime() > endDate.getTime()) {
			alertInvalidDate("Error: Start date must be earlier than end date.");
			return;
		}
		startDate = date;
		drawStartDate();
	}
	else {
		if (isStartAndEndDateSet() && date.getTime() < startDate.getTime()) {
			alertInvalidDate("Error: End date must be later than start date.");
			return;
		}
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