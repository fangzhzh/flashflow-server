import { Module } from '@nestjs/common';
import { OverviewsController } from './overviews.controller';
import { OverviewsService } from './overviews.service';
import { TasksModule } from '../tasks/tasks.module';
import { FlashcardsModule } from '../flashcards/flashcards.module';

@Module({
  imports: [TasksModule, FlashcardsModule],
  controllers: [OverviewsController],
  providers: [OverviewsService],
})
export class OverviewsModule {}
