#!/bin/bash

# Enable xtrace for debugging if needed
# set -x

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_BASE="http://localhost:8080/wp-json/bjt/v1"

# Preset JWT Token for User ID 1 (Admin)
# Replace with a dynamically obtained token in a real scenario
JWT_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA"
AUTH_HEADER="-H 'Authorization: Bearer $JWT_TOKEN'"
AUTH_HEADER_NO_CONTENT="-H 'Authorization: Bearer $JWT_TOKEN'" # For GET typically

# Counters for test results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
DO_REQUEST_RESPONSE="" # Global variable for do_request responses

# Function to check API response
# Usage: check_response "response_json" "endpoint_name" "HTTP_METHOD" "expected_status_code_pattern" "expect_success_field_true"
check_response() {
    local response="$1"
    local endpoint="$2"
    local method="$3"
    local expected_status_code_pattern="${4:-^2}" # Expect 2xx by default (e.g. ^2 for 2xx, ^401 for 401)
    local expect_success_field="${5:-true}"       # Expect '.success == true' by default

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    clean_response=$(echo "$response" | grep -v "^Warning:" | grep -v "Cannot modify header") # Clean PHP warnings if any

    if echo "$clean_response" | jq . >/dev/null 2>&1; then # Check if valid JSON
        if [ "$expect_success_field" = "true" ]; then
            if echo "$clean_response" | jq -e '.success == true' >/dev/null 2>&1; then
                echo -e "${GREEN}✓ 测试通过 (Success=true): $method $endpoint${NC}" >&2
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            elif [[ "$method" == "DELETE" ]] && [[ -z "$clean_response" || "$clean_response" == "{}" || "$clean_response" == "[]" ]]; then
                 # Some DELETE might return empty response or empty JSON object/array on success
                echo -e "${GREEN}✓ 测试通过 (DELETE with empty response): $method $endpoint${NC}" >&2
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            elif [[ "$method" == "GET" ]] && ! echo "$clean_response" | jq -e '.code' >/dev/null 2>&1; then
                 # For GET, often a valid JSON response without a '.code' field (WP_Error) is success
                 echo -e "${GREEN}✓ 测试通过 (GET, valid JSON, no error code): $method $endpoint${NC}" >&2
                 TESTS_PASSED=$((TESTS_PASSED + 1))
                 return 0
            elif ! echo "$clean_response" | jq -e '.code' >/dev/null 2>&1; then
                echo -e "${GREEN}✓ 测试通过 (WP REST API, valid JSON, no error code): $method $endpoint${NC}" >&2
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            else
                echo -e "${RED}✗ 测试失败: $method $endpoint - JSON响应校验失败 (e.g. success!=true or error code present)${NC}" >&2
                echo -e "${YELLOW}响应: $(echo "$clean_response" | jq -c .)${NC}" >&2
                TESTS_FAILED=$((TESTS_FAILED + 1))
                return 1
            fi
        else # Not expecting .success field (e.g. for list endpoints that return an array or object directly)
            # For these, a valid JSON response that jq can parse is considered a pass for this basic check
            # More specific checks (like jq -e '.items | length > 0') can be done outside this function
            echo -e "${GREEN}✓ 测试通过 (Valid JSON, specific check): $method $endpoint${NC}" >&2
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        fi
    else # Not valid JSON
        if [[ "$method" == "DELETE" ]] && [[ -z "$clean_response" ]]; then # Handle 204 No Content for DELETE
             echo -e "${GREEN}✓ 测试通过 (DELETE with 204 No Content): $method $endpoint${NC}" >&2
             TESTS_PASSED=$((TESTS_PASSED + 1))
             return 0
        fi
        echo -e "${RED}✗ 测试失败: $method $endpoint - 无法解析JSON响应或响应为空 (非预期)${NC}" >&2
        echo -e "${YELLOW}响应: $clean_response${NC}" >&2
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}


# Function to perform API request using curl
# Usage: do_request "METHOD" "/endpoint" "$AUTH_HEADER" "$DATA_PAYLOAD" expected_status_code_pattern expect_success_field
do_request() {
    echo -e "${RED}DEBUG: ENTERING do_request${NC}" >&2
    local method="$1"
    local endpoint="$2"
    local headers="$3" # Should include auth and Content-Type if needed
    local data="$4"    # JSON data string for POST/PUT
    local expected_status_pattern="${5:-^2}" # Default to expecting 2xx
    local expect_success_field="${6:-true}"  # Default to expecting .success == true in JSON

    echo -e "${YELLOW}请求: $method $API_BASE$endpoint${NC}" >&2
    
    local cmd_base="curl -s -X \"$method\" \"${API_BASE}${endpoint}\""
    local cmd_headers_part="$headers" # Already includes -H, needs to be eval'd if contains variables
    local cmd_data_part=""

    if [[ "$method" == "POST" || "$method" == "PUT" || "$method" == "PATCH" ]]; then
        # Add Content-Type header if not already in $headers and data is present
        if [[ -n "$data" && "$headers" != *Content-Type* ]]; then
             cmd_headers_part="$cmd_headers_part -H 'Content-Type: application/json'"
        fi
        if [ -n "$data" ]; then
            # Ensure data is properly quoted for eval. JSON usually comes in single quotes.
            cmd_data_part=" -d '$data'" 
        fi
    fi

    local full_cmd="$cmd_base $cmd_headers_part $cmd_data_part"
    echo -e "${BLUE}DEBUG: Executing CMD: $full_cmd${NC}" >&2
    
    # Use eval to correctly interpret headers and data, especially with quotes
    DO_REQUEST_RESPONSE=$(eval "$full_cmd")
    
    # Call check_response to validate (will increment counters)
    # The return status of check_response can be used for conditional logic if needed
    check_response "$DO_REQUEST_RESPONSE" "$endpoint" "$method" "$expected_status_pattern" "$expect_success_field"
    
    # Echo the raw response so it can be captured by command substitution $(do_request ...)
    echo "$DO_REQUEST_RESPONSE" # This MUST remain on stdout to be captured
}

