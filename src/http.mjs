// 与客户端使用同一份锁定的路由、选择和字节校验器；调用者仍负责认证与网络边界。
export {createHttpAdapter, WireError, limits} from './runtime/panel-http/adapter.mjs';
