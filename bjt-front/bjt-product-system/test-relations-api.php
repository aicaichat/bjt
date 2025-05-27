<?php
// 测试Relations API
echo "Testing Relations API...\n";

// 测试基本GET请求
$url = 'http://localhost:8080/wp-json/bjt/v1/relations?page=1&page_size=5';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status Code: $status\n";
echo "Response:\n";
if ($response) {
    $data = json_decode($response, true);
    if ($data) {
        echo "Success! Found " . count($data['items'] ?? []) . " items\n";
        echo "Page: " . ($data['page'] ?? 'null') . "\n";
        echo "Total: " . ($data['total'] ?? 'null') . "\n";
        if (!empty($data['items'])) {
            echo "First item host_part_number: " . $data['items'][0]['host_part_number'] . "\n";
        }
    } else {
        echo "JSON decode failed\n";
        echo $response . "\n";
    }
} else {
    echo "Request failed\n";
}
?> 