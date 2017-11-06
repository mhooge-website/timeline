<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$id = $_GET["id"];

$conn = connect_db("mhso_grpro");

if (!($stmt = $conn->prepare("SELECT id, description, deadline, completed, x_coord, y_coord FROM timeline_events WHERE timeline_id=?"))) {
    http_response_code(500);
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}

if (!$stmt->bind_param("s", $id)) {
    http_response_code(500);
    echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
}

if(!($res = $stmt->get_result())) {
    http_response_code(500);
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