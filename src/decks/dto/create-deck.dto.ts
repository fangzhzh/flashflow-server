import { IsString } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  name: string;
}
