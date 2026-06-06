import { Module } from '@nestjs/common';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { FlashcardsModule } from '../flashcards/flashcards.module';

@Module({
  imports: [FlashcardsModule],
  controllers: [DecksController],
  providers: [DecksService],
})
export class DecksModule {}
