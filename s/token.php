<?php

session_start();

$_SESSION['auth_token'] = uniqid(md5(microtime()), true);

echo json_encode(array( 'token' => $_SESSION['auth_token'] ));

exit;
