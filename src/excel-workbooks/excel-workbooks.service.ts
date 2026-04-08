import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import type { JwtUser } from '../auth/jwt-payload.types';
import { ExcelWorkbook } from '../entities/excel-workbook.entity';
import { UserRole } from '../entities/user.entity';
import { FarmerRow } from '../entities/farmer-row.entity';
import {
  cellToString,
  GRID_COL_COUNT,
  HEADER_ROW,
  headerCells,
  MAX_DATA_ROWS,
  MIN_DATA_ROWS,
  SHEET_NAME,
} from './grid-constants';

function padRow<T>(row: T[], width: number, fill: T): T[] {
  const n = [...row];
  while (n.length < width) n.push(fill);
  return n;
}

function stripLegacyBlankColumnA(cells: unknown[]): unknown[] {
  if (!Array.isArray(cells) || cells.length < 8) return cells;
  const first = cells[0];
  const empty =
    first === null ||
    first === undefined ||
    (typeof first === 'string' && first.trim() === '');
  if (empty) return cells.slice(1);
  return cells;
}

@Injectable()
export class ExcelWorkbooksService {
  constructor(
    @InjectRepository(ExcelWorkbook)
    private readonly wbRepo: Repository<ExcelWorkbook>,
    @InjectRepository(FarmerRow)
    private readonly rowRepo: Repository<FarmerRow>,
  ) {}

  private assertCanAccess(wb: ExcelWorkbook, user: JwtUser): void {
    if (user.role === UserRole.SUPER_ADMIN) return;
    if (wb.ownerId == null) {
      throw new ForbiddenException('This workbook is not assigned to a user');
    }
    if (wb.ownerId !== user.sub) {
      throw new ForbiddenException('You can only access your own workbooks');
    }
  }

