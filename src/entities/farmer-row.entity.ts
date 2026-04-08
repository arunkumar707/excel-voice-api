import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExcelWorkbook } from './excel-workbook.entity';

@Entity('farmer_row')
@Index(['excelWorkbookId', 'rowIndex'], { unique: true })
export class FarmerRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'excel_workbook_id' })
  excelWorkbookId: number;

  @ManyToOne(() => ExcelWorkbook, (w) => w.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'excel_workbook_id' })
  workbook: ExcelWorkbook;

  /** Excel row number (1-based), same as UI. */
  @Column({ name: 'row_index' })
  rowIndex: number;

  @Column({ name: 'farmer_name', type: 'varchar', length: 512, nullable: true })
  farmerName: string | null;

  @Column({ name: 'village_name', type: 'varchar', length: 512, nullable: true })
  villageName: string | null;

  @Column({ name: 'joining_date', type: 'varchar', length: 64, nullable: true })
  joiningDate: string | null;

  @Column({ name: 'ai', type: 'varchar', length: 64, nullable: true })
  ai: string | null;

  @Column({ name: 'mm', type: 'varchar', length: 64, nullable: true })
  mm: string | null;

  @Column({ name: 'mobile_number', type: 'varchar', length: 64, nullable: true })
  mobileNumber: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
