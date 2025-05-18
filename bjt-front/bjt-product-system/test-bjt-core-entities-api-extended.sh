#!/bin/bash

# Import the original test script functions
source ./test-bjt-core-entities-api.sh

# Reset counters for our extended tests
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

echo "================================================================================"
echo "== BJT核心实体API扩展测试"
echo "================================================================================"
echo "开始扩展API测试..."
echo ""

echo "================================================================================"
echo "== 3. Cart API 扩展测试"
echo "================================================================================"

# 3.1 Test Get Cart Contents with Region Parameter
echo -e "${BLUE}3.1.1 测试获取购物车内容 (GET /cart?region=CN)${NC}" >&2
do_request "GET" "/cart?lang=zh&region=CN" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
cart_contents_region_response=$DO_REQUEST_RESPONSE

# 3.2 Test Add Multiple Items to Cart
echo -e "${BLUE}3.2.1 测试添加多个商品到购物车${NC}" >&2

# Add first item
echo -e "${BLUE}3.2.1.1 添加第一个商品${NC}" >&2
cart_item_data_1='{
    "product_type": "host",
    "part_number": "LA-E4S",
    "quantity": 1
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_data_1" "^2" "true"
add_to_cart_response_1=$DO_REQUEST_RESPONSE

# Add second item
echo -e "${BLUE}3.2.1.2 添加第二个商品${NC}" >&2
cart_item_data_2='{
    "product_type": "accessory",
    "part_number": "BJT-A-010",
    "quantity": 2
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_data_2" "^2" "true"
add_to_cart_response_2=$DO_REQUEST_RESPONSE

# Verify multiple items in cart
echo -e "${BLUE}3.2.1.3 验证购物车包含多个商品${NC}" >&2
do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
cart_multiple_items_response=$DO_REQUEST_RESPONSE

# Check if cart contains at least 2 items
if echo "$cart_multiple_items_response" | jq -e '.items | length >= 2' > /dev/null; then
    echo -e "${GREEN}✓ 购物车成功添加了多个商品${NC}" >&2
else
    echo -e "${RED}✗ 购物车未成功添加多个商品${NC}" >&2
fi

# 3.3 Test Update Cart Item with Invalid Quantity
echo -e "${BLUE}3.3.1 测试使用无效数量更新购物车商品${NC}" >&2

# Get first item ID
CART_ITEM_ID_1=$(echo "$cart_multiple_items_response" | jq -r '.items[0].item_id')
if [ -n "$CART_ITEM_ID_1" ] && [ "$CART_ITEM_ID_1" != "null" ]; then
    # Try to update with invalid quantity (0)
    update_cart_item_invalid_data='{
        "quantity": 0
    }'
    # Expect 400 Bad Request
    do_request "PUT" "/cart/items/$CART_ITEM_ID_1" "$AUTH_HEADER" "$update_cart_item_invalid_data" "^4" "false"
    update_cart_item_invalid_response=$DO_REQUEST_RESPONSE
    
    # Verify item was not updated
    do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    verify_not_updated_response=$DO_REQUEST_RESPONSE
else
    echo -e "${YELLOW}跳过无效数量测试，因为未获取到商品ID.${NC}" >&2
fi

# 3.4 Test Delete Non-existent Cart Item
echo -e "${BLUE}3.4.1 测试删除不存在的购物车商品${NC}" >&2
# Use a very large ID that's unlikely to exist
do_request "DELETE" "/cart/items/99999" "$AUTH_HEADER_NO_CONTENT" "" "^4" "false"
delete_nonexistent_response=$DO_REQUEST_RESPONSE

# 3.5 Test Clear Cart with Empty Cart
echo -e "${BLUE}3.5.1 测试清空已经为空的购物车${NC}" >&2
# First, ensure cart is empty
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^2" "true"
clear_cart_first_response=$DO_REQUEST_RESPONSE

# Then try to clear it again
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^2" "true"
clear_empty_cart_response=$DO_REQUEST_RESPONSE