  async create(name: string, user: JwtUser): Promise<ExcelWorkbook> {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new BadRequestException('name is required');
    }
    const exists = await this.wbRepo.findOne({
      where: { name: trimmed, ownerId: user.sub },
    });
    if (exists) {
      throw new BadRequestException('An Excel with this name already exists');
    }
    const wb = this.wbRepo.create({
      name: trimmed,
      ownerId: user.sub,
    });
    return this.wbRepo.save(wb);
  }

  async findAll(user: JwtUser, q?: string): Promise<ExcelWorkbook[]> {
    const qb = this.wbRepo
      .createQueryBuilder('w')
      .orderBy('w.createdAt', 'DESC');
    if (user.role === UserRole.SUPER_ADMIN) {
      if (q?.trim()) {
        qb.where('w.name LIKE :q', { q: `%${q.trim()}%` });
      }
    } else {
      qb.where('w.owner_id = :oid', { oid: user.sub });
      if (q?.trim()) {
        qb.andWhere('w.name LIKE :q', { q: `%${q.trim()}%` });
      }
    }
    return qb.getMany();
  }

  async findOne(id: number, user: JwtUser): Promise<ExcelWorkbook> {
    const w = await this.wbRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException(`Workbook ${id} not found`);
    this.assertCanAccess(w, user);
    return w;
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    const w = await this.findOne(id, user);
    await this.wbRepo.remove(w);
  }

  async getGrid(
    id: number,
    user: JwtUser,
  ): Promise<{
    sheetName: string;
    headerRow: number;
    grid: (string | number | null)[][];
  }> {
    await this.findOne(id, user);
    const rows = await this.rowRepo.find({
      where: { excelWorkbookId: id },
      order: { rowIndex: 'ASC' },
    });
    const byRow = new Map(rows.map((r) => [r.rowIndex, r]));
    let maxExcelRow = HEADER_ROW + MIN_DATA_ROWS;
    for (const r of rows) {
      maxExcelRow = Math.max(maxExcelRow, r.rowIndex);
    }
    const maxAllowedExcelRow = HEADER_ROW + MAX_DATA_ROWS;
    if (maxExcelRow > maxAllowedExcelRow) {
      maxExcelRow = maxAllowedExcelRow;
    }
    const width = GRID_COL_COUNT;
    const header = padRow([...headerCells()], width, null);
    const grid: (string | number | null)[][] = [header];
    for (let excelRow = HEADER_ROW + 1; excelRow <= maxExcelRow; excelRow++) {
      const fr = byRow.get(excelRow);
      const row: (string | number | null)[] = Array(width).fill(null);
      if (fr) {
        row[0] = fr.farmerName;
        row[1] = fr.villageName;
        row[2] = fr.mobileNumber;
        row[3] = fr.joiningDate;
        row[4] = fr.ai;
        row[5] = fr.mm;
      }
      grid.push(row);
    }
    return { sheetName: SHEET_NAME, headerRow: HEADER_ROW, grid };
  }

  async saveGrid(
    id: number,
    grid: unknown[][],
    user: JwtUser,
  ): Promise<{ ok: boolean }> {
    await this.findOne(id, user);
    if (!Array.isArray(grid) || grid.length === 0) {
      throw new BadRequestException('Invalid grid');
    }
    const maxRows = HEADER_ROW + MAX_DATA_ROWS;
    if (grid.length > maxRows) {
      throw new BadRequestException(
        `Maximum ${MAX_DATA_ROWS} data rows per sheet (${maxRows} total rows including header)`,
      );
    }
    await this.rowRepo.manager.transaction(async (em) => {
      await em.delete(FarmerRow, { excelWorkbookId: id });
      for (let ri = 0; ri < grid.length; ri++) {
        const excelRow = ri + 1;
        if (excelRow <= HEADER_ROW) continue;
        const cells = stripLegacyBlankColumnA(grid[ri]);
        if (!Array.isArray(cells)) continue;
        const has = [0, 1, 2, 3, 4, 5].some((c) => {
          const v = cells[c];
          return v !== null && v !== undefined && String(v).trim() !== '';
        });
        if (!has) continue;
        const ent = em.create(FarmerRow, {
          excelWorkbookId: id,
          rowIndex: excelRow,
          farmerName: cellToString(cells[0]),
          villageName: cellToString(cells[1]),
          mobileNumber: cellToString(cells[2]),
          joiningDate: cellToString(cells[3]),
          ai: cellToString(cells[4]),
          mm: cellToString(cells[5]),
        });
        await em.save(FarmerRow, ent);
      }
    });
    return { ok: true };
  }

  async buildXlsxBuffer(id: number, user: JwtUser): Promise<Buffer> {
    await this.findOne(id, user);
    const rows = await this.rowRepo.find({
      where: { excelWorkbookId: id },
      order: { rowIndex: 'ASC' },
    });
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet(SHEET_NAME);
    const hdr = headerCells();
    hdr.forEach((h, i) => {
      sheet.getRow(1).getCell(i + 1).value = h;
    });
    for (let c = 1; c <= GRID_COL_COUNT; c++) {
      sheet.getColumn(c).width = 25;
    }
    const maxExcelRow = HEADER_ROW + MAX_DATA_ROWS;
    for (const fr of rows) {
      if (fr.rowIndex > maxExcelRow) continue;
      const r = sheet.getRow(fr.rowIndex);
      r.getCell(1).value = fr.farmerName ?? '';
      r.getCell(2).value = fr.villageName ?? '';
      r.getCell(3).value = fr.mobileNumber ?? '';
      r.getCell(4).value = fr.joiningDate ?? '';
      r.getCell(5).value = fr.ai ?? '';
      r.getCell(6).value = fr.mm ?? '';
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async saveRowSnapshot(
    workbookId: number,
    dto: {
      excelRow: number;
      columns: string[];
      values: (string | number | null)[];
    },
    user: JwtUser,
  ): Promise<{ ok: boolean }> {
    await this.findOne(workbookId, user);
    const maxExcelRow = HEADER_ROW + MAX_DATA_ROWS;
    if (dto.excelRow > maxExcelRow) {
      throw new BadRequestException(
        `Row cannot exceed ${MAX_DATA_ROWS} data rows (Excel row ${maxExcelRow})`,
      );
    }
    const v = stripLegacyBlankColumnA(dto.values);
    await this.rowRepo.delete({
      excelWorkbookId: workbookId,
      rowIndex: dto.excelRow,
    });
    const has = [0, 1, 2, 3, 4, 5].some((c) => {
      if (c >= v.length) return false;
      const x = v[c];
      return x !== null && x !== undefined && String(x).trim() !== '';
    });
    if (!has) return { ok: true };
    const ent = this.rowRepo.create({
      excelWorkbookId: workbookId,
      rowIndex: dto.excelRow,
      farmerName: v.length > 0 ? cellToString(v[0]) : null,
      villageName: v.length > 1 ? cellToString(v[1]) : null,
      mobileNumber: v.length > 2 ? cellToString(v[2]) : null,
      joiningDate: v.length > 3 ? cellToString(v[3]) : null,
      ai: v.length > 4 ? cellToString(v[4]) : null,
      mm: v.length > 5 ? cellToString(v[5]) : null,
    });
    await this.rowRepo.save(ent);
    return { ok: true };
  }
}
