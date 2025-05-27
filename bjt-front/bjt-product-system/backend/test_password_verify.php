<?php
// Test password verification
$password = 'password123';
$hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

echo "Testing password verification:\n";
echo "Password: " . $password . "\n";
echo "Hash: " . $hash . "\n";
echo "Verification result: " . (password_verify($password, $hash) ? 'SUCCESS' : 'FAILED') . "\n";

// Test with different passwords
$test_passwords = ['password123', 'password', 'admin', 'test'];
foreach ($test_passwords as $test_pass) {
    $result = password_verify($test_pass, $hash);
    echo "Testing '$test_pass': " . ($result ? 'SUCCESS' : 'FAILED') . "\n";
}

// Generate a new hash for password123
$new_hash = password_hash('password123', PASSWORD_DEFAULT);
echo "\nNew hash for 'password123': " . $new_hash . "\n";
echo "Verification with new hash: " . (password_verify('password123', $new_hash) ? 'SUCCESS' : 'FAILED') . "\n";
?> 