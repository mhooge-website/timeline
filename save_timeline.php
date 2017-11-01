<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$jsonTimeline = json_decode($_GET["tl"], false);
$conn = connect_db("mhso_grpro");
if($jsonTimeline->id == null) insertValues();
else updateValues();

function insertValues() {
    global $conn, $jsonTimeline;
    if (!($stmt = $conn->prepare("INSERT INTO timelines(id, start_date, end_date) VALUES (?, ?, ?)"))) {
        echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
    }
    $bytes = random_bytes(24);
    $id = bin2hex($bytes);
    if (!$stmt->bind_param("sss", $id, $jsonTimeline->startDate, $jsonTimeline->endDate)) {
        echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
    }
    
    if (!$stmt->execute()) {
        echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
    }

    if (!($stmt = $conn->prepare("INSERT INTO timeline_events(timeline_id, description, deadline, completed) VALUES (?, ?, ? ,?)"))) {
        echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
    }

    echo $id;
}

function updateValues() {

}
?>