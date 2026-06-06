import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  overviewId?: string;

  @IsOptional()
  @IsString()
  repeat?: string;

  @IsOptional()
  @IsBoolean()
  isSilent?: boolean;

  @IsOptional()
  timeInfo?: any;

  @IsOptional()
  artifactLink?: any;

  @IsOptional()
  reminderInfo?: any;

  @IsOptional()
  checkinInfo?: any;
}
