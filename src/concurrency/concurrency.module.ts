import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { ConcurrencyController } from './concurrency.controller';
import { ConcurrencyService } from './concurrency.service';

@Module({
  imports: [FirebaseModule],
  controllers: [ConcurrencyController],
  providers: [ConcurrencyService],
  exports: [ConcurrencyService],
})
export class ConcurrencyModule {}