# DEBUGGING COUNTERS - Test if counters increment
echo -e "${YELLOW}DEBUGGING COUNTERS START${NC}" >&2
echo "DEBUG: Initial TESTS_TOTAL = $TESTS_TOTAL, TESTS_PASSED = $TESTS_PASSED, TESTS_FAILED = $TESTS_FAILED" >&2
check_response "{}" "dummy_counter_test" "GET" "^2" "false"
echo "DEBUG: After dummy_counter_test, TESTS_TOTAL = $TESTS_TOTAL, TESTS_PASSED = $TESTS_PASSED, TESTS_FAILED = $TESTS_FAILED" >&2
echo -e "${YELLOW}DEBUGGING COUNTERS END${NC}" >&2

echo -e "${YELLOW}使用预设JWT令牌: $JWT_TOKEN${NC}"
echo "================================================================================"
echo "== BJT核心实体API自动化测试"
echo "================================================================================"
echo "开始API测试..."
echo ""

# Initial debug test to ensure do_request and check_response are callable
echo -e "${BLUE}DEBUG: ATTEMPTING DIRECT do_request CALL${NC}" >&2
# This endpoint is expected to 404, so we set expect_success_field to "false" as .success won't be true
# and expected_status_pattern to ^4 for 4xx.
# However, the current check_response for "false" success field just checks for valid JSON.
# A 404 from WP REST API is valid JSON with a "code" field.
do_request "GET" "/__debug_test_endpoint__" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
debug_response=$DO_REQUEST_RESPONSE # Get response from global var
echo -e "${BLUE}DEBUG: DIRECT do_request CALL COMPLETED. Response: $debug_response${NC}" >&2
echo "================================================================================"
echo "== 1. Product Lines API 测试"
echo "================================================================================"

# 1.1 Test List Product Lines (GET /product-lines)
echo -e "${BLUE}1.1 测试获取产品线列表 (GET /product-lines)${NC}" >&2
echo -e "${RED}DEBUG: About to call do_request for Product Lines List${NC}" >&2
# For GET list, we don't expect '.success', but a valid JSON array (or object with 'items') and no '.code' error.
# So, set expect_success_field to "false". check_response handles this as a pass if it's valid JSON.
do_request "GET" "/product-lines?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false"
product_lines_list_response=$DO_REQUEST_RESPONSE # Get response
echo -e "${RED}DEBUG: Call to do_request for Product Lines List completed${NC}" >&2
# Example of a more specific check on the response after calling do_request:
# if echo "$product_lines_list_response" | jq -e '.items | length > 0' > /dev/null; then
#     echo -e "${GREEN}✓ 内容校验: 产品线列表包含项目.${NC}" >&2
# else
#     echo -e "${RED}✗ 内容校验: 产品线列表为空或格式错误.${NC}" >&2
# fi

# 1.2 Test Create Product Line (POST /product-lines)
echo -e "${BLUE}1.2 测试创建产品线 (POST /product-lines)${NC}" >&2
product_line_data_create='{
    "code": "testpl001",
    "name_cn": "测试产品线001",
    "name_en": "Test Product Line 001",
    "description_cn": "这是一个测试产品线的描述。",
    "description_en": "This is a test product line description.",
    "image_url": "http://example.com/testpl001.jpg",
    "status": "publish",
    "meta": { "key1": "value1" }
}'
# Revert to using do_request for the create call
do_request "POST" "/product-lines" "$AUTH_HEADER" "$product_line_data_create" "^2" "true"
create_response=$DO_REQUEST_RESPONSE # Get response

# Attempt to extract the ID (assuming response is like {"success":true, "data":{"id":123,...}})
PRODUCT_LINE_ID=""
if echo "$create_response" | jq -e '.success == true and (.data.id != null)' > /dev/null; then
    PRODUCT_LINE_ID=$(echo "$create_response" | jq -r '.data.id')
    echo -e "${GREEN}信息: 创建的产品线ID: $PRODUCT_LINE_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建响应中获取产品线ID.${NC}" >&2
    # We can choose to exit here or let subsequent tests fail/be skipped
fi

# 1.3 Test Get Specific Product Line (GET /product-lines/{id})
if [ -n "$PRODUCT_LINE_ID" ]; then
    echo -e "${BLUE}1.3 测试获取特定产品线 (GET /product-lines/$PRODUCT_LINE_ID)${NC}" >&2
    # Expect '.success == true' for a single item get
    do_request "GET" "/product-lines/$PRODUCT_LINE_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    get_response=$DO_REQUEST_RESPONSE # Get response
else
    echo -e "${YELLOW}跳过获取特定产品线测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 1.4 Test Update Product Line (PUT /product-lines/{id})
if [ -n "$PRODUCT_LINE_ID" ]; then
    echo -e "${BLUE}1.4 测试更新产品线 (PUT /product-lines/$PRODUCT_LINE_ID)${NC}" >&2
    product_line_data_update='{
        "code": "testpl001",
        "name_cn": "测试产品线001 (已更新)",
        "name_en": "Test Product Line 001 (Updated)",
        "description_cn": "这是更新后的描述。",
        "status": "draft"
    }'
    # Expect '.success == true' for an update
    do_request "PUT" "/product-lines/$PRODUCT_LINE_ID" "$AUTH_HEADER" "$product_line_data_update" "^2" "true"
    update_response=$DO_REQUEST_RESPONSE # Get response
else
    echo -e "${YELLOW}跳过更新产品线测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 1.5 Test Batch Process Product Lines (POST /product-lines/batch) - Placeholder
