<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$jsonEvents = json_decode($_GET["ev"], false);
$conn = connect_db("mhso_grpro");

if(count($jsonEvents->ids) == 0) {
    echo "empty";
    return;
}

if(!($stmt_ins = $conn->prepare("INSERT INTO timeline_events(timeline_id, description, deadline, completed, minimized, x_coord, y_coord) 
    VALUES (?, ?, ?, ?, ?, ?, ?)"))) {
    http_response_code(500);
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}
if(!($stmt_upd = $conn->prepare("UPDATE timeline_events SET description=?, deadline=?, completed=?, minimized=?, x_coord=?, y_coord=? WHERE id=?"))) {
    http_response_code(500);
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}
if(!($stmt_del = $conn->prepare("DELETE FROM timeline_events WHERE id=?"))) {
    http_response_code(500);
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}

$ids = $jsonEvents->ids;
$descriptions = $jsonEvents->descriptions;
$deadlines = $jsonEvents->deadlines;
$completions = $jsonEvents->completions;
$statuses = $jsonEvents->statuses;
$minimizes = $jsonEvents->minimizes;
$x = $jsonEvents->xcoords;
$y = $jsonEvents->ycoords;
for($i = 0; $i < count($ids); $i++) {
    if($statuses[$i] == "ajour" || $statuses[$i] == "invalid") continue;
    elseif($ids[$i] < 0) {
        if (!$stmt_ins->bind_param("sssiiii", $jsonEvents->timeline_id, $descriptions[$i], $deadlines[$i], $completions[$i], $minimizes[$i], $x[$i], $y[$i])) {
            http_response_code(500);
            echo "Binding parameters failed: (" . $stmt_ins->errno . ") " . $stmt_ins->error;
        }
        
        if (!$stmt_ins->execute()) {
            http_response_code(500);
            echo "Execute failed: (" . $stmt_ins->errno . ") " . $stmt_ins->error;
        }
        $ids[$i] = mysqli_insert_id($conn);
        
    }
    elseif($statuses[$i] == "changed") {
        if (!$stmt_upd->bind_param("ssiiiii", $descriptions[$i], $deadlines[$i], $completions[$i], $minimizes[$i], $x[$i], $y[$i], $ids[$i])) {
            http_response_code(500);
            echo "Binding parameters failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
        
        if (!$stmt_upd->execute()) {
            http_response_code(500);
            echo "Execute failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
    }
    elseif($statuses[$i] == "delete") {
        if (!$stmt_del->bind_param("i", $ids[$i])) {
            http_response_code(500);
            echo "Binding parameters failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
        
        if (!$stmt_del->execute()) {
            http_response_code(500);
            echo "Execute failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
    }
}
echo json_encode($ids);
?>