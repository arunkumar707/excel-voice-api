import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/jwt-payload.types';
import { ExcelWorkbooksService } from './excel-workbooks.service';

@Controller('excel-workbooks')
@UseGuards(JwtAuthGuard)
export class ExcelWorkbooksController {
  constructor(private readonly svc: ExcelWorkbooksService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('q') q?: string) {
    return this.svc.findAll(user, q);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: { name?: string }) {
    return this.svc.create(body.name ?? '', user);
  }

  @Get(':id/grid')
  async grid(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.svc.getGrid(id, user);
  }

  @Put(':id/grid')
  async putGrid(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { grid?: unknown[][] },
    @CurrentUser() user: JwtUser,
  ) {
    if (!body.grid) {
      throw new BadRequestException('grid required');
    }
    return this.svc.saveGrid(id, body.grid, user);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: false }) res: Response,
  ) {
    const buf = await this.svc.buildXlsxBuffer(id, user);
    const wb = await this.svc.findOne(id, user);
    const safe = wb.name.replace(/[^\w\-. ]+/g, '_').slice(0, 80);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safe}.xlsx"`,
    );
    res.send(buf);
  }

  @Post(':id/rows')
  saveRow(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      excelRow: number;
      columns: string[];
      values: (string | number | null)[];
    },
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.saveRowSnapshot(id, body, user);
  }

  @Get(':id')
  async one(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    const w = await this.svc.findOne(id, user);
    return { id: w.id, name: w.name, createdAt: w.createdAt };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    await this.svc.remove(id, user);
    return { ok: true };
  }
}
