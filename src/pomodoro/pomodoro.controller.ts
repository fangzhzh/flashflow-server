import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { PomodoroService } from './pomodoro.service';
import { UpdatePomodoroDto } from './dto/update-pomodoro.dto';

@Controller('pomodoro')
@UseGuards(AuthGuard)
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Get()
  async getState(@CurrentUser() user: AuthUser) {
    return this.pomodoroService.getState(user.uid);
  }

  @Put()
  async updateState(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePomodoroDto,
  ) {
    return this.pomodoroService.updateState(user.uid, dto);
  }
}