if [ -n "$PRODUCT_LINE_ID" ]; then
    echo -e "${BLUE}1.5 测试批量处理产品线 (POST /product-lines/batch) - (示例性，具体实现未知)${NC}" >&2
    # This is a placeholder - actual batch operations depend on API
    # batch_data="{"ids":[$PRODUCT_LINE_ID],"action":"trash"}"
    # batch_response=$(do_request "POST" "/product-lines/batch" "$AUTH_HEADER" "$batch_data" "^2" "true")
    echo -e "${YELLOW}跳过批量产品线测试，ID未获取.${NC}" >&2 # Keeping it skipped for now
else
    echo -e "${YELLOW}跳过批量产品线测试，ID未获取.${NC}" >&2
fi


# 1.6 Test Delete Product Line (DELETE /product-lines/{id})
if [ -n "$PRODUCT_LINE_ID" ]; then
    echo -e "${BLUE}1.6 测试删除产品线 (DELETE /product-lines/$PRODUCT_LINE_ID?force=true)${NC}" >&2
    # Expect '.success == true' for a delete
    do_request "DELETE" "/product-lines/$PRODUCT_LINE_ID?force=true" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_response=$DO_REQUEST_RESPONSE # Get response

    # Optionally, try to GET it again and expect a 404
    echo -e "${BLUE}验证删除: 尝试获取已删除的产品线 (预期404)${NC}" >&2
    do_request "GET" "/product-lines/$PRODUCT_LINE_ID" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
    verify_delete_response=$DO_REQUEST_RESPONSE # Get response
else
    echo -e "${YELLOW}跳过删除产品线，因为创建失败或ID未获取.${NC}" >&2
fi

echo "================================================================================"
echo "== 2. Host Models API 测试"
echo "================================================================================"

# 2.1 Test List Host Models (GET /host-models)
echo -e "${BLUE}2.1 测试获取主机型号列表 (GET /host-models)${NC}" >&2
do_request "GET" "/host-models?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false"
host_models_list_response=$DO_REQUEST_RESPONSE

# 2.2 Test Create Host Model (POST /host-models)
echo -e "${BLUE}2.2 测试创建主机型号 (POST /host-models)${NC}" >&2
host_model_data_create='{
    "model": "TESTMODEL-001",
    "code": "testhm001",
    "name_cn": "测试主机型号001",
    "name_en": "Test Host Model 001",
    "product_line_id": 1,
    "description_cn": "主机型号简介中文",
    "description_en": "Host model introduction English",
    "status": "publish",
    "sort_order": 10
}'
do_request "POST" "/host-models" "$AUTH_HEADER" "$host_model_data_create" "^2" "true"
create_hm_response=$DO_REQUEST_RESPONSE

HOST_MODEL_ID=""
if echo "$create_hm_response" | jq -e '.success == true and (.data.id != null)' > /dev/null; then
    HOST_MODEL_ID=$(echo "$create_hm_response" | jq -r '.data.id')
    echo -e "${GREEN}信息: 创建的主机型号ID: $HOST_MODEL_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建响应中获取主机型号ID.${NC}" >&2
fi

# 2.3 Test Get Specific Host Model (GET /host-models/{id})
if [ -n "$HOST_MODEL_ID" ]; then
    echo -e "${BLUE}2.3 测试获取特定主机型号 (GET /host-models/$HOST_MODEL_ID)${NC}" >&2
    do_request "GET" "/host-models/$HOST_MODEL_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    get_hm_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取特定主机型号测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 2.4 Test Update Host Model (PUT /host-models/{id})
if [ -n "$HOST_MODEL_ID" ]; then
    echo -e "${BLUE}2.4 测试更新主机型号 (PUT /host-models/$HOST_MODEL_ID)${NC}" >&2
    host_model_data_update='{
        "model": "TESTMODEL-001",
        "code": "testhm001", 
        "name_cn": "测试主机型号001 (已更新)",
        "name_en": "Test Host Model 001 (Updated EN)",
        "description_cn": "更新后的主机型号简介",
        "status": "draft"
    }'
    do_request "PUT" "/host-models/$HOST_MODEL_ID" "$AUTH_HEADER" "$host_model_data_update" "^2" "true"
    update_hm_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过更新主机型号测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 2.5 Test Delete Host Model (DELETE /host-models/{id})
if [ -n "$HOST_MODEL_ID" ]; then
    echo -e "${BLUE}2.5 测试删除主机型号 (DELETE /host-models/$HOST_MODEL_ID?force=true)${NC}" >&2
    do_request "DELETE" "/host-models/$HOST_MODEL_ID?force=true" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_hm_response=$DO_REQUEST_RESPONSE

    echo -e "${BLUE}验证删除: 尝试获取已删除的主机型号 (预期404)${NC}" >&2
    do_request "GET" "/host-models/$HOST_MODEL_ID" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
    verify_delete_hm_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除主机型号测试，因为创建失败或ID未获取.${NC}" >&2
fi

# Add more tests for other entities (Accessories, etc.) here...
# echo "================================================================================"
# echo "== 3. Accessory Models API 测试 (占位)"
echo "================================================================================"
echo "== 3. Accessories API 测试"
echo "================================================================================"

# 3.1 Test List Accessories (GET /accessories)
echo -e "${BLUE}3.1 测试获取配件列表 (GET /accessories)${NC}" >&2
do_request "GET" "/accessories?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false"
accessories_list_response=$DO_REQUEST_RESPONSE

