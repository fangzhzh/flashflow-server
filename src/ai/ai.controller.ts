import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('decompose')
  async decompose(
    @CurrentUser() user: AuthUser,
    @Body() body: { cards: { id: string; front: string; back: string }[] },
  ) {
    try {
      return await this.aiService.decompose(body.cards);
    } catch (error) {
      this.logger.error('[decompose]', error);
      throw new HttpException(
        { error: String(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('github-review')
  async githubReview(
    @CurrentUser() user: AuthUser,
    @Body() body: { variation?: number },
  ) {
    try {
      const variation =
        body?.variation && typeof body.variation === 'number'
          ? body.variation
          : 1;
      return await this.aiService.githubReview(variation);
    } catch (error) {
      this.logger.error('[github-review]', error);
      throw new HttpException(
        { error: String(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
