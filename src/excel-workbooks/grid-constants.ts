/** Seven data columns (A–G); download uses these headers only, width 25 each. */
export const HEADER_ROW = 1;
export const GRID_COL_COUNT = 7;
/** Minimum data rows returned / padded; max total data rows per sheet. */
export const MIN_DATA_ROWS = 1000;
export const MAX_DATA_ROWS = 1000;
export const SHEET_NAME = 'Data Entry Format';

export function headerCells(): string[] {
  return [
    'Sl.no',
    'Name of the farmer',
    'Village Name',
    'Joining date',
    'AI',
    'MM',
    'Phone number',
  ];
}

export function cellToString(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}