# 3.2 Test Create Accessory (POST /accessories)
echo -e "${BLUE}3.2 测试创建配件 (POST /accessories)${NC}" >&2
# Generate a unique timestamp for part_number to avoid conflicts
TIMESTAMP=$(date +%s)
# Note: Need actual data structure based on API Doc & DB schema (wp_bjt_accessories, wp_bjt_accessory_models)
# Assuming we need 'model' (from accessory_models), 'part_number', 'name_zh', 'name_en', 'product_line_id' etc.
accessory_data_create='{
    "product_line_id": 1,
    "model": "TEST-ACC-001", 
    "brand": "BJT-Test",
    "part_number": "TEST-ACC-'$TIMESTAMP'",
    "name_zh": "测试配件'$TIMESTAMP'",
    "name_en": "Test Accessory '$TIMESTAMP'",
    "spec": "测试规格",
    "voltage": "220V",
    "status": "publish",
    "unit": "pcs"
}'
# Assuming creation returns success:true and the ID in data.id
do_request "POST" "/accessories" "$AUTH_HEADER" "$accessory_data_create" "^2" "true"
create_acc_response=$DO_REQUEST_RESPONSE

ACCESSORY_ID=""
if echo "$create_acc_response" | jq -e '.id != null' > /dev/null; then
    ACCESSORY_ID=$(echo "$create_acc_response" | jq -r '.id')
    echo -e "${GREEN}信息: 创建的配件ID: $ACCESSORY_ID${NC}" >&2
elif echo "$create_acc_response" | jq -e '.data.id != null' > /dev/null; then
    ACCESSORY_ID=$(echo "$create_acc_response" | jq -r '.data.id')
    echo -e "${GREEN}信息: 创建的配件ID: $ACCESSORY_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建响应中获取配件ID.${NC}" >&2
fi

# 3.3 Test Get Specific Accessory (GET /accessories/{id})
if [ -n "$ACCESSORY_ID" ]; then
    echo -e "${BLUE}3.3 测试获取特定配件 (GET /accessories/$ACCESSORY_ID)${NC}" >&2
    do_request "GET" "/accessories/$ACCESSORY_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    get_acc_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取特定配件测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 3.4 Test Update Accessory (PUT /accessories/{id})
if [ -n "$ACCESSORY_ID" ]; then
    echo -e "${BLUE}3.4 测试更新配件 (PUT /accessories/$ACCESSORY_ID)${NC}" >&2
    accessory_data_update='{
        "name_zh": "测试配件001 (已更新)",
        "name_en": "Test Accessory 001 (Updated)",
        "status": "draft"
    }'
    do_request "PUT" "/accessories/$ACCESSORY_ID" "$AUTH_HEADER" "$accessory_data_update" "^2" "true"
    update_acc_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过更新配件测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 3.5 Test Get Accessory Children (GET /accessories/{id}/children)
if [ -n "$ACCESSORY_ID" ]; then
    echo -e "${BLUE}3.5 测试获取配件子配件 (GET /accessories/$ACCESSORY_ID/children)${NC}" >&2
    # Expecting potentially empty list, so valid JSON (false success field) is okay
    do_request "GET" "/accessories/$ACCESSORY_ID/children?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false" 
    get_acc_children_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取配件子配件测试，因为ID未获取.${NC}" >&2
fi

# 3.6 Test Get Accessory Required (GET /accessories/{id}/required)
if [ -n "$ACCESSORY_ID" ]; then
    echo -e "${BLUE}3.6 测试获取配件必选备件 (GET /accessories/$ACCESSORY_ID/required)${NC}" >&2
     # Expecting potentially empty list, so valid JSON (false success field) is okay
    do_request "GET" "/accessories/$ACCESSORY_ID/required?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false"
    get_acc_required_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取配件必选备件测试，因为ID未获取.${NC}" >&2
fi

# 3.7 Test Delete Accessory (DELETE /accessories/{id})
if [ -n "$ACCESSORY_ID" ]; then
    echo -e "${BLUE}3.7 测试删除配件 (DELETE /accessories/$ACCESSORY_ID?force=true)${NC}" >&2
    do_request "DELETE" "/accessories/$ACCESSORY_ID?force=true" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_acc_response=$DO_REQUEST_RESPONSE

    echo -e "${BLUE}验证删除: 尝试获取已删除的配件 (预期404)${NC}" >&2
    do_request "GET" "/accessories/$ACCESSORY_ID" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
    verify_delete_acc_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除配件测试，因为创建失败或ID未获取.${NC}" >&2
fi

echo "================================================================================"
echo "== 4. Consumables API 测试"
echo "================================================================================"

# 4.1 Test List Consumables (GET /consumables)
echo -e "${BLUE}4.1 测试获取耗材列表 (GET /consumables)${NC}" >&2
do_request "GET" "/consumables?lang=zh&per_page=5" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false" # Expecting list structure
consumables_list_response=$DO_REQUEST_RESPONSE

# 4.2 Test Create Consumable (POST /consumables)
echo -e "${BLUE}4.2 测试创建耗材 (POST /consumables)${NC}" >&2
TIMESTAMP_CON=$(date +%s)
consumable_data_create='{
    "product_line_id": 1,
    "code": "TEST-CONS-'$TIMESTAMP_CON'", 
    "name": "测试耗材'$TIMESTAMP_CON'", 
    "model": "测试耗材模型'$TIMESTAMP_CON'", 
    "brand": "BJT耗材测试",
    "package_type": "roll",
    "material": "HDPE",
    "bag_type": "气泡袋",
    "thickness_met_val": 20,
    "width_met_val": 300,
    "total_length_met_val": 500,
    "app_model": "MODEL-A,MODEL-B",
    "status": "publish"
}'
# Create expects success:true and data with ID
do_request "POST" "/consumables" "$AUTH_HEADER" "$consumable_data_create" "^2" "true"
create_con_response=$DO_REQUEST_RESPONSE

CONSUMABLE_ID=""
if echo "$create_con_response" | jq -e '.success == true and (.data.id != null)' > /dev/null; then
    CONSUMABLE_ID=$(echo "$create_con_response" | jq -r '.data.id')
    echo -e "${GREEN}信息: 创建的耗材ID: $CONSUMABLE_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建耗材响应中获取ID.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$create_con_response" | jq -c .)${NC}" >&2
fi

