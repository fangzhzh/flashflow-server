import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Controller('flashcards')
@UseGuards(AuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('deckId') deckId?: string,
  ) {
    return this.flashcardsService.findAll(user.uid, deckId);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create(user.uid, dto);
  }

  @Post('batch')
  async createBatch(
    @CurrentUser() user: AuthUser,
    @Body() dtos: CreateFlashcardDto[],
  ) {
    return this.flashcardsService.createBatch(user.uid, dtos);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.update(user.uid, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.flashcardsService.delete(user.uid, id);
  }
}
