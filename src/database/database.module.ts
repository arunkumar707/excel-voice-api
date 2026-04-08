import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelWorkbook } from '../entities/excel-workbook.entity';
import { FarmerRow } from '../entities/farmer-row.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: parseInt(config.get<string>('DB_PORT', '3306'), 10),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'excelcusor'),
        entities: [User, ExcelWorkbook, FarmerRow],
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
