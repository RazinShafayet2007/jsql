import { op } from './operators';

type OperationType = 'select' | 'insert' | 'update' | 'delete';

export class QueryBuilder {
  private _type: OperationType | null = null;
  private _table: string | null = null;
  private _select: string[] = ['*'];
  private _values: Record<string, any>[] | null = null;
  private _set: Record<string, any> = {};
  private _where: string[] = [];
  private _params: any[] = [];
  private _returning: string[] = [];
  private _orderByVal: { field: string; direction: 'ASC' | 'DESC' } | null = null;
  private _limitVal: number | null = null;

  select(...fields: string[]): this {
    this._type = 'select';
    this._select = fields.length > 0 ? fields : ['*'];
    return this;
  }

  insert(values: Record<string, any> | Record<string, any>[]): this {
    this._type = 'insert';
    if (values == null || (Array.isArray(values) && values.length === 0)) {
      throw new Error('At least one row of values is required for INSERT');
    }
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  update(setObj: Record<string, any>): this {
    this._type = 'update';
    this._set = setObj ?? {};
    return this;
  }

  delete(): this {
    this._type = 'delete';
    return this;
  }

  table(table: string): this {
    this._table = table;
    return this;
  }

  from(table: string): this {
    return this.table(table);
  }

  where(conditions: Record<string, { op: string; val: any } | any>): this {
    this._addConditions('AND', conditions);
    return this;
  }

  orWhere(conditions: Record<string, { op: string; val: any } | any>): this {
    this._addConditions('OR', conditions);
    return this;
  }

  returning(...fields: string[]): this {
    this._returning = fields.length > 0 ? fields : ['*'];
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

  private _addConditions(logicalOp: 'AND' | 'OR', conditions: Record<string, { op: string; val: any } | any>): void {
    const clauses: string[] = [];
    for (const [field, cond] of Object.entries(conditions)) {
      if (typeof cond === 'object' && cond !== null && 'op' in cond && 'val' in cond) {
        clauses.push(`${field} ${cond.op} ?`);
        this._params.push(cond.val);
      } else {
        clauses.push(`${field} = ?`);
        this._params.push(cond);
      }
    }
    if (clauses.length > 0) {
      this._where.push(`(${clauses.join(` ${logicalOp} `)})`);
    }
  }

  toSQL(): { sql: string; params: any[] } {
    if (this._type === null) {
      throw new Error('No operation specified (use select/insert/update/delete)');
    }
    if (this._table === null) {
      throw new Error('Table name is required (use db("table") or .table("table"))');
    }

    let sql = '';
    const params: any[] = [];

    if (this._type === 'select') {
      sql = `SELECT ${this._select.join(', ')} FROM ${this._table}`;
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._orderByVal) sql += ` ORDER BY ${this._orderByVal.field} ${this._orderByVal.direction}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
      params.push(...this._params);
    } else if (this._type === 'insert') {
      if (this._values === null || this._values.length === 0) {
        throw new Error('No values provided for INSERT');
      }
      const rows = this._values;
      const allKeys = new Set<string>();
      rows.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
      const keys = Array.from(allKeys);
      if (keys.length === 0) {
        throw new Error('No columns specified for INSERT');
      }
      const placeholder = `(${keys.map(() => '?').join(', ')})`;
      const placeholders = rows.map(() => placeholder).join(', ');
      sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES ${placeholders}`;
      rows.forEach(row => {
        keys.forEach(key => params.push(row[key]));
      });
    } else if (this._type === 'update') {
      const setKeys = Object.keys(this._set);
      if (setKeys.length === 0) {
        throw new Error('No fields to update (provide set object)');
      }
      const setClauses = setKeys.map(k => `${k} = ?`);
      sql = `UPDATE ${this._table} SET ${setClauses.join(', ')}`;
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
      setKeys.forEach(k => params.push(this._set[k]));
      params.push(...this._params);
    } else if (this._type === 'delete') {
      sql = `DELETE FROM ${this._table}`;
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
      params.push(...this._params);
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return { sql, params };
  }
}

export const db = (table?: string): QueryBuilder => {
  const builder = new QueryBuilder();
  if (table) builder.table(table);
  return builder;
};