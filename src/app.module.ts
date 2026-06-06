import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { DecksModule } from './decks/decks.module';
import { TasksModule } from './tasks/tasks.module';
import { OverviewsModule } from './overviews/overviews.module';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { AiModule } from './ai/ai.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    FirebaseModule,
    AuthModule,
    FlashcardsModule,
    DecksModule,
    TasksModule,
    OverviewsModule,
    PomodoroModule,
    AiModule,
  ],
})
export class AppModule {}