# Check if response indicates cart was already empty
if echo "$clear_empty_cart_response" | jq -e '.deleted_count == 0' > /dev/null; then
    echo -e "${GREEN}✓ 清空空购物车返回正确响应${NC}" >&2
else
    echo -e "${RED}✗ 清空空购物车返回错误响应${NC}" >&2
fi

# 3.6 Test Add Item with Missing Required Fields
echo -e "${BLUE}3.6 测试缺少必填字段添加商品${NC}" >&2
# Missing product_type
cart_item_missing_type='{
    "part_number": "LA-E4S",
    "quantity": 1
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_missing_type" "^4" "false"
add_missing_type_response=$DO_REQUEST_RESPONSE

# Missing part_number
cart_item_missing_part='{
    "product_type": "host",
    "quantity": 1
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_missing_part" "^4" "false"
add_missing_part_response=$DO_REQUEST_RESPONSE

# Missing quantity
cart_item_missing_quantity='{
    "product_type": "host",
    "part_number": "LA-E4S"
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_missing_quantity" "^4" "false"
add_missing_quantity_response=$DO_REQUEST_RESPONSE

# 3.7 Test Add Item to Cart and Update Quantity
echo -e "${BLUE}3.7 测试添加商品到购物车并更新数量${NC}" >&2

# Add item
echo -e "${BLUE}3.7.1 添加商品${NC}" >&2
cart_item_data='{
    "product_type": "host",
    "part_number": "LA-E4S",
    "quantity": 1
}'
do_request "POST" "/cart/items" "$AUTH_HEADER" "$cart_item_data" "^2" "true"
add_to_cart_response=$DO_REQUEST_RESPONSE

# Extract item ID
CART_ITEM_ID=$(echo "$add_to_cart_response" | jq -r '.data.item_id')
if [ -n "$CART_ITEM_ID" ] && [ "$CART_ITEM_ID" != "null" ]; then
    echo -e "${GREEN}信息: 添加到购物车的商品ID: $CART_ITEM_ID${NC}" >&2
    
    # Update quantity
    echo -e "${BLUE}3.7.2 更新商品数量${NC}" >&2
    update_cart_item_data='{
        "quantity": 5
    }'
    do_request "PUT" "/cart/items/$CART_ITEM_ID" "$AUTH_HEADER" "$update_cart_item_data" "^2" "true"
    update_cart_item_response=$DO_REQUEST_RESPONSE
    
    # Verify quantity was updated
    do_request "GET" "/cart?lang=zh" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
    verify_update_response=$DO_REQUEST_RESPONSE
    
    # Check if quantity was updated to 5
    UPDATED_QUANTITY=$(echo "$verify_update_response" | jq -r --arg id "$CART_ITEM_ID" '.items[] | select(.item_id == ($id | tonumber)) | .quantity')
    if [ "$UPDATED_QUANTITY" = "5" ]; then
        echo -e "${GREEN}✓ 商品数量成功更新为5${NC}" >&2
    else
        echo -e "${RED}✗ 商品数量未成功更新${NC}" >&2
    fi
    
    # Clean up - delete the item
    do_request "DELETE" "/cart/items/$CART_ITEM_ID" "$AUTH_HEADER_NO_CONTENT" "" "^2" "true"
else
    echo -e "${YELLOW}跳过更新数量测试，因为未获取到商品ID.${NC}" >&2
fi

# Clean up - clear cart at the end
echo -e "${BLUE}清理测试数据 - 清空购物车${NC}" >&2
do_request "POST" "/cart/clear" "$AUTH_HEADER" "" "^2" "true"

# Print summary of extended tests
echo ""
echo "================================================================================"
echo "== 扩展测试结果统计"
echo "================================================================================"
echo -e "扩展测试数: $TESTS_TOTAL"
echo -e "${GREEN}通过测试: $TESTS_PASSED${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}失败测试: $TESTS_FAILED${NC}"
    echo -e "${RED}部分测试失败!${NC}"
else
    echo -e "${GREEN}所有扩展测试都通过了!${NC}"
fi
echo ""
echo "扩展测试完成。" 