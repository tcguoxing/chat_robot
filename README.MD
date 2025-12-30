我需要先了解这个项目的结构和内容，然后给出一个清晰的描述。首先查看项目根目录的文件结构。
        
            
toolName: view_folder
            
status: success
          
/Users/tcguoxing/Code/full-stack-test
          
我需要查看项目的关键文件，了解前后端的具体技术栈和功能。首先查看后端的package.json文件。
        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/tcguoxing/Code/full-stack-test/be/package.json
          
现在查看前端的package.json文件，了解前端的技术栈。
        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/tcguoxing/Code/full-stack-test/fe/package.json
          
这是一个前后端分离的全栈Web应用，主要用于用户管理和认证服务。

### 项目结构
项目分为前端和后端两个主要部分：
- **be/**：后端服务，基于NestJS框架开发
- **fe/**：前端应用，基于Vue 3框架开发

### 技术栈

#### 后端（be）
- **框架**：NestJS + TypeScript
- **数据库**：MongoDB
- **认证**：JWT + Passport
- **加密**：RSA加密算法
- **构建工具**：Nest CLI
- **测试**：Jest

#### 前端（fe）
- **框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **路由**：Vue Router
- **HTTP客户端**：Axios
- **加密**：jsencrypt
- **构建工具**：Vite

### 核心功能

#### 后端功能
1. **用户管理**：
   - 用户注册、登录、信息查询
   - 密码加密存储
   - 用户信息管理

2. **认证授权**：
   - JWT令牌生成与验证
   - 基于角色的访问控制
   - 登录保护中间件

3. **加密服务**：
   - RSA密钥生成
   - 数据加密解密
   - 安全传输支持

4. **邀请码系统**：
   - 邀请码生成
   - 邀请码验证

5. **统一响应处理**：
   - 全局异常过滤
   - 响应拦截器
   - 标准化API响应格式

#### 前端功能
1. **用户认证**：
   - 登录页面
   - 注册页面
   - 密码加密传输

2. **内容展示**：
   - 三栏式内容页面
   - API数据集成

3. **路由管理**：
   - 页面路由配置
   - 导航守卫

### 项目特点
1. **前后端分离架构**：清晰的职责划分，便于团队协作和独立部署
2. **安全性设计**：
   - RSA加密传输
   - JWT认证机制
   - 密码哈希存储
3. **模块化设计**：
   - 后端采用NestJS模块系统
   - 前端组件化开发
4. **完整的测试覆盖**：
   - 单元测试
   - 集成测试
   - E2E测试
5. **开发效率工具**：
   - 自动格式化
   - 热重载
   - 调试支持

### 开发流程
- 后端：使用Nest CLI进行开发、构建和测试
- 前端：使用Vite进行开发、构建和预览
- 代码质量：ESLint + Prettier保证代码规范

### 部署
- 后端：构建为Node.js应用，使用pm2或容器化部署
- 前端：构建为静态资源，部署到CDN或静态文件服务器

这个项目实现了一个完整的用户认证和管理系统，具备良好的安全性、可扩展性和可维护性，适合作为企业级应用的基础框架。