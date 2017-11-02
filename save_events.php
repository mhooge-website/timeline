<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$jsonEvents = json_decode($_GET["ev"], false);
$conn = connect_db("mhso_grpro");
    
if(!($stmt_ins = $conn->prepare("INSERT INTO timeline_events(id, timeline_id, description, deadline, completed, x_coord, y_coord) VALUES (?, ?, ?, ?, ?, ?, ?)"))) {
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}
if(!($stmt_upd = $conn->prepare("UPDATE timeline_events SET description=?, deadline=?, completed=?, x_coord=?, y_coord=? 
                                         WHERE timeline_id=".$jsonEvents->timeline_id))) {
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}

$descriptions = $jsonEvents->descriptions;
$deadlines = $jsonEvents->deadlines;
$completions = $jsonEvents->completions;
$changes = $jsonEvents->changed;
$new = $jsonEvents->new;
$x = $jsonEvents->xcoords;
$y = $jsonEvents->ycoords;
for($i = 0; $i < count($descriptions); $i++) {
    if($new[$i]) {
        $zero = 0;
        if (!$stmt_ins->bind_param("isssi", $zero, $jsonEvents->timeline_id, $descriptions[$i], $deadlines[$i], $completions[$i], $x[$i], $y[$i])) {
            echo "Binding parameters failed: (" . $stmt_ins->errno . ") " . $stmt_ins->error;
        }
        
        if (!$stmt_ins->execute()) {
            echo "Execute failed: (" . $stmt_ins->errno . ") " . $stmt_ins->error;
        }
    }
    elseif($changes[$i]) {
        if (!$stmt_upd->bind_param("ssi", $descriptions[$i], $deadlines[$i], $completions[$i], $x[$i], $y[$i])) {
            echo "Binding parameters failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
        
        if (!$stmt_upd->execute()) {
            echo "Execute failed: (" . $stmt_upd->errno . ") " . $stmt_upd->error;
        }
    }
    
}
echo "All is well";
?>