<?php
header("Content-Type: application/json; charset=UTF-8");
include('../../scripts/connect_db.php');

$id = $_GET["id"];
$conn = connect_db("mhso_grpro");

if (!($stmt = $conn->prepare("SELECT start_date, end_date, name FROM timelines WHERE id=?"))) {
    echo "Prepare failed: (" . $conn->errno . ") " . $conn->error;
}

if (!$stmt->bind_param("s", $id)) {
    echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error;
}

if (!$stmt->execute()) {
    echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
}

if(!($res = $stmt->get_result())) {

}

if($res->num_rows == 0) {
    echo "empty";
}
else {
    $val = $res->fetch_all();
    echo json_encode($val);
}
?>