export type TableCell = string | number | boolean;

export interface TableColumn {
  key: string;
  label: string;
}

export type TableRow = Record<string, TableCell>;
