import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InviteCode, InviteCodeDocument } from './invite-code.schema';

@Injectable()
export class InviteCodeService {
  constructor(
    @InjectModel(InviteCode.name)
    private inviteCodeModel: Model<InviteCodeDocument>,
  ) {}

  /**
   * 生成指定数量的邀请码
   */
  async generateInviteCodes(count: number): Promise<InviteCode[]> {
    const codes: InviteCode[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode(16);
      const inviteCode = new this.inviteCodeModel({
        code,
        isUsed: false,
      });
      codes.push(await inviteCode.save());
    }
    return codes;
  }

  /**
   * 生成随机邀请码
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 验证邀请码是否有效
   */
  async validateInviteCode(code: string): Promise<InviteCodeDocument> {
    const inviteCode = await this.inviteCodeModel
      .findOne({ code, isUsed: false })
      .exec();
    if (!inviteCode) {
      throw new NotFoundException('邀请码无效或已被使用');
    }
    return inviteCode;
  }

  /**
   * 使用邀请码
   */
  async useInviteCode(code: string, userId: Types.ObjectId): Promise<void> {
    // 首先检查邀请码是否存在且未使用
    const inviteCode = await this.inviteCodeModel
      .findOne({ code, isUsed: false })
      .exec();
    if (!inviteCode) {
      throw new NotFoundException('邀请码无效或已被使用');
    }

    // 使用 findByIdAndUpdate 进行原子性更新，并返回更新后的文档
    const updatedInviteCode = await this.inviteCodeModel
      .findByIdAndUpdate(
        inviteCode._id,
        {
          isUsed: true,
          usedBy: userId,
          usedAt: new Date(),
        },
        { new: true }, // 返回更新后的文档
      )
      .exec();

    // 验证更新是否成功
    if (!updatedInviteCode || !updatedInviteCode.isUsed) {
      throw new Error('邀请码状态更新失败');
    }

    console.log(`邀请码 ${code} 已被用户 ${userId} 成功使用`);
  }

  /**
   * 获取所有邀请码
   */
  async getAllInviteCodes(): Promise<InviteCodeDocument[]> {
    return this.inviteCodeModel.find().populate('usedBy').exec();
  }

  /**
   * 获取邀请码使用情况统计
   */
  async getInviteCodeStats(): Promise<{
    total: number;
    used: number;
    unused: number;
  }> {
    const total = await this.inviteCodeModel.countDocuments().exec();
    const used = await this.inviteCodeModel
      .countDocuments({ isUsed: true })
      .exec();
    return {
      total,
      used,
      unused: total - used,
    };
  }
}
