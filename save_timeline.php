<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$jsonTimeline = json_decode($_GET["tl"], false);
$conn = connect_db("mhso_grpro");
if($jsonTimeline->id == null) insertValues();
else updateValues();

function insertValues() {
    global $conn, $jsonTimeline;
    if (!($stmt = $conn->prepare("INSERT INTO timelines(id, start_date, end_date, name) VALUES (?, ?, ?, ?)"))) {
        echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
    }
    $bytes = random_bytes(12);
    $id = bin2hex($bytes);
    if (!$stmt->bind_param("ssss", $id, $jsonTimeline->startDate, $jsonTimeline->endDate, $jsonTimeline->name)) {
        echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
    }
    
    if (!$stmt->execute()) {
        echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
    }

    echo $id;
}

function updateValues() {
    global $conn, $jsonTimeline;
    if (!($stmt = $conn->prepare("UPDATE timelines SET start_date=?, end_date=?, name=? WHERE id=?"))) {
        echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
    }
    
    if (!$stmt->bind_param("ssss", $jsonTimeline->startDate, $jsonTimeline->endDate, $jsonTimeline->name, $jsonTimeline->id)) {
        echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
    }
    
    if (!$stmt->execute()) {
        echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
    }
    echo "all good";
}
?>