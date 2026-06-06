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
import { OverviewsService } from './overviews.service';
import { CreateOverviewDto } from './dto/create-overview.dto';
import { UpdateOverviewDto } from './dto/update-overview.dto';

@Controller('overviews')
@UseGuards(AuthGuard)
export class OverviewsController {
  constructor(private readonly overviewsService: OverviewsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.overviewsService.findAll(user.uid);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.overviewsService.findOne(user.uid, id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOverviewDto,
  ) {
    return this.overviewsService.create(user.uid, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOverviewDto,
  ) {
    return this.overviewsService.update(user.uid, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.overviewsService.delete(user.uid, id);
  }
}
