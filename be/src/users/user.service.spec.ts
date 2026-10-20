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

  let userModelMock: any;
  let authServiceMock: any;
  let inviteCodeServiceMock: any;
  let cryptoServiceMock: any;

  beforeEach(async () => {
    // UserService 内部用 `new this.userModel(...)` 创建文档，
    // 因此模型既要是可构造的函数，也要带上静态方法。
    userModelMock = jest.fn();
    userModelMock.findOne = jest.fn();
    userModelMock.find = jest.fn();
    userModelMock.findById = jest.fn();
    userModelMock.findByIdAndUpdate = jest.fn();
    userModelMock.findByIdAndDelete = jest.fn();

    authServiceMock = {
      hashPassword: jest.fn(),
      generateToken: jest.fn(),
    };
    inviteCodeServiceMock = {
      validateInviteCode: jest.fn(),
      useInviteCode: jest.fn(),
    };
    cryptoServiceMock = {
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: InviteCodeService, useValue: inviteCodeServiceMock },
        { provide: CryptoService, useValue: cryptoServiceMock },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('register', () => {
    it('should throw conflict exception if username exists', async () => {
      inviteCodeServiceMock.validateInviteCode.mockResolvedValueOnce({});

      userModelMock.findOne.mockReturnValueOnce({
        exec: jest
          .fn()
          .mockResolvedValueOnce({ _id: '1', username: 'testuser' }),
      } as any);

      await expect(
        userService.register({
          username: 'testuser',
          password: 'encrypted-password',
          inviteCode: 'TESTINVITECODE1234',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a user with valid invite code', async () => {
      inviteCodeServiceMock.validateInviteCode.mockResolvedValueOnce({});

      userModelMock.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      cryptoServiceMock.decrypt.mockReturnValueOnce('password123');
      authServiceMock.hashPassword.mockResolvedValueOnce('hashedPassword');

      const savedUser = {
        _id: '123456',
        username: 'testuser',
        password: 'hashedPassword',
      };
      const save = jest.fn().mockResolvedValueOnce(savedUser);
      userModelMock.mockImplementationOnce(() => ({ save }));

      inviteCodeServiceMock.useInviteCode.mockResolvedValueOnce(undefined);

      const result = await userService.register({
        username: 'testuser',
        password: 'encrypted-password',
        inviteCode: 'TESTINVITECODE1234',
      });

      expect(cryptoServiceMock.decrypt).toHaveBeenCalledWith(
        'encrypted-password',
      );
      expect(authServiceMock.hashPassword).toHaveBeenCalledWith('password123');
      expect(save).toHaveBeenCalled();
      expect(inviteCodeServiceMock.useInviteCode).toHaveBeenCalledWith(
        'TESTINVITECODE1234',
        '123456',
      );
      expect(result).toBe(savedUser);
      expect(result.username).toBe('testuser');
    });
  });

  describe('findById', () => {
    it('should throw not found exception if user does not exist', async () => {
      userModelMock.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(userService.findById('123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return user if found', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
      };
      userModelMock.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      const result = await userService.findById('123');

      expect(result).toBe(mockUser);
      expect(result.username).toBe('testuser');
    });
  });
});
