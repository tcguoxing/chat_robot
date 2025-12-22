import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { InviteCodeService } from '../invite-codes/invite-code.service';
import { CryptoService } from '../crypto/crypto.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let userService: UserService;
  let authService: AuthService;
  let inviteCodeService: InviteCodeService;
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AuthService,
        InviteCodeService,
        CryptoService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    inviteCodeService = module.get<InviteCodeService>(InviteCodeService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('register', () => {
    it('should throw conflict exception if username exists', async () => {
      // 模拟邀请码验证通过
      jest
        .spyOn(inviteCodeService, 'validateInviteCode')
        .mockResolvedValueOnce({} as any);

      // 模拟用户已存在
      jest.spyOn(userService['userModel'], 'findOne').mockResolvedValueOnce({
        username: 'testuser',
        email: 'test@example.com',
        phone: '13800138000',
      } as any);

      await expect(
        userService.register({
          username: 'testuser',
          email: 'new@example.com',
          phone: '13900139000',
          password: 'encrypted-password',
          inviteCode: 'TESTINVITECODE1234',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a user with valid invite code', async () => {
      // 模拟邀请码验证通过
      jest
        .spyOn(inviteCodeService, 'validateInviteCode')
        .mockResolvedValueOnce({} as any);

      // 模拟用户不存在
      jest
        .spyOn(userService['userModel'], 'findOne')
        .mockResolvedValueOnce(null);

      // 模拟RSA解密
      jest.spyOn(cryptoService, 'decrypt').mockReturnValueOnce('password123');

      // 模拟密码加密
      jest
        .spyOn(authService, 'hashPassword')
        .mockResolvedValueOnce('hashedPassword');

      // 模拟用户创建和保存
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        phone: '13800138000',
        password: 'hashedPassword',
        save: jest.fn().mockResolvedValueOnce({
          _id: '123456',
          username: 'testuser',
          email: 'test@example.com',
          phone: '13800138000',
        } as any),
      };
      jest
        .spyOn(userService['userModel'], 'create')
        .mockReturnValueOnce(mockUser as any);

      // 模拟邀请码使用
      jest.spyOn(inviteCodeService, 'useInviteCode').mockResolvedValueOnce();

      const result = await userService.register({
        username: 'testuser',
        email: 'test@example.com',
        phone: '13800138000',
        password: 'encrypted-password',
        inviteCode: 'TESTINVITECODE1234',
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });
  });

  describe('findById', () => {
    it('should throw not found exception if user does not exist', async () => {
      jest
        .spyOn(userService['userModel'], 'findById')
        .mockResolvedValueOnce(null);

      await expect(userService.findById('123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user if found', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
      };
      jest
        .spyOn(userService['userModel'], 'findById')
        .mockResolvedValueOnce(mockUser as any);

      const result = await userService.findById('123');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });
  });
});
