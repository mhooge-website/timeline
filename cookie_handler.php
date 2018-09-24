<?php

$cookie_name = "auto-load";

function manipulateCookies($action, $val=null) {
    global $cookie_name;
    if ($action == "enabled") {
        return isset($_COOKIE[$cookie_name]);
    }
    else if ($action == "set") {
        setcookie($cookie_name, $val, time()+60*60*24*30);
        return "cookie set";
    }
    else if ($action == "delete") {
        unset($_COOKIE[$cookie_name]);
        setcookie($cookie_name, null, -1);
        return "cookie deleted";
    }
}

if (isset($_POST["action"])) {
    $json = $_POST["action"];
    $json = json_decode($json);
    $val = null;
    if ($json->action == "set") $val = $json->val;
    echo json_encode(manipulateCookies($json->action, $val));
}
?>