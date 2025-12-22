import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

// Mock crypto module for testing
jest.mock('crypto', () => ({
  generateKeyPairSync: jest.fn(() => ({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  })),
  privateDecrypt: jest.fn(() => Buffer.from('decrypted-password')),
  verify: jest.fn(() => true),
}));

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(cryptoService).toBeDefined();
  });

  describe('getPublicKey', () => {
    it('should return the current RSA public key', () => {
      const publicKey = cryptoService.getPublicKey();
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe('string');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data using private key', () => {
      const encryptedData = Buffer.from('encrypted-data').toString('base64');
      const decrypted = cryptoService.decrypt(encryptedData);

      expect(decrypted).toBeDefined();
      expect(decrypted).toBe('decrypted-password');
    });

    it('should throw error for invalid encrypted data', () => {
      // Mock privateDecrypt to throw an error
      const crypto = require('crypto');
      crypto.privateDecrypt.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = 'invalid-encrypted-data';

      expect(() => cryptoService.decrypt(encryptedData)).toThrow(
        'Failed to decrypt data',
      );
    });
  });

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const data = 'test-data';
      const signature = Buffer.from('valid-signature').toString('base64');

      const result = cryptoService.verifySignature(data, signature);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      // Mock verify to return false
      const crypto = require('crypto');
      crypto.verify.mockReturnValueOnce(false);

      const data = 'test-data';
      const signature = Buffer.from('invalid-signature').toString('base64');

      const result = cryptoService.verifySignature(data, signature);
      expect(result).toBe(false);
    });
  });
});
