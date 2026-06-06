import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  front: string;

  @IsString()
  back: string;

  @IsOptional()
  @IsString()
  deckId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  interval?: number;

  @IsOptional()
  @IsString()
  nextReviewDate?: string;

  @IsOptional()
  @IsString()
  lastReviewed?: string;
}
