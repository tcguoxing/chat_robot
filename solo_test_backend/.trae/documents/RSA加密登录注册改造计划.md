# RSA加密登录注册改造计划

## 1. 新增RSA密钥管理服务
- 创建`crypto`模块，包含`crypto.service.ts`用于RSA密钥对的生成、存储和管理
- 实现密钥定期轮换机制
- 确保私钥安全存储，考虑使用环境变量或安全配置文件

## 2. 新增getPublicKey接口
- 在auth控制器中添加`@Get('public-key')`接口
- 返回当前有效的RSA公钥
- 实现RESTful规范，包含适当的状态码和错误处理

## 3. 修改认证服务
- 在`auth.service.ts`中添加RSA解密功能
- 修改`validateUser`、`validateUserByUsername`、`validateUserByPhone`方法，支持解密RSA加密的密码
- 修改`hashPassword`方法，确保只对明文密码进行哈希处理

## 4. 更新DTO文件
- 修改`user.dto.ts`，移除所有密码相关的服务端验证装饰器（如`@MinLength`）
- 确保password字段只保留`@IsString`装饰器

## 5. 修改用户服务和控制器
- 修改`user.service.ts`中的`register`方法，添加RSA解密逻辑
- 移除所有密码复杂度验证
- 确保只对解密后的明文密码进行哈希处理

## 6. 安全增强措施
- 实现防重放攻击，添加时间戳验证
- 添加加密解密过程的日志记录
- 实现异常处理，包括无效加密数据、解密失败等情况

## 7. 编写测试用例
- 为新增的`getPublicKey`接口编写单元测试
- 为修改后的`register`和`login`接口编写集成测试
- 测试加密解密流程的正确性
- 测试边界情况和异常处理

## 8. 具体实施步骤

### 步骤1：创建RSA密钥管理服务
1. 创建`src/crypto/crypto.service.ts`
2. 实现RSA密钥对生成和存储
3. 实现密钥轮换机制

### 步骤2：新增getPublicKey接口
1. 修改`src/auth/auth.controller.ts`，添加新接口
2. 实现公钥返回逻辑

### 步骤3：修改认证服务
1. 更新`src/auth/auth.service.ts`，添加RSA解密方法
2. 修改验证用户方法，支持RSA加密密码

### 步骤4：更新DTO和用户服务
1. 修改`src/users/user.dto.ts`，移除密码验证装饰器
2. 修改`src/users/user.service.ts`，添加RSA解密逻辑
3. 移除所有密码复杂度验证

### 步骤5：添加安全增强和日志
1. 实现防重放攻击措施
2. 添加关键操作的日志记录
3. 增强异常处理

### 步骤6：编写测试用例
1. 创建`src/crypto/crypto.service.spec.ts`
2. 更新`src/auth/auth.service.spec.ts`
3. 更新`src/users/user.service.spec.ts`
4. 编写集成测试

## 9. 预期效果
- 前端使用RSA公钥加密密码后传输
- 后端使用私钥解密，再进行密码哈希或验证
- 移除后端密码复杂度验证，责任转移到前端
- 实现密钥安全管理和定期轮换
- 增强防重放攻击能力
- 完善日志记录和异常处理

## 10. 技术选型
- 使用Node.js内置的`crypto`模块实现RSA加密解密
- 使用环境变量存储私钥（开发环境）
- 生产环境考虑使用安全存储服务
- 使用NestJS的日志系统记录安全操作

## 11. 风险评估
- RSA密钥管理：需确保私钥安全存储，定期轮换
- 性能影响：RSA加密解密会增加一定的计算开销
- 兼容性：需确保前端加密库与后端解密算法兼容
- 异常处理：需妥善处理解密失败等异常情况

## 12. 测试重点
- 加密解密流程的正确性
- 密钥轮换机制的有效性
- 防重放攻击措施的可靠性
- 异常情况的处理
- 接口的性能和稳定性