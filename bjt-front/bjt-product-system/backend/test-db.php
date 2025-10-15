<?php
// Test database connection
$host = "mysql";
$user = "wordpress";
$pass = "wordpress";
$db = "bjt_product";

echo "Testing database connection...\n";

// Test mysqli connection
$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error) {
    echo "MySQLi connection failed: " . $mysqli->connect_error . "\n";
} else {
    echo "MySQLi connection successful!\n";
    $result = $mysqli->query("SELECT COUNT(*) as count FROM wp_posts");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "Posts count: " . $row["count"] . "\n";
    }
    $mysqli->close();
}

// Test PDO connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    echo "PDO connection successful!\n";
} catch (PDOException $e) {
    echo "PDO connection failed: " . $e->getMessage() . "\n";
}
?>
