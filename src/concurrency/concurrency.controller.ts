import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { ConcurrencyService } from './concurrency.service';
import { IsString, IsNotEmpty } from 'class-validator';

class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  challengeId: string;

  @IsString()
  @IsNotEmpty()
  levelId: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

@Controller('concurrency')
@UseGuards(AuthGuard)
export class ConcurrencyController {
  constructor(private readonly concurrencyService: ConcurrencyService) {}

  @Get('challenges')
  async getChallenges(@CurrentUser() user: AuthUser) {
    return this.concurrencyService.getChallenges(user.uid);
  }

  @Post('verify')
  async verifyCode(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyCodeDto,
  ) {
    return this.concurrencyService.verifyCode(
      user.uid,
      dto.challengeId,
      dto.levelId,
      dto.code,
    );
  }
}
