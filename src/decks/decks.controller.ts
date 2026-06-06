import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Controller('decks')
@UseGuards(AuthGuard)
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.decksService.findAll(user.uid);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDeckDto,
  ) {
    return this.decksService.create(user.uid, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.decksService.update(user.uid, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.decksService.delete(user.uid, id);
  }
}
