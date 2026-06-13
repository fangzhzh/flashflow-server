import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class UpdatePomodoroDto {
  @IsOptional()
  @IsString()
  @IsIn(['running', 'paused', 'idle'])
  status?: 'running' | 'paused' | 'idle';

  @IsOptional()
  @IsNumber()
  targetEndTime?: number | null;

  @IsOptional()
  @IsNumber()
  pausedTimeLeftSeconds?: number | null;

  @IsOptional()
  @IsNumber()
  currentSessionInitialDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  userPreferredDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  userPreferredRestDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  restTargetEndTime?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currentTaskTitle?: string | null;
}