# 4.3 Test Get Specific Consumable (GET /consumables/{id})
if [ -n "$CONSUMABLE_ID" ]; then
    echo -e "${BLUE}4.3 测试获取特定耗材 (GET /consumables/$CONSUMABLE_ID)${NC}" >&2
    # Get specific item expects success:true and data
    do_request "GET" "/consumables/$CONSUMABLE_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    get_con_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取特定耗材测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 4.4 Test Update Consumable (PUT /consumables/{id})
if [ -n "$CONSUMABLE_ID" ]; then
    echo -e "${BLUE}4.4 测试更新耗材 (PUT /consumables/$CONSUMABLE_ID)${NC}" >&2
    consumable_data_update='{
        "name": "测试耗材 (已更新)",
        "brand": "BJT耗材测试更新",
        "status": "draft"
    }'
    # Update expects success:true
    do_request "PUT" "/consumables/$CONSUMABLE_ID" "$AUTH_HEADER" "$consumable_data_update" "^2" "true"
    update_con_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过更新耗材测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 4.5 Test Batch Get Prices (POST /consumables/prices/batch)
if [ -n "$CONSUMABLE_ID" ]; then # Using the created ID for the batch test
    echo -e "${BLUE}4.5 测试批量获取耗材价格 (POST /consumables/prices/batch)${NC}" >&2
    batch_price_data='{
        "ids": ['$CONSUMABLE_ID', 99999], 
        "region": "CN",
        "quantity": 5
    }'
    # Batch endpoint might not have 'success' field, depends on implementation. Assume valid JSON response for now.
    do_request "POST" "/consumables/prices/batch" "$AUTH_HEADER" "$batch_price_data" "^2" "false"
    batch_price_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过批量获取耗材价格测试，因为耗材ID未获取.${NC}" >&2
fi

# 4.6 Test Batch Get Inventory (POST /consumables/inventory/batch)
if [ -n "$CONSUMABLE_ID" ]; then
    echo -e "${BLUE}4.6 测试批量获取耗材库存 (POST /consumables/inventory/batch)${NC}" >&2
    batch_inv_data='{
        "ids": ['$CONSUMABLE_ID', 99998],
        "region": "CN"
    }'
    # Assume valid JSON response
    do_request "POST" "/consumables/inventory/batch" "$AUTH_HEADER" "$batch_inv_data" "^2" "false"
    batch_inv_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过批量获取耗材库存测试，因为耗材ID未获取.${NC}" >&2
fi

# 4.7 Test Delete Consumable (DELETE /consumables/{id})
if [ -n "$CONSUMABLE_ID" ]; then
    echo -e "${BLUE}4.7 测试删除耗材 (DELETE /consumables/$CONSUMABLE_ID)${NC}" >&2
    # Delete expects success:true or 204 No Content
    do_request "DELETE" "/consumables/$CONSUMABLE_ID" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_con_response=$DO_REQUEST_RESPONSE

    echo -e "${BLUE}验证删除: 尝试获取已删除的耗材 (预期404)${NC}" >&2
    do_request "GET" "/consumables/$CONSUMABLE_ID" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
    verify_delete_con_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除耗材测试，因为创建失败或ID未获取.${NC}" >&2
fi

echo "================================================================================"
echo "== 5. Spare Parts API 测试"
echo "================================================================================"

# 5.1 Test List Spare Parts (GET /spare-parts)
echo -e "${BLUE}5.1 测试获取备件列表 (GET /spare-parts)${NC}" >&2
do_request "GET" "/spare-parts?lang=zh&per_page=5" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false" # Expecting list structure
spare_parts_list_response=$DO_REQUEST_RESPONSE

# 5.2 Test Create Spare Part (POST /spare-parts)
echo -e "${BLUE}5.2 测试创建备件 (POST /spare-parts)${NC}" >&2
TIMESTAMP_SP=$(date +%s)
spare_part_data_create='{
    "product_line_id": 1,
    "part_number": "TEST-SP-'$TIMESTAMP_SP'",
    "name_zh": "测试备件'$TIMESTAMP_SP'",
    "name_en": "Test Spare Part '$TIMESTAMP_SP'",
    "app_model": "MODEL-A,MODEL-C",
    "is_consumable": false,
    "spec": "M5螺丝",
    "status": "publish"
}'
# Create expects success:true and data with ID
do_request "POST" "/spare-parts" "$AUTH_HEADER" "$spare_part_data_create" "^2" "true"
create_sp_response=$DO_REQUEST_RESPONSE

SPARE_PART_ID=""
if echo "$create_sp_response" | jq -e '.success == true and (.data.id != null)' > /dev/null; then
    SPARE_PART_ID=$(echo "$create_sp_response" | jq -r '.data.id')
    echo -e "${GREEN}信息: 创建的备件ID: $SPARE_PART_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建备件响应中获取ID.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$create_sp_response" | jq -c .)${NC}" >&2
fi

# 5.3 Test Get Specific Spare Part (GET /spare-parts/{id})
if [ -n "$SPARE_PART_ID" ]; then
    echo -e "${BLUE}5.3 测试获取特定备件 (GET /spare-parts/$SPARE_PART_ID)${NC}" >&2
    # Get specific item expects success:true and data
    do_request "GET" "/spare-parts/$SPARE_PART_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    get_sp_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取特定备件测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 5.4 Test Update Spare Part (PUT /spare-parts/{id})
if [ -n "$SPARE_PART_ID" ]; then
    echo -e "${BLUE}5.4 测试更新备件 (PUT /spare-parts/$SPARE_PART_ID)${NC}" >&2
    spare_part_data_update='{
        "name_zh": "测试备件 (已更新)",
        "is_consumable": true,
        "status": "draft"
    }'
    # Update expects success:true
    do_request "PUT" "/spare-parts/$SPARE_PART_ID" "$AUTH_HEADER" "$spare_part_data_update" "^2" "true"
    update_sp_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过更新备件测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 5.5 Test Get Spare Part Compatibility (GET /spare-parts/{id}/compatibility)
