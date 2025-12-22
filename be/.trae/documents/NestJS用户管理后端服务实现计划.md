# NestJS用户管理后端服务实现计划

## 1. 项目初始化

* 使用 `npx @nestjs/cli new . --skip-git` 在当前目录初始化NestJS项目
* 安装必要依赖：
  * `@nestjs/mongoose mongoose`：MongoDB数据库连接
  * `@nestjs/jwt passport-jwt`：JWT认证
  * `@nestjs/passport passport`：Passport认证框架
  * `bcryptjs`：密码加密
  * `class-validator class-transformer`：数据验证
  * `@nestjs/throttler`：请求频率限制
  * `@nestjs/config`：配置管理

## 2. 项目结构设计

```
src/
├── config/              # 配置文件
├── auth/                # 认证模块
│   ├── jwt.strategy.ts
│   ├── auth.guard.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
├── invite-codes/        # 邀请码模块
│   ├── invite-code.schema.ts
│   ├── invite-code.service.ts
│   ├── invite-code.module.ts
│   ├── invite-code.generator.ts
├── users/               # 用户管理模块
│   ├── user.schema.ts
│   ├── user.dto.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── users.module.ts
├── common/              # 公共模块
│   ├── filters/         # 全局异常过滤器
│   ├── decorators/      # 自定义装饰器
│   ├── interfaces/      # 公共接口
│   ├── pipes/           # 自定义管道
├── app.module.ts
└── main.ts
```

## 3. 核心功能实现

### 3.1 数据模型设计

* **User Schema**：包含 `username`、`password`、`email`、`phone`、`createdAt`、`updatedAt` 等字段
* **InviteCode Schema**：包含 `code`、`isUsed`、`usedBy`、`createdAt` 等字段

### 3.2 邀请码系统

* 实现邀请码生成脚本，生成20个唯一邀请码
* 实现邀请码验证逻辑，确保注册时只有有效邀请码才能使用

### 3.3 用户认证与授权

* 实现JWT认证策略，包括Token生成、验证和刷新
* 实现认证守卫，保护需要授权的接口
* 实现请求频率限制，防止暴力破解

### 3.4 用户CRUD接口

* 注册接口：验证邀请码、邮箱/手机号唯一性、密码加密
* 登录接口：验证用户凭证，颁发JWT令牌
* 获取用户信息接口：根据Token返回用户详情
* 更新用户信息接口：支持部分字段更新
* 删除用户接口：软删除或硬删除

### 3.5 数据验证

* 使用class-validator实现严格的数据验证
* 验证规则包括：
  * 用户名：必填，长度限制
  * 密码：强度验证，长度限制
  * 邮箱：格式验证，唯一性验证
  * 手机号：格式验证，唯一性验证
  * 邀请码：有效性验证

### 3.6 响应格式标准化

* 实现全局响应拦截器，统一返回格式：
  ```json
  {
    "code": number,
    "message": string,
    "data": any
  }
  ```

### 3.7 错误处理

* 实现全局异常过滤器，统一处理各类错误
* 针对不同错误类型返回相应的状态码和错误信息

## 4. 安全措施

* 密码使用bcrypt加密存储
* 实现防SQL注入、XSS攻击防护
* 添加请求频率限制
* 实现HTTPS支持（生产环境）
* JWT令牌安全配置（过期时间、刷新机制）

## 5. 测试与文档

* 编写单元测试，覆盖核心功能
* 编写集成测试，测试接口完整流程
* 生成API文档（使用Swagger）
* 编写部署说明文档

## 6. 实现步骤

1. 初始化项目并安装依赖
2. 配置MongoDB连接
3. 实现邀请码模型和生成脚本
4. 生成20个邀请码并保存到数据库
5. 实现用户模型和DTO
6. 实现JWT认证策略和守卫
7. 实现用户服务和控制器，包含完整CRUD操作
8. 实现全局响应拦截器和异常过滤器
9. 配置请求频率限制
10. 编写测试用例
11. 生成API文档
12. 编写部署说明

## 7. 技术规范

* 遵循NestJS最佳实践
* 使用TypeScript强类型
* 实现完整的数据验证
* 处理所有可能的错误情况
* 确保代码可读性和可维护性
* 实现完整的日志记录
* 遵循RESTful API设计规范