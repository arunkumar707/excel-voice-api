import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ExcelWorkbook } from '../entities/excel-workbook.entity';
import { FarmerRow } from '../entities/farmer-row.entity';
import { ExcelWorkbooksController } from './excel-workbooks.controller';
import { ExcelWorkbooksService } from './excel-workbooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExcelWorkbook, FarmerRow]), AuthModule],
  controllers: [ExcelWorkbooksController],
  providers: [ExcelWorkbooksService],
  exports: [ExcelWorkbooksService],
})
export class ExcelWorkbooksModule {}