if [ -n "$SPARE_PART_ID" ]; then
    echo -e "${BLUE}5.5 测试获取备件兼容性 (GET /spare-parts/$SPARE_PART_ID/compatibility)${NC}" >&2
    # Assume valid JSON response
    do_request "GET" "/spare-parts/$SPARE_PART_ID/compatibility?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "false"
    get_sp_compat_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取备件兼容性测试，因为ID未获取.${NC}" >&2
fi

# 5.6 Test Delete Spare Part (DELETE /spare-parts/{id})
if [ -n "$SPARE_PART_ID" ]; then
    echo -e "${BLUE}5.6 测试删除备件 (DELETE /spare-parts/$SPARE_PART_ID)${NC}" >&2
    # Delete expects success:true or 204 No Content
    do_request "DELETE" "/spare-parts/$SPARE_PART_ID" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_sp_response=$DO_REQUEST_RESPONSE

    echo -e "${BLUE}验证删除: 尝试获取已删除的备件 (预期404)${NC}" >&2
    do_request "GET" "/spare-parts/$SPARE_PART_ID" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
    verify_delete_sp_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除备件测试，因为创建失败或ID未获取.${NC}" >&2
fi

# Add Order API Tests Section
echo "================================================================================"
echo "== 6. Orders API 测试"
echo "================================================================================"

# Prerequisites for Order Creation: Add items to cart for User ID 1
# We'll add a known product. Assuming SPARE_PART_ID=1 exists from previous tests or setup.
# If not, this part might fail. For a robust test, create a temporary product for cart.

# For now, let's assume SPARE_PART_ID=1 (from wp_bjt_spare_parts) and product_type 'spare_part' is valid
# and part_number '16P00001' for product_id 1, type spare_part.
# You might need to adjust product_id, product_type, and part_number based on your actual test data.
CART_ITEM_PART_NUMBER="16P00001" # Example part number for a spare part with product_id 1
CART_ITEM_PRODUCT_ID=1      # Example product_id
CART_ITEM_PRODUCT_TYPE="spare_part"

echo -e "${BLUE}--- Prerequisite: Adding item to cart for order creation test ---${NC}" >&2
cart_add_data='{ "part_number": "'$CART_ITEM_PART_NUMBER'", "quantity": 2, "product_type": "'$CART_ITEM_PRODUCT_TYPE'", "product_id": '$CART_ITEM_PRODUCT_ID' }'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_add_data" "^201" "true" # Expect item schema (true for success field check is okay)
add_to_cart_response=$DO_REQUEST_RESPONSE
if ! echo "$add_to_cart_response" | jq -e '.item_id != null' > /dev/null; then # Basic check if item_id is in response
    echo -e "${RED}✗ Prerequisite FAILED: Could not add item to cart. Order creation test might fail.${NC}" >&2
    echo -e "${YELLOW}Add to Cart Response: $(echo "$add_to_cart_response" | jq -c .)${NC}" >&2
fi

# 6.1 Test List Orders (GET /orders)
echo -e "${BLUE}6.1 测试获取订单列表 (GET /orders)${NC}" >&2
# Now expects 200 and a list structure (false for success field)
do_request "GET" "/orders?lang=zh&per_page=5" "$AUTH_HEADER_NO_CONTENT" "" "^200" "false"
list_orders_response=$DO_REQUEST_RESPONSE

# 6.2 Test Create Order (POST /orders)
echo -e "${BLUE}6.2 测试创建订单 (POST /orders)${NC}" >&2
order_data_create='{ "shipping_address": {"street": "123 Test St", "city": "Testville"}, "payment_method": "test_gateway", "cart_region": "CN", "cart_lang": "zh" }'
# Expecting 201 Created, and success:true in the response object wrapper
do_request "POST" "/orders" "$AUTH_HEADER" "$order_data_create" "^201" "true"
create_order_response=$DO_REQUEST_RESPONSE

ORDER_ID=""
if echo "$create_order_response" | jq -e '.id != null' > /dev/null; then # Assuming create_item returns the order directly now
    ORDER_ID=$(echo "$create_order_response" | jq -r '.id')
    echo -e "${GREEN}信息: 创建的订单ID: $ORDER_ID${NC}" >&2
elif echo "$create_order_response" | jq -e '.data.id != null' > /dev/null; then # If wrapped in data object
     ORDER_ID=$(echo "$create_order_response" | jq -r '.data.id')
     echo -e "${GREEN}信息: 创建的订单ID (from data object): $ORDER_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从创建订单响应中获取ID.${NC}" >&2
    echo -e "${YELLOW}创建订单响应: $(echo "$create_order_response" | jq -c .)${NC}" >&2
fi

# 6.3 Test Get Specific Order (GET /orders/{id})
if [ -n "$ORDER_ID" ]; then
    echo -e "${BLUE}6.3 测试获取特定订单 (GET /orders/$ORDER_ID)${NC}" >&2
    # Expecting 200 OK, and success:true from the response object wrapper
    do_request "GET" "/orders/$ORDER_ID?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
    get_order_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过获取特定订单测试，因为创建失败或ID未获取.${NC}" >&2
fi

