<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$id = $_GET["id"];

$conn = connect_db("mhso_grpro");

if (!($stmt = $conn->prepare("SELECT id, description, deadline, completed, x_coord, y_coord FROM timeline_events WHERE timeline_id=?"))) {
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}

if (!$stmt->bind_param("s", $id)) {
    echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
}

if (!$stmt->execute()) {
    echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
}

if(!($res = $stmt->get_result())) {
    echo "Could not get results: (" . $stmt->errno . ") " . $stmt->error;
}
if($res->num_rows == 0) {
    echo "empty";
}
else {
    $val = $res->fetch_all();
    echo json_encode($val);
}
?>