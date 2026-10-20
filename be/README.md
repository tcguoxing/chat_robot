# 用户管理系统后端服务

基于NestJS框架开发的用户管理后端服务，支持用户注册、登录、信息管理等功能。

## 功能特性

- ✅ 用户注册（支持邀请码验证）
- ✅ 用户登录（邮箱/手机号 + 密码）
- ✅ JWT认证机制
- ✅ 完整的用户CRUD操作
- ✅ 邀请码系统
- ✅ 请求频率限制
- ✅ 统一的API响应格式
- ✅ 全局异常处理
- ✅ Swagger API文档
- ✅ MongoDB数据库支持

## 技术栈

- **框架**: NestJS 11.x
- **数据库**: MongoDB 9.x
- **认证**: JWT (JSON Web Token)
- **ORM**: Mongoose
- **验证**: class-validator
- **密码加密**: bcryptjs
- **文档**: Swagger

## 环境要求

- Node.js >= 18.x
- MongoDB >= 5.x

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd chat_robot_backend
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`，并根据实际情况修改配置：

```bash
cp .env.example .env
```

配置项说明：

```dotenv
# MongoDB连接配置
MONGODB_URI=mongodb://localhost:27017/user-management

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=3600s

# 应用配置
PORT=3000
```

### 4. 生成邀请码

在启动应用之前，需要生成邀请码用于用户注册：

```bash
# 使用npm
npm run generate:invite-codes

# 使用pnpm
pnpm run generate:invite-codes

# 直接使用ts-node
pnpm ts-node src/invite-codes/invite-code.generator.ts
```

### 5. 启动应用

#### 开发模式

```bash
pnpm run start:dev
```

#### 生产模式

```bash
pnpm run build
pnpm run start:prod
```

### 6. 访问API文档

应用启动后，可通过以下地址访问Swagger API文档：

```
http://localhost:3000/api
```

## API接口说明

### 认证相关

- `POST /users/register` - 用户注册
- `POST /users/login` - 用户登录（邮箱+密码）
- `POST /users/login/phone` - 用户登录（手机号+密码）

### 用户管理

- `GET /users` - 获取所有用户
- `GET /users/:id` - 获取单个用户
- `GET /users/me` - 获取当前登录用户信息
- `PUT /users/:id` - 更新用户信息
- `DELETE /users/:id` - 删除用户

## 项目结构

```
src/
├── config/              # 配置文件
├── auth/                # 认证模块
│   ├── jwt.strategy.ts  # JWT策略配置
│   ├── auth.guard.ts    # JWT认证守卫
│   ├── auth.service.ts  # 认证服务
│   └── auth.module.ts   # 认证模块配置
├── invite-codes/        # 邀请码模块
│   ├── invite-code.schema.ts       # 邀请码数据模型
│   ├── invite-code.service.ts      # 邀请码服务
│   ├── invite-code.module.ts       # 邀请码模块配置
│   └── invite-code.generator.ts    # 邀请码生成脚本
├── users/               # 用户管理模块
│   ├── user.schema.ts   # 用户数据模型
│   ├── user.dto.ts      # 数据传输对象
│   ├── user.service.ts  # 用户服务
│   ├── user.controller.ts # 用户控制器
│   └── users.module.ts  # 用户模块配置
├── common/              # 公共模块
│   └── filters/         # 过滤器
│       ├── response.interceptor.ts    # 全局响应拦截器
│       └── http-exception.filter.ts   # 全局异常过滤器
├── app.module.ts        # 应用根模块
└── main.ts              # 应用入口
```

## 部署说明

### 1. Docker部署

#### 1.1 构建Docker镜像

```bash
docker build -t user-management-backend .
```

#### 1.2 运行Docker容器

```bash
docker run -d -p 3000:3000 --name user-management-backend \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/user-management \
  -e JWT_SECRET=your-secret-key-here \
  -e JWT_EXPIRES_IN=3600s \
  -e PORT=3000 \
  user-management-backend
```

#### 1.3 使用Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/user-management
      - JWT_SECRET=your-secret-key-here
      - JWT_EXPIRES_IN=3600s
      - PORT=3000
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

启动服务：

```bash
docker-compose up -d
```

### 2. PM2部署

#### 2.1 安装PM2

```bash
npm install -g pm2
```

#### 2.2 构建应用

```bash
npm run build
```

#### 2.3 创建PM2配置文件

创建 `ecosystem.config.js` 文件：

```javascript
module.exports = {
  apps: [
    {
      name: 'user-management-backend',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb://localhost:27017/user-management',
        JWT_SECRET: 'your-secret-key-here',
        JWT_EXPIRES_IN: '3600s',
        PORT: 3000,
      },
    },
  ],
};
```

#### 2.4 启动应用

```bash
npm run build
npm run start:prod
```

或者使用PM2直接启动：

```bash
npm run build
pm2 start ecosystem.config.js
```

#### 2.5 PM2常用命令

```bash
# 查看应用状态
pm2 status

# 停止应用
pm2 stop user-management-backend

# 重启应用
pm2 restart user-management-backend

# 查看日志
pm2 logs user-management-backend

# 查看实时日志
pm2 logs user-management-backend --follow

# 删除应用
pm2 delete user-management-backend
```

### 3. 传统部署

#### 3.1 安装依赖

```bash
npm install --production
```

#### 3.2 构建应用

```bash
npm run build
```

#### 3.3 启动应用

```bash
npm run start:prod
```

### 4. HTTPS配置

在生产环境中，建议使用HTTPS协议：

#### 4.1 使用Nginx作为反向代理

安装Nginx：

```bash
sudo apt update
sudo apt install nginx
```

创建Nginx配置文件 `/etc/nginx/sites-available/user-management`：

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API文档
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/user-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4.2 配置防火墙

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 环境变量配置

| 变量名 | 类型 | 必填 | 描述 | 默认值 |
|--------|------|------|------|--------|
| MONGODB_URI | string | 是 | MongoDB连接地址 | - |
| JWT_SECRET | string | 是 | JWT签名密钥 | - |
| JWT_EXPIRES_IN | string | 否 | JWT过期时间 | 3600s |
| PORT | number | 否 | 应用监听端口 | 3000 |

## 安全配置

1. **生产环境建议**：
   - 使用HTTPS协议
   - 配置更强的JWT密钥
   - 缩短JWT过期时间
   - 配置更严格的请求频率限制
   - 启用CSRF保护

2. **数据库安全**：
   - 使用强密码
   - 限制数据库访问IP
   - 定期备份数据

## 测试

### 运行单元测试

```bash
pnpm run test
```

### 运行集成测试

```bash
pnpm run test:e2e
```

### 测试覆盖率

```bash
pnpm run test:cov
```

## 日志

应用使用NestJS内置的日志系统，可根据需要配置日志级别：

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

## 常见问题

### 1. MongoDB连接失败

确保MongoDB服务正在运行，并且连接地址配置正确。

### 2. 邀请码生成失败

检查MongoDB连接是否正常，以及是否有权限写入数据库。

### 3. JWT认证失败

确保请求头中包含正确的Authorization Bearer Token。

## 许可证

UNLICENSED

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题，请联系项目维护者。
