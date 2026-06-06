import { IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class UpdatePomodoroDto {
  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  timeLeft?: number;

  @IsOptional()
  @IsBoolean()
  isRunning?: boolean;

  @IsOptional()
  @IsNumber()
  workDuration?: number;

  @IsOptional()
  @IsNumber()
  breakDuration?: number;

  @IsOptional()
  @IsNumber()
  longBreakDuration?: number;

  @IsOptional()
  @IsNumber()
  sessionsBeforeLongBreak?: number;

  @IsOptional()
  @IsNumber()
  completedSessions?: number;

  @IsOptional()
  @IsString()
  currentTaskId?: string;

  @IsOptional()
  @IsString()
  currentTaskTitle?: string;

  @IsOptional()
  @IsArray()
  sessionLog?: any[];

  @IsOptional()
  @IsNumber()
  startedAt?: number;

  @IsOptional()
  @IsNumber()
  pausedAt?: number;
}