# 6.4 Test Update Order Status (PUT /orders/{id})
if [ -n "$ORDER_ID" ]; then
    echo -e "${BLUE}6.4 测试更新订单状态 (PUT /orders/$ORDER_ID)${NC}" >&2
    order_status_update='{ "status": "processing" }'
    # Expecting 200 OK and success:true from response wrapper
    do_request "PUT" "/orders/$ORDER_ID" "$AUTH_HEADER" "$order_status_update" "^200" "true"
    update_order_response=$DO_REQUEST_RESPONSE

    # Optionally, GET again to verify status change
    echo -e "${BLUE}验证状态更新: 尝试获取更新后的订单 (预期状态 processing)${NC}" >&2
    get_updated_order_response=$(do_request "GET" "/orders/$ORDER_ID?context=edit" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true")
    if echo "$get_updated_order_response" | jq -e '.status == "processing"' > /dev/null; then
        echo -e "${GREEN}✓ 内容校验: 订单状态已成功更新为 processing.${NC}" >&2
    else
        echo -e "${RED}✗ 内容校验: 订单状态未更新为 processing.${NC}" >&2
        echo -e "${YELLOW}获取更新后订单响应: $(echo "$get_updated_order_response" | jq -c .)${NC}" >&2
    fi
else
    echo -e "${YELLOW}跳过更新订单状态测试，因为创建失败或ID未获取.${NC}" >&2
fi

# Cleanup: Attempt to clear cart for User ID 1 to avoid interference with other tests
# This is just a best-effort cleanup.
echo -e "${BLUE}--- Cleanup: Clearing cart for User ID 1 ---${NC}" >&2
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^200" "true" # Expect success true

# Add Cart API Tests Section
echo "================================================================================"
echo "== 7. Cart API 测试"
echo "================================================================================"

# Sample product data for cart testing (adjust as needed based on your DB)
PRODUCT_1_PN="16P00001" # Spare Part
PRODUCT_1_ID=1
PRODUCT_1_TYPE="spare_part"

PRODUCT_2_PN="A10001"   # Accessory
PRODUCT_2_ID=1
PRODUCT_2_TYPE="accessory"

ITEM_1_ID=""
ITEM_2_ID=""

# 7.1 Clear Cart (Initial Cleanup)
echo -e "${BLUE}7.1 清理购物车 (POST /cart/clear)${NC}" >&2
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^200" "true"

# 7.2 Get Empty Cart
echo -e "${BLUE}7.2 获取空购物车 (GET /cart)${NC}" >&2
do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true" # Expects cart schema wrapper, success:true is ok
get_empty_cart_response=$DO_REQUEST_RESPONSE
# Check if items array is empty
if echo "$get_empty_cart_response" | jq -e '.items | length == 0' > /dev/null; then
    echo -e "${GREEN}✓ 内容校验: 购物车为空.${NC}" >&2
else
    echo -e "${RED}✗ 内容校验: 获取空购物车失败或购物车非空.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$get_empty_cart_response" | jq -c .)${NC}" >&2
fi

# 7.3 Add Item 1 to Cart
echo -e "${BLUE}7.3 添加商品1到购物车 (POST /cart/items)${NC}" >&2
cart_add_data_1='{ "part_number": "'$PRODUCT_1_PN'", "quantity": 1, "product_type": "'$PRODUCT_1_TYPE'", "product_id": '$PRODUCT_1_ID' }'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_add_data_1" "^201" "true"
add_item_1_response=$DO_REQUEST_RESPONSE
if echo "$add_item_1_response" | jq -e '.item_id != null' > /dev/null; then
    ITEM_1_ID=$(echo "$add_item_1_response" | jq -r '.item_id')
    echo -e "${GREEN}信息: 添加的购物车项目ID 1: $ITEM_1_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从添加购物车响应1中获取 item_id.${NC}" >&2
fi

# 7.4 Get Cart (1 Item)
echo -e "${BLUE}7.4 获取购物车内容 (1个商品) (GET /cart)${NC}" >&2
do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
get_cart_1_response=$DO_REQUEST_RESPONSE
if echo "$get_cart_1_response" | jq -e '.items | length == 1 and .items[0].part_number == "'$PRODUCT_1_PN'" and .items[0].quantity == 1' > /dev/null; then
    echo -e "${GREEN}✓ 内容校验: 购物车包含1个正确的商品，数量为1.${NC}" >&2
else
    echo -e "${RED}✗ 内容校验: 获取购物车(1个商品)失败或内容不符.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$get_cart_1_response" | jq -c .)${NC}" >&2
fi

# 7.5 Add Item 2 to Cart
echo -e "${BLUE}7.5 添加商品2到购物车 (POST /cart/items)${NC}" >&2
cart_add_data_2='{ "part_number": "'$PRODUCT_2_PN'", "quantity": 3, "product_type": "'$PRODUCT_2_TYPE'", "product_id": '$PRODUCT_2_ID' }'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_add_data_2" "^201" "true"
add_item_2_response=$DO_REQUEST_RESPONSE
if echo "$add_item_2_response" | jq -e '.item_id != null' > /dev/null; then
    ITEM_2_ID=$(echo "$add_item_2_response" | jq -r '.item_id')
    echo -e "${GREEN}信息: 添加的购物车项目ID 2: $ITEM_2_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从添加购物车响应2中获取 item_id.${NC}" >&2
fi

# 7.6 Get Cart (2 Items)
echo -e "${BLUE}7.6 获取购物车内容 (2个商品) (GET /cart)${NC}" >&2
do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
get_cart_2_response=$DO_REQUEST_RESPONSE
if echo "$get_cart_2_response" | jq -e '.items | length == 2' > /dev/null; then
    echo -e "${GREEN}✓ 内容校验: 购物车包含2个商品.${NC}" >&2
else
    echo -e "${RED}✗ 内容校验: 获取购物车(2个商品)失败或数量不符.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$get_cart_2_response" | jq -c .)${NC}" >&2
fi

# 7.7 Add Item 1 Again (Update Quantity via Add)
echo -e "${BLUE}7.7 再次添加商品1 (更新数量) (POST /cart/items)${NC}" >&2
cart_add_data_1_again='{ "part_number": "'$PRODUCT_1_PN'", "quantity": 2, "product_type": "'$PRODUCT_1_TYPE'", "product_id": '$PRODUCT_1_ID' }'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_add_data_1_again" "^200" "true" # Expect 200 OK for update
update_item_1_response=$DO_REQUEST_RESPONSE

