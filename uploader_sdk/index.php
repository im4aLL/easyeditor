<?php
function secure_file_upload($file_name,$destination,$allowed_file_type=array('jpg', 'jpeg', 'png'),$max_upload_size=2, $uniqueName = false) {
    $max_upload_size_byte = $max_upload_size * 1024 * 1024;

    if(!is_dir($destination))
        {
            $making = mkdir($destination,0777, true);
            chmod($destination, 0777);

            if(!$making) return false;
        }

    $fileName = $file_name['name'];
    $file_type = substr($fileName, strrpos($fileName, '.') + 1);
    $file_type = strtolower($file_type);

    if( !array_search($file_type, $allowed_file_type) && !in_array($file_type, $allowed_file_type) ) return false;
    if( $file_name['size'] > $max_upload_size_byte ) return false;
    if( $file_name['error'] != 0 ) return false;

    $final_name = time()."_".preg_replace("/[^a-zA-Z0-9-_.]+/", "", $file_name['name']);

    if( $uniqueName == true ) {
        $file_detail = pathinfo($final_name);
        $final_name = md5(uniqid($file_detail['filename'], true)).'.'.strtolower($file_detail['extension']);
    }

    $final_des = $destination.$final_name;
    $uploading = move_uploaded_file($file_name['tmp_name'],$final_des);
    if( !$uploading ) return false;
    return $final_name;
}


if($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest' && isset($_POST['easyeditor-upload']) && isset($_FILES['file']) && $_FILES['file']['name'] != NULL ) {
    $originalName = $_FILES['file']['name'];
    $rootPath = 'images/';
    $fileName = secure_file_upload($_FILES['file'], $rootPath, array('jpg', 'jpeg', 'png'), 2, true);

    if( $fileName != NULL ) {
        echo $fileName;
    }
    else echo 'null';
}
else {
    echo 'null';
}
