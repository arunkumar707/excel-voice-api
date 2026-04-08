import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FarmerRow } from './farmer-row.entity';
import { User } from './user.entity';

@Entity('excel_workbook')
@Unique('UQ_workbook_owner_name', ['ownerId', 'name'])
export class ExcelWorkbook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User, (u) => u.workbooks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'owner_id' })
  owner: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => FarmerRow, (r) => r.workbook, { cascade: true })
  rows: FarmerRow[];
}
