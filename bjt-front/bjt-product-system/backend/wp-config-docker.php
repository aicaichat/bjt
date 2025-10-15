<?php
// Docker environment helper function
if (!function_exists("getenv_docker")) {
    function getenv_docker($env, $default) {
        $val = getenv($env);
        return $val !== false ? $val : $default;
    }
}
