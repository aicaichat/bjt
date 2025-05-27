/**
 * API服务索引
 * 集中导出所有API服务，便于统一管理和导入
 */

// 导出所有API服务

// 基础服务
export * from './base.service';

// 产品线服务
export * from './product-line.service';
export { default as productLineService } from './product-line.service';

// 备件服务
export * from './spare-part.service';
// 备件服务没有默认导出

// 设备服务
export * from './machine.service';
export { default as machineService } from './machine.service';

// 配件服务
export * from './accessory.service';
export { default as accessoryService } from './accessory.service';

// 耗材服务
export * from './consumable.service';
export { consumableService } from './consumable.service';

// 购物车服务
export * from './cart.service';
export { default as cartService } from './cart.service';

// 订单服务
export * from './order.service';
export { default as orderService } from './order.service';

// 认证服务
export * from './auth.service';
export { default as authService } from './auth.service';

// 导入服务
import { ProductLineService } from './product-line.service';
import { MachineService } from './machine.service';
import { SparePartService } from './spare-part.service';
import { AccessoryService } from './accessory.service';
import { ConsumableService } from './consumable.service';
import { CartService } from './cart.service';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';

// 创建服务实例
export const productLineServiceInstance = new ProductLineService();
export const machineServiceInstance = new MachineService();
export const sparePartServiceInstance = new SparePartService();
export const accessoryServiceInstance = new AccessoryService();
export const consumableServiceInstance = new ConsumableService();
export const cartServiceInstance = new CartService();
export const orderServiceInstance = new OrderService();
export const authServiceInstance = new AuthService();

// TODO: 未来将添加更多服务
// export * from './auth.service'; 