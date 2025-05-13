# API Implementation Status

**Document Version:** 1.0
**Last Updated:** $(date +%Y-%m-%d)

This document tracks the implementation status of the BJT Product Management System API endpoints as defined in `frontend/src/API 接口文档.ini` against the backend controllers.

## Overall Controller to API Section Mapping:

*   **Section 2: 认证接口 (Auth API)**
    *   Controller: `plugins/bjt-core-entities/controllers/class-auth-controller.php`
*   **Section 3: 设备选型(Machines)接口 (Hosts API)**
    *   Controller: `plugins/bjt-core-entities/controllers/class-machine-controller.php`
*   **Section 4: 配件(Accessories)接口**
    *   Controller: `plugins/bjt-core-entities/controllers/class-accessory-model-controller.php`
*   **Section 5 & 6: 耗材(Consumables)接口** (API doc has duplicate numbering/sections)
    *   Core Consumables: `plugins/bjt-core-entities/controllers/class-consumable-controller.php`
    *   Product Lines (API Doc 5.6, 5.7): `plugins/bjt-core-entities/controllers/class-product-controller.php`
*   **Section 6 (Intended as Spare Parts): 备件(SpareParts)接口**
    *   Controller: **MISSING**
*   **Section 7: 购物车(Cart)接口**
    *   Controller: **MISSING**
*   **Section 8: 订单(Orders)接口**
    *   Controller: **MISSING**
*   **Section 9: 数据字典接口**
    *   Controller: **MISSING / Partially in others?**
*   **Section 10: 实时价格与库存接口**
    *   Partially implemented within individual product controllers (e.g., Consumables). Dedicated batch endpoints mostly **MISSING**.

---

## Detailed Endpoint Status:

### Section 2: 认证接口 (`class-auth-controller.php`)

| API Doc Endpoint                         | Method | Controller Route             | Status                 | Notes                                            |
| ---------------------------------------- | ------ | ---------------------------- | ---------------------- | ------------------------------------------------ |
| `2.1 /auth/login`                        | POST   | `/auth/login`                | **Implemented**        |                                                  |
| `2.2 /auth/me`                           | GET    | `/user/me`                   | **Implemented**        | Path mismatch (`/auth/me` vs `/user/me`)         |
| `2.3 /auth/refresh`                      | POST   | `/auth/refresh`              | **Implemented**        |                                                  |
| `2.4 /auth/logout`                       | POST   | `/auth/logout`               | **Implemented**        |                                                  |

### Section 3: 设备选型(Machines)接口 (`class-machine-controller.php`)

| API Doc Endpoint                         | Method | Controller Route             | Status                 | Notes                                                                                                                                   |
| ---------------------------------------- | ------ | ---------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `3.1 /machines`                          | GET    | `/machines`                  | **Partially Implemented** | Basic list implemented. Response fields `inventory`, `prices` are **MISSING**.                                                       |
| `3.2 /machines/{machine_id}`             | GET    | `/machines/{id}`             | **Partially Implemented** | Basic detail implemented. Response fields `inventory`, `prices`, `features`, `documents`, `videos` are **MISSING**.                   |
| `3.3 /machines/{machine_id}/accessories` | GET    | `/machines/{id}/accessories` | **Partially Implemented** | Route registered. Complex data structure in response (accessories with their own parts, prices, inventory) is **MISSING**.         |
| (CRUD - Create)                          | POST   | `/machines`                  | **Implemented (basic)**  |                                                                                                                                         |
| (CRUD - Update)                          | PUT    | `/machines/{id}`             | **Implemented (basic)**  |                                                                                                                                         |
| (CRUD - Delete)                          | DELETE | `/machines/{id}`             | **Implemented (basic)**  |                                                                                                                                         |

### Section 4: 配件(Accessories)接口 (`class-accessory-model-controller.php`)

*Controller resource name is `accessory-models`, API doc implies `accessories`.*

| API Doc Endpoint                            | Method | Controller Route                | Status                 | Notes                                                                                                                                         |
| ------------------------------------------- | ------ | ------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `4.1 /accessories/{accessory_id}`           | GET    | `/accessory-models/{id}`        | **Partially Implemented** | Basic detail of accessory model. Response structure for `parts` (sellable part numbers) with their `prices` & `inventory`, and `compatible_machines` is **MISSING**. Path mismatch. |
| `4.2 /accessories/{accessory_id}/children`  | GET    |                                 | **MISSING**            | Route not registered.                                                                                                                         |
| (CRUD - List Accessory Models)              | GET    | `/accessory-models`             | **Implemented (basic)**  |                                                                                                                                               |
| (CRUD - Create Accessory Model)             | POST   | `/accessory-models`             | **Implemented (basic)**  |                                                                                                                                               |
| (CRUD - Update Accessory Model)             | PUT    | `/accessory-models/{id}`        | **Implemented (basic)**  |                                                                                                                                               |
| (CRUD - Delete Accessory Model)             | DELETE | `/accessory-models/{id}`        | **Implemented (basic)**  |                                                                                                                                               |

