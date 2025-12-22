# 修改后的NestJS后端服务实现计划

## 1. 项目初始化

* 使用 `npx @nestjs/cli new . --skip-git` 在当前目录初始化NestJS项目

* 安装必要依赖：

  * `@nestjs/mongoose mongoose`：MongoDB数据库连接

  * `@nestjs/jwt passport-jwt`：JWT认证

  * `@nestjs/passport passport`：Passport认证框架

  * `bcryptjs`：密码加密

  * `class-validator class-transformer`：数据验证

  * `multer`：文件上传（Base64处理）

## 2. 邀请码系统

* **数据模型**：创建 `InviteCode` Schema，包含 `code`、`isUsed` 等字段

* **生成脚本**：编写脚本生成20个唯一邀请码并保存到MongoDB

* **验证逻辑**：在用户注册时验证邀请码有效性

## 3. 用户管理系统

* **数据模型**：创建 `User` Schema，包含 `username`、`email`、`password`、`role` 等字段

* **DTO**：定义用户注册、登录、更新等数据传输对象，注册DTO需包含 `inviteCode` 字段

* **控制器**：实现用户CRUD接口

* **服务**：实现用户业务逻辑，包括密码加密、数据验证、邀请码验证等

## 4. 认证授权机制

* **JWT策略**：配置JWT认证策略，实现Token生成、验证

* **守卫**：创建 `JwtAuthGuard` 保护需要认证的接口

* **角色守卫**：创建 `RolesGuard` 实现基于角色的访问控制

* **装饰器**：定义 `@Roles()` 装饰器，用于标记接口所需角色

## 5. 文件上传服务

* **配置**：设置文件上传相关配置：

  * 大小限制：15MB

  * 格式验证：仅允许 `image/png`、`image/jpeg`

  * Base64解码处理

* **控制器**：实现Base64文件上传接口

* **服务**：实现文件验证、Base64解码、存储逻辑

* **工具**：编写文件处理工具函数，确保文件安全

## 6. 测试编写

* **单元测试**：测试各个服务的核心功能

* **集成测试**：测试接口的完整流程

* **测试覆盖**：确保关键功能都有测试覆盖

## 7. 项目结构

```
src/
├── auth/              # 认证模块
│   ├── jwt.strategy.ts
│   ├── auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   ├── auth.module.ts
├── users/             # 用户模块
│   ├── user.schema.ts
│   ├── user.dto.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── users.module.ts
├── invite-codes/      # 邀请码模块
│   ├── invite-code.schema.ts
│   ├── invite-code.service.ts
│   ├── invite-code.module.ts
├── files/             # 文件上传模块
│   ├── files.controller.ts
│   ├── files.service.ts
│   ├── files.module.ts
│   ├── files.utils.ts
├── scripts/           # 脚本目录
│   └── generate-invite-codes.ts
├── app.module.ts
└── main.ts
```

## 8. 实现步骤

1. 初始化项目并安装依赖

2. 配置MongoDB连接

3. 实现邀请码模型和生成脚本

4. 生成20个邀请码并保存到数据库

5. 实现用户模型和DTO

6. 实现用户服务和控制器，包含邀请码验证

7. 配置JWT认证

8. 实现认证守卫和角色守卫

9. 实现文件上传功能，包含严格的大小和格式限制

10. 编写测试用例

11. 启动服务并测试

## 9. 技术规范

* 遵循NestJS最佳实践

* 使用TypeScript强类型

* 实现完整的数据验证

* 处理所有可能的错误情况

* 确保代码可读性和可维护性

