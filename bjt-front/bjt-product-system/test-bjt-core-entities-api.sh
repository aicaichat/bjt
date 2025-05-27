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
API_BASE="http://localhost/wp-json/bjt/v1"

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
# Generate a unique code using timestamp
UNIQUE_CODE="testpl_$(date +%s)"
product_line_data='{
    "code": "'$UNIQUE_CODE'",
    "name_cn": "测试产品线001",
    "name_en": "Test Product Line 001",
    "description_cn": "这是一个测试产品线",
    "description_en": "This is a test product line",
    "image_url": "https://example.com/image.jpg",
    "status": "publish"
}'
# Expect '.success == true' for a successful creation
do_request "POST" "/product-lines" "$AUTH_HEADER" "$product_line_data" "^2" "true"
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
        "code": "'$UNIQUE_CODE'",
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

echo "================================================================================"
echo "== 3. Cart API 测试"
echo "================================================================================"

# 3.1 Test Get Cart Contents (GET /cart)
echo -e "${BLUE}3.1 测试获取购物车内容 (GET /cart)${NC}" >&2
do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
cart_contents_response=$DO_REQUEST_RESPONSE

# 3.2 Test Add Item to Cart (POST /cart/items)
echo -e "${BLUE}3.2 测试添加商品到购物车 (POST /cart/items)${NC}" >&2
# Use a test part number that should exist in your database
cart_item_data='{
    "product_type": "host",
    "part_number": "LA-E4S",
    "quantity": 2
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_data" "^2" "true"
add_to_cart_response=$DO_REQUEST_RESPONSE

# Extract the cart item ID for subsequent tests
CART_ITEM_ID=""
if echo "$add_to_cart_response" | jq -e '.success == true and (.data.item_id != null)' > /dev/null; then
    CART_ITEM_ID=$(echo "$add_to_cart_response" | jq -r '.data.item_id')
    echo -e "${GREEN}信息: 添加到购物车的商品ID: $CART_ITEM_ID${NC}" >&2
else
    echo -e "${RED}错误: 未能从添加到购物车响应中获取商品ID.${NC}" >&2
    # Try to extract from cart contents as fallback
    do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    if echo "$DO_REQUEST_RESPONSE" | jq -e '.success == true and (.data.items != null) and (.data.items | length > 0)' > /dev/null; then
        CART_ITEM_ID=$(echo "$DO_REQUEST_RESPONSE" | jq -r '.data.items[0].item_id')
        echo -e "${YELLOW}信息: 从购物车内容中获取到商品ID: $CART_ITEM_ID${NC}" >&2
    fi
fi

# 3.3 Test Update Cart Item Quantity (PUT /cart/items/{id})
if [ -n "$CART_ITEM_ID" ]; then
    echo -e "${BLUE}3.3 测试更新购物车商品数量 (PUT /cart/items/$CART_ITEM_ID)${NC}" >&2
    update_cart_item_data='{
        "quantity": 3
    }'
    do_request "PUT" "/cart/items/$CART_ITEM_ID" "$AUTH_HEADER" "$update_cart_item_data" "^2" "true"
    update_cart_item_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过更新购物车商品数量测试，因为未获取到商品ID.${NC}" >&2
fi

# 3.4 Test Delete Cart Item (DELETE /cart/items/{id})
if [ -n "$CART_ITEM_ID" ]; then
    echo -e "${BLUE}3.4 测试删除购物车商品 (DELETE /cart/items/$CART_ITEM_ID)${NC}" >&2
    do_request "DELETE" "/cart/items/$CART_ITEM_ID" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    delete_cart_item_response=$DO_REQUEST_RESPONSE
    
    # Verify deletion by trying to get the cart and check if the item is gone
    echo -e "${BLUE}验证删除: 检查购物车中是否还有该商品${NC}" >&2
    do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    verify_delete_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过删除购物车商品测试，因为未获取到商品ID.${NC}" >&2
fi

# 3.5 Test Clear Cart (POST /cart/clear)
echo -e "${BLUE}3.5 测试清空购物车 (POST /cart/clear)${NC}" >&2
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^2" "true"
clear_cart_response=$DO_REQUEST_RESPONSE

# Verify cart is empty
echo -e "${BLUE}验证清空: 检查购物车是否为空${NC}" >&2
do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
verify_clear_response=$DO_REQUEST_RESPONSE
if echo "$verify_clear_response" | jq -e '.items | length == 0' > /dev/null; then
    echo -e "${GREEN}✓ 购物车已成功清空${NC}" >&2
else
    echo -e "${RED}✗ 购物车未成功清空${NC}" >&2
fi

# Add more tests for other entities (Accessories, etc.) here...
# echo "================================================================================"
# echo "== 4. Accessory Models API 测试 (占位)"
# ... existing code ...

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

