import { IsString, IsOptional } from 'class-validator';

export class CreateOverviewDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  artifactLink?: any;
}
