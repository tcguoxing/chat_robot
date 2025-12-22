# 前后端RSA加解密不匹配问题分析与解决方案

## 问题分析

通过对前后端代码的分析，发现可能存在以下不匹配问题：

### 1. 加密算法参数不匹配

* **后端**：使用 `RSA_PKCS1_OAEP_PADDING` 填充方式 + `sha256` 哈希算法

* **前端**：JSEncrypt 默认使用 `PKCS1` 填充方式，而非 `OAEP` 填充方式

### 2. 密钥格式不匹配

* **后端**：生成的公钥格式为 `spki` 类型

* **前端**：JSEncrypt 可能期望 `pkcs1` 类型的公钥

### 3. 私钥加密问题

* **后端**：私钥使用 `aes-256-cbc` 算法加密，并设置了密码短语

* 解密时需要确保使用正确的密码短语和算法

### 4. 密钥轮换问题

* 后端每24小时轮换一次密钥对

* 如果前端缓存了旧的公钥，会导致解密失败

## 调试步骤

### 步骤1：验证密钥格式兼容性

1. 检查后端生成的公钥格式
2. 验证JSEncrypt是否支持当前公钥格式
3. 检查前端接收到的公钥是否完整无损

### 步骤2：测试加密算法参数

1. 检查JSEncrypt默认使用的加密算法和填充方式
2. 验证前后端加密算法参数是否一致
3. 测试不同填充方式的兼容性

### 步骤3：验证密钥对匹配性

1. 确保前端使用的公钥与后端当前的私钥匹配
2. 测试密钥轮换机制是否正常工作
3. 检查前端是否及时更新公钥

### 步骤4：检查数据编码

1. 验证前端加密后的数据是否正确编码为base64
2. 检查后端解码方式是否正确
3. 测试数据传输过程中是否存在编码转换问题

## 解决方案

### 方案1：修改后端解密算法参数

将后端解密算法从 `RSA_PKCS1_OAEP_PADDING` 改为 `RSA_PKCS1_PADDING`，与JSEncrypt默认值匹配

### 方案2：修改前端加密参数

配置JSEncrypt使用 `OAEP` 填充方式，与后端保持一致

### 方案3：优化密钥格式

确保生成的公钥格式与JSEncrypt兼容

### 方案4：改进密钥管理

* 优化密钥轮换机制，确保前端能及时获取新公钥

* 添加密钥版本标识，便于调试和追踪

## 具体实施步骤

### 1. 修改后端解密算法参数

```typescript
// src/crypto/crypto.service.ts
decrypt(encryptedData: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: this.keyPair.privateKey,
        passphrase: 'default-passphrase',
        padding: crypto.constants.RSA_PKCS1_PADDING, // 修改为PKCS1填充方式
      },
      buffer,
    );
    return decrypted.toString('utf8');
  } catch (error) {
    this.logger.error('RSA decryption failed:', error.message);
    throw new Error('Failed to decrypt data');
  }
}
```

### 2. 优化公钥格式

```typescript
// src/crypto/crypto.service.ts
private generateKeyPair(): void {
  this.logger.log('Generating new RSA key pair...');
  
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'pkcs1', // 修改为pkcs1格式，更兼容JSEncrypt
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: 'default-passphrase',
    },
  });
  
  this.keyPair = {
    publicKey,
    privateKey,
    createdAt: Date.now(),
  };
  
  this.logger.log('RSA key pair generated successfully');
}
```

### 3. 改进密钥获取接口

```typescript
// src/auth/auth.controller.ts
@Get('public-key')
getPublicKey() {
  const publicKey = this.cryptoService.getPublicKey();
  const timestamp = Date.now();
  
  return {
    publicKey,
    timestamp,
    nonce: Math.random().toString(36).substring(2, 15),
    version: '1.0', // 添加版本标识
  };
}
```

### 4. 添加调试日志

```typescript
// src/crypto/crypto.service.ts
decrypt(encryptedData: string): string {
  try {
    this.logger.debug('Decrypting RSA encrypted data...');
    this.logger.debug('Encrypted data length:', encryptedData.length);
    this.logger.debug('Encrypted data sample:', encryptedData.substring(0, 50) + '...');
    
    // 解密逻辑
    
    this.logger.debug('Decrypted data:', decrypted.toString('utf8'));
    return decrypted.toString('utf8');
  } catch (error) {
    this.logger.error('RSA decryption failed:', error);
    this.logger.error('Full error:', JSON.stringify(error, null, 2));
    throw new Error('Failed to decrypt data');
  }
}
```

## 测试验证

1. **单元测试**：编写测试用例，验证解密功能
2. **集成测试**：模拟前端加密过程，验证后端解密
3. **端到端测试**：使用真实前端环境测试完整流程
4. **边界测试**：测试不同长度和格式的密码

## 预期效果

通过以上修改，确保：

* 前后端加密算法参数一致

* 密钥格式兼容

* 解密过程稳定可靠

* 便于调试和追踪问题

## 额外建议

1. **前端实现建议**：

   * 在每次请求前获取最新的公钥

   * 添加加密失败的错误处理

   * 记录加密日志便于调试

2. **后端实现建议**：

   * 添加密钥版本管理

   * 实现更安全的密钥存储方式

   * 考虑使用更现代的加密算法

3. **监控建议**：

   * 添加解密成功率监控

   * 记录解密失败的详细信息

   * 设置解密失败告警机制

