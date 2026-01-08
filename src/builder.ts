import { op } from './operators';

type OperationType = 'select' | 'insert' | 'update' | 'delete' | null;

export class QueryBuilder {
  private _type: OperationType = null;
  private _table: string | null = null;
  private _select: string[] = ['*'];
  private _values: Record<string, any> | Record<string, any>[] | null = null;
  private _set: Record<string, any> = {};
  private _where: string[] = [];
  private _params: any[] = [];
  private _returning: string[] = [];
  private _orderByVal: { field: string; direction: string } | null = null;
  private _limitVal: number | null = null;

  select(...fields: string[]): this {
    this._type = 'select';
    this._select = fields.length ? fields : ['*'];
    return this;
  }

  insert(table: string, values: Record<string, any> | Record<string, any>[]): this {
    this._type = 'insert';
    this._table = table;
    this._values = values;
    return this;
  }

  update(table: string, setObj: Record<string, any>): this {
    this._type = 'update';
    this._table = table;
    this._set = setObj;
    return this;
  }

  delete(table: string): this {
    this._type = 'delete';
    this._table = table;
    return this;
  }

  table(table: string): this {
    this._table = table;
    return this;
  }

  where(conditions: Record<string, any>): this {
    this._addConditions('AND', conditions);
    return this;
  }

  orWhere(conditions: Record<string, any>): this {
    this._addConditions('OR', conditions);
    return this;
  }

  returning(...fields: string[]): this {
    this._returning = fields.length ? fields : ['*'];
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderByVal = { field, direction };
    return this;
  }

  limit(count: number): this {
    this._limitVal = count;
    return this;
  }

  private _addConditions(logicalOp: 'AND' | 'OR', conditions: Record<string, any>): void {
    const clauses: string[] = [];
    for (const [field, cond] of Object.entries(conditions)) {
      if (typeof cond === 'object' && 'op' in cond) {
        clauses.push(`${field} ${cond.op} ?`);
        this._params.push(cond.val);
      } else {
        clauses.push(`${field} = ?`);
        this._params.push(cond);
      }
    }
    if (clauses.length) {
      this._where.push(`(${clauses.join(` ${logicalOp} `)})`);
    }
  }

  toSQL(): { sql: string; params: any[] } {
    if (!this._table && this._type !== 'select') throw new Error('Table required');
    if (!this._type) throw new Error('No operation specified');

    let sql = '';
    const params = [...this._params];

    if (this._type === 'select') {
      sql = `SELECT ${this._select.join(', ')} FROM ${this._table}`;
      if (this._where.length) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._orderByVal) sql += ` ORDER BY ${this._orderByVal.field} ${this._orderByVal.direction}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
    } else if (this._type === 'insert') {
      const isMulti = Array.isArray(this._values);
      const rows = isMulti ? this._values : [this._values!];
      const keys = Object.keys(rows[0]);
      const placeholders = rows.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
      sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES ${placeholders}`;
      rows.forEach(row => keys.forEach(k => params.push(row[k])));
    } else if (this._type === 'update') {
      const setClauses = Object.keys(this._set).map(k => `${k} = ?`);
      Object.values(this._set).forEach(v => params.push(v));
      sql = `UPDATE ${this._table} SET ${setClauses.join(', ')}`;
      if (this._where.length) sql += ` WHERE ${this._where.join(' AND ')}`;
    } else if (this._type === 'delete') {
      sql = `DELETE FROM ${this._table}`;
      if (this._where.length) sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    if (this._returning.length) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return { sql, params };
  }
}

export const db = (): QueryBuilder => new QueryBuilder();
