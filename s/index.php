<?php

session_start();

error_reporting(0);

include('config.php');

$data = array();
$short_url = 'SHORT_URL';

if (isset($_POST['auth_token']) && 
    isset($_SESSION['auth_token']) && 
    $_POST['auth_token'] == $_SESSION['auth_token']) {
    $data = $_POST;
    unset($data['auth_token']);    
} else {
    die(json_encode(array('error'=>'Invalid auth token')));
}

try {
    $dbh = new PDO('mysql:host='.AST_DB_HOST.';dbname='.AST_DB_NAME,
        AST_DB_USER, AST_DB_PASS);
    $res = $dbh->prepare("INSERT INTO shaders (code, code_lzma, image)
        value (:code, :code_lzma, :image)");
    $res->execute($data);
    $dbh = null;
} catch(PDOException $e) {
    echo $e->getMessage();
    exit;
}

echo json_encode(array('short_url'=>$short_url));
exit;