### Section 5 & 6: 耗材(Consumables)接口 (`class-consumable-controller.php` & `class-product-controller.php`)

*(API doc sections 5 & 6 are mixed/duplicated for Consumables and Product Lines)*

**`class-consumable-controller.php`:**

| API Doc Endpoint                                          | Method | Controller Route             | Status                 | Notes                                                                 |
| --------------------------------------------------------- | ------ | ---------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `GET /consumables` (Implicit general list)                | GET    | `/consumables`               | **Implemented**        | Includes pricing & inventory.                                         |
| `GET /consumables/{id}` (Implicit general detail)         | GET    | `/consumables/{id}`          | **Implemented**        | Includes pricing & inventory.                                         |
| `POST /consumables` (Implicit general create)             | POST   | `/consumables`               | **Implemented**        |                                                                       |
| `PUT /consumables/{id}` (Implicit general update)         | PUT    | `/consumables/{id}`          | **Implemented**        |                                                                       |
| `DELETE /consumables/{id}` (Implicit general delete)      | DELETE | `/consumables/{id}`          | **Implemented**        |                                                                       |
| `5.1 /product-lines/{productLineId}/consumables`          | GET    |                              | **MISSING**            | Not a nested route. `/consumables` can be filtered.                 |
| `5.2 /consumables/prices/batch`                           | POST   |                              | **MISSING**            |                                                                       |
| `5.3 /consumables/inventory/batch`                        | POST   |                              | **MISSING**            |                                                                       |
| `5.5 /consumables/{consumableId}/compatibility-check`     | GET    |                              | **MISSING**            |                                                                       |

*Note: API Doc `5.4 /accessories/{accessoryId}/required` is misplaced; belongs to Accessories section.*

**`class-product-controller.php` (Product Lines):**

| API Doc Endpoint                         | Method | Controller Route             | Status                 | Notes                                                                    |
| ---------------------------------------- | ------ | ---------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `5.6 /product-lines`                     | GET    | `/product-lines`             | **Implemented**        |                                                                          |
| `5.7 /product-lines/{id}`                | GET    | `/product-lines/{id}`        | **Partially Implemented** | Basic detail. Response `machines` array is **MISSING**.                |
| (CRUD - Create Product Line)             | POST   | `/product-lines`             | **Implemented**        |                                                                          |
| (CRUD - Update Product Line)             | PUT    | `/product-lines/{id}`        | **Implemented**        |                                                                          |
| (CRUD - Delete Product Line)             | DELETE | `/product-lines/{id}`        | **Implemented**        |                                                                          |


### Section 6 (Intended): 备件(SpareParts)接口

| API Doc Endpoint | Method | Controller Route | Status    | Notes           |
| ---------------- | ------ | ---------------- | --------- | --------------- |
| (All endpoints)  |        |                  | **MISSING** | No controller.  |

### Section 7: 购物车(Cart)接口

| API Doc Endpoint | Method | Controller Route | Status    | Notes           |
| ---------------- | ------ | ---------------- | --------- | --------------- |
| (All endpoints)  |        |                  | **MISSING** | No controller.  |

### Section 8: 订单(Orders)接口

| API Doc Endpoint | Method | Controller Route | Status    | Notes           |
| ---------------- | ------ | ---------------- | --------- | --------------- |
| (All endpoints)  |        |                  | **MISSING** | No controller.  |

### Section 9: 数据字典接口

| API Doc Endpoint | Method | Controller Route | Status    | Notes                                  |
| ---------------- | ------ | ---------------- | --------- | -------------------------------------- |
| (All endpoints)  |        |                  | **MISSING** | Might be part of other controllers.    |

### Section 10: 实时价格与库存接口

| API Doc Endpoint | Method | Controller Route | Status    | Notes                                                                              |
| ---------------- | ------ | ---------------- | --------- | ---------------------------------------------------------------------------------- |
| (Generic)        |        |                  | **Partially Implemented** | Implemented within `ConsumableController`. Other batch endpoints are **MISSING**. |

---
This document provides a high-level overview. Each "Partially Implemented" or "MISSING" item requires further development to match the API documentation. 