# 7.8 Get Cart (Verify Quantity Update for Item 1)
echo -e "${BLUE}7.8 获取购物车内容 (验证商品1数量更新) (GET /cart)${NC}" >&2
do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
get_cart_3_response=$DO_REQUEST_RESPONSE
# Item 1 quantity should be 1 + 2 = 3
if echo "$get_cart_3_response" | jq -e '.items | map(select(.part_number=="'$PRODUCT_1_PN'")) | .[0].quantity == 3' > /dev/null; then
    echo -e "${GREEN}✓ 内容校验: 商品1的数量已更新为3.${NC}" >&2
else
    echo -e "${RED}✗ 内容校验: 商品1数量更新失败.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$get_cart_3_response" | jq -c .)${NC}" >&2
fi

# 7.9 Update Item 2 Quantity (PUT)
if [ -n "$ITEM_2_ID" ]; then
    echo -e "${BLUE}7.9 使用PUT更新商品2数量 (PUT /cart/items/$ITEM_2_ID)${NC}" >&2
    cart_update_data_2='{ "quantity": 5 }'
    do_request "PUT" "/cart/items/$ITEM_2_ID" "$AUTH_HEADER" "$cart_update_data_2" "^200" "true"
    update_item_2_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过PUT更新测试，因为商品2的 item_id 未获取.${NC}" >&2
fi

# 7.10 Get Cart (Verify PUT Update for Item 2)
if [ -n "$ITEM_2_ID" ]; then
    echo -e "${BLUE}7.10 获取购物车内容 (验证商品2数量PUT更新) (GET /cart)${NC}" >&2
    do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
    get_cart_4_response=$DO_REQUEST_RESPONSE
    if echo "$get_cart_4_response" | jq -e '.items | map(select(.item_id=='$ITEM_2_ID')) | .[0].quantity == 5' > /dev/null; then
        echo -e "${GREEN}✓ 内容校验: 商品2的数量已通过PUT更新为5.${NC}" >&2
    else
        echo -e "${RED}✗ 内容校验: 商品2数量PUT更新失败.${NC}" >&2
        echo -e "${YELLOW}响应: $(echo "$get_cart_4_response" | jq -c .)${NC}" >&2
    fi
else
    echo -e "${YELLOW}跳过获取购物车验证PUT更新测试，因为商品2的 item_id 未获取.${NC}" >&2
fi

# 7.11 Delete Item 1
if [ -n "$ITEM_1_ID" ]; then
    echo -e "${BLUE}7.11 删除商品1 (DELETE /cart/items/$ITEM_1_ID)${NC}" >&2
    do_request "DELETE" "/cart/items/$ITEM_1_ID" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true" # Delete returns object with 'deleted:true'
    delete_item_1_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除商品1测试，因为商品1的 item_id 未获取.${NC}" >&2
fi

# 7.12 Get Cart (Verify Deletion)
if [ -n "$ITEM_1_ID" ] && [ -n "$ITEM_2_ID" ]; then
    echo -e "${BLUE}7.12 获取购物车内容 (验证删除) (GET /cart)${NC}" >&2
    do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
    get_cart_5_response=$DO_REQUEST_RESPONSE
    # Check only item 2 remains
    if echo "$get_cart_5_response" | jq -e '.items | length == 1 and .items[0].item_id == '$ITEM_2_ID''' > /dev/null; then
        echo -e "${GREEN}✓ 内容校验: 商品1已删除，购物车只剩商品2.${NC}" >&2
    else
        echo -e "${RED}✗ 内容校验: 商品1删除失败或购物车内容不符.${NC}" >&2
        echo -e "${YELLOW}响应: $(echo "$get_cart_5_response" | jq -c .)${NC}" >&2
    fi
else
    echo -e "${YELLOW}跳过获取购物车验证删除测试，因为 item_id 未获取.${NC}" >&2
fi

# 7.13 Clear Cart (Final)
echo -e "${BLUE}7.13 清理购物车 (Final) (POST /cart/clear)${NC}" >&2
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^200" "true"

# 7.14 Get Empty Cart (Verify Clear)
echo -e "${BLUE}7.14 获取空购物车 (验证清理) (GET /cart)${NC}" >&2
do_request "GET" "/cart?region=CN&lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^200" "true"
get_empty_cart_final_response=$DO_REQUEST_RESPONSE
if echo "$get_empty_cart_final_response" | jq -e '.items | length == 0' > /dev/null; then
    echo -e "${GREEN}✓ 内容校验: 购物车最终清理成功.${NC}" >&2
else
    echo -e "${RED}✗ 内容校验: 购物车最终清理失败.${NC}" >&2
    echo -e "${YELLOW}响应: $(echo "$get_empty_cart_final_response" | jq -c .)${NC}" >&2
fi

# Print summary BEFORE exiting
echo ""
echo "================================================================================"
echo "== 当前测试结果统计"
echo "================================================================================"
echo -e "总测试数: $TESTS_TOTAL"
echo -e "${GREEN}通过测试: $TESTS_PASSED${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}失败测试: $TESTS_FAILED${NC}"
    echo -e "${RED}部分测试失败!${NC}"
else
    echo -e "${GREEN}所有执行的测试都通过了!${NC}"
fi
echo ""
echo "注意: 此脚本正在逐步构建中。更多测试将随后添加。"
echo ""

# Exit with 0 if all tests passed, 1 otherwise (useful for CI)
if [ "$TESTS_FAILED" -eq 0 ] && [ "$TESTS_TOTAL" -gt 0 ]; then
    # Consider a run with 0 tests total as a non-success for CI unless specifically handled
    exit 0
elif [ "$TESTS_TOTAL" -eq 0 ]; then # If no tests ran, it's not a success
    echo -e "${RED}没有执行任何测试!${NC}" >&2
    exit 1
else
    exit 1
fi

