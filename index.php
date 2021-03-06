<!DOCTYPE html>
<html>
<head>
	<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=UA-112742388-1"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', 'UA-112742388-1');
	</script>

	<title>Timeline</title>
	<link rel="stylesheet" type="text/css" href="/global-style.css">
	<script src="/projects/timeline/timeline.js"></script>
	<script> 
	function closeModal() {
		document.getElementById("dateModal").style.display = "none";
	};
	function copyURL() {
		document.getElementById("ref-link").select();
		document.execCommand('copy');
	};
	</script>
	<script src="/scripts/generate_nav.js"></script>
</head>
<body onload="generate_nav('Interactive Timeline');">
	<link rel="stylesheet" type="text/css" href="/projects/timeline/timeline-style.css">
	<link rel="stylesheet" type="text/css" href="/bootstrap/css/bootstrap.min.css"/>
	<script src="/bootstrap/js/jquery.min.js"></script>
	<script src="/bootstrap/js/bootstrap.min.js"></script>
	<script src="/node_modules/html2canvas/dist/html2canvas.min.js"></script>;

	<div id="startup-div">
		<div id="startup-input-div" class="form-group">
			<label id="startup-header-label" for="input-id">Load Timeline from ID</label>
			<input class="form-control" id="input-id" name="input-id" type="text" placeholder="Timeline ID"></input>
			<button id="load-timeline-button" class="btn btn-primary" 
			onclick="triggerButtonCooldown('modal-load-timeline-button'); loadTimeline();">Load</button>
			<label id="input-err-label" class="input-error-label" for="input-id"></label>
		</div>
		<p>Or create a new one</p>
		<button id="new-timeline-button" class="btn btn-primary" onclick="initialize(); showHelperText();">Create Timeline</button>
	</div>

	<div id="content-div">
		<div id="option-bar">
			<div id="option-bar-left">
				<button id="settings-button" onclick="openAndBlur('settings-div'); showTimelineId();" class="btn btn-primary">
					<img src="/projects/timeline/icons/settings.png" width="25" height="25" alt="Settings" class="icon-img" />
				</button>
				<button id="reset-button" onclick="resetTimeline();" class="btn btn-primary">
					<img src="/projects/timeline/icons/trash.png" width="25" height="25" alt="Reset" class="icon-img" />
				</button>
				<button id="help-button" onclick="openAndBlur('guide-div');" class="btn btn-primary">
					<img src="/projects/timeline/icons/questionmark.png" width="25" height="25" alt="Help" class="icon-img" />
				</button>
			</div>
			<div id="option-bar-right">
				<button id="zoom-out-button" onclick="zoomIn(1);" class="btn btn-primary">
					<img src="/projects/timeline/icons/zoom-out.png" width="25" height="25" alt="Zoom Out" class="icon-img" />
				</button>
				<button id="zoom-in-button" onclick="zoomOut(1);" class="btn btn-primary">
						<img src="/projects/timeline/icons/zoom-in.png" width="25" height="25" alt="Zoom In" class="icon-img" />
				</button>
				<button id="download-button" onclick="openAndBlur('download-div');" class="btn btn-primary">
					<img src="/projects/timeline/icons/download.png" width="25" height="25" alt="Download" class="icon-img" />
				</button>
				<button id="save-button" onclick="saveTimeline();" class="btn btn-primary">
					<img src="/projects/timeline/icons/save.png" width="25" height="25" alt="Save" class="icon-img" />
				</button>
			</div>
			<div id="option-bar-mid">
				<input id="timeline-name" type="text"/>
			</div>
		</div>
		<div id="helper-div" class="popup-div">
			<span>Welcome!</span>
			<button class="btn btn-danger" onclick="animateHideHelperText();">&times;</button>
			<p>	
				To get started, click on either ends of <br>
				the timeline to select a start/end date.
			</p>
		</div>

		<div id="save-modal" class="popup-div">
			<button id="close-save-modal" class="btn btn-primary" onclick="closeSaveModal();">&times;</button>
			<p>Timeline saved! Access it later using the link below:</p>
			<textarea readonly rows="2" id="ref-link"></textarea>
			<button id="btn-copy-id" class="btn btn-primary" onclick="copyURL();">Copy</button>
		</div>
		<div id="canvas_div">
			<canvas id="canvas" width="1100" height="600"></canvas>
			
			
		</div>

		<div id="settings-div" class="window">
			<span id="settings-header">Settings</span>
			<button class="btn btn-primary" onclick="closeAndUnblur('settings-div');">&times;</button>
			<div>
				<div id="settings-id">
					
				</div>
				
				<span>Auto-load latest timeline</span>
				<input id="auto-load-timeline" type="checkbox" onclick="setAutoloadCookie(this.checked);"/>
				<button class="btn btn-primary" onclick="showLoadInput();">Load Timeline</button>
				<button class="btn btn-primary" onclick="newTimeline();">New Timeline</button>
				<button class="btn btn-primary" onclick="showSetupMenu();">Go to Main Menu</button>
			</div>
		</div>

		<div id="modal-load-div">
			<label id="modal-load-header-label" for="modal-input-id">Load Timeline from ID</label>
			<button class="btn btn-primary" onclick="hideLoadInput();">&times;</button>
			<input class="form-control" id="modal-input-id" name="modal-input-id" type="text" placeholder="Timeline ID"/>
			<button id="modal-load-timeline-button" class="btn btn-primary" 
			onclick="triggerButtonCooldown('modal-load-timeline-button'); loadNewTimeline();">Load</button>
			<label id="modal-input-err-label" class="input-error-label" for="input-id"></label>
		</div>

		<div id="guide-div" class="window">
			<span>How I timeline?</span>
			<button class="btn btn-primary" onclick="closeAndUnblur('guide-div');">&times;</button>

			<div id="guide-img" class="guide-content">
				<div><img src="/projects/timeline/guide_images/guide1.png" alt="Rip"/></div>
				<div><img src="/projects/timeline/guide_images/guide2.png" alt="Rip"/></div>
				<div><img src="/projects/timeline/guide_images/guide3.png" alt="Rip"/></div>
				<div><img src="/projects/timeline/guide_images/guide4.png" alt="Rip"/></div>
				<div><img src="/projects/timeline/guide_images/guide5.png" alt="Rip"/></div>
				<div><img src="/projects/timeline/guide_images/guide6.png" alt="Rip"/></div>
			</div>

			<div id="guide-desc" class="guide-content">
				<div>Click either ends of the timeline to change start/end date.</div>
				<div>When start & end date is set, click anywhere on the timeline to add an event at that date.</div>
				<div>Delete events.</div>
				<div>Drag events around.</div>
				<div>Change date of event by dragging it's connecting line.</div>
				<div>Save your timeline. This generates a unique link, so you can access your timeline later. Save the link :)</div>
			</div>
		</div>

		<div id="download-div" class="window">
			<span>Download as...</span>
			<button class="btn btn-primary" onclick="closeAndUnblur('download-div');">&times;</button>

			<div>
				<button id="dl-timeline-btn" class="btn btn-primary">PNG image</button>
			</div>
		</div>
	</div>

	<div id="dateModal" class="modal">
		<div class="modal-content">
			<button class="modal-buttons" onclick="closeModal();">&times;</button>
			<div>
				Input a Date:
				<input type="date" name="date" id="dateForm">
			</div>
			<button class="modal-buttons" onclick="setDateFromModal(); closeModal();">OK</button>
		</div>
	</div>

	<div id="blur-wrapper"></div>

	<a id="dl-canvas" download="canvas.png"></a>
</body>
</html>

<?php
include("./cookie_handler.php");

$id = null;

$url_split = explode("/", $_SERVER["REQUEST_URI"]);
$last_element = $url_split[count($url_split)-1];
if(isset($_GET["id"])) {
	$id = $_GET["id"];
}
else if($last_element != "timeline" && $last_element != "") {
	$id = $last_element;
}
else if(manipulateCookies("enabled")) {
	global $cookie_name;
	$id = $_COOKIE[$cookie_name];
}

if ($id != null) {
	echo "<script type='text/javascript'>loadTimeline('$id');</script>";
}
?>