import { op } from './operators';
import type { TableSchema } from './schema';

type OperationType = 'select' | 'insert' | 'update' | 'delete';
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

interface JoinClause {
  type: JoinType;
  table: string;
  on: string;
  onParams: any[];
}

interface CteClause {
  name: string;
  builder: QueryBuilder<any>;
}

type Dialect = 'postgres' | 'mysql' | 'sqlite';

export class QueryBuilder<T = any> {
  private _type: OperationType | null = null;
  private _table: string | null = null;
  private _select: string[] = [];
  private _values: Partial<T>[] | null = null;
  private _set: Partial<T> = {};
  private _where: string[] = [];
  private _params: any[] = [];
  private _joins: JoinClause[] = [];
  private _ctes: CteClause[] = [];
  private _groupBy: string[] = [];
  private _having: string[] = [];
  private _havingParams: any[] = [];
  private _returning: string[] = [];
  private _orderByVal: { field: string; direction: 'ASC' | 'DESC' } | null = null;
  private _limitVal: number | null = null;
  private _offsetVal: number | null = null;
  private _dialect: Dialect = 'postgres';

  constructor(private _schema?: TableSchema<T>) { }

  select(...fields: (keyof T | '*')[]): this {
    this._type = 'select';
    this._select = fields.length > 0 ? fields as string[] : ['*'];
    return this;
  }

  count(column: keyof T | '*' = '*'): this {
    this._type = 'select';
    this._select.push(`COUNT(${column as string})`);
    return this;
  }

  sum(column: keyof T): this {
    this._type = 'select';
    this._select.push(`SUM(${column as string})`);
    return this;
  }

  avg(column: keyof T): this {
    this._type = 'select';
    this._select.push(`AVG(${column as string})`);
    return this;
  }

  min(column: keyof T): this {
    this._type = 'select';
    this._select.push(`MIN(${column as string})`);
    return this;
  }

  max(column: keyof T): this {
    this._type = 'select';
    this._select.push(`MAX(${column as string})`);
    return this;
  }

  rowNumber(over: string): this {
    this._type = 'select';
    this._select.push(`ROW_NUMBER() OVER (${over})`);
    return this;
  }

  rank(over: string): this {
    this._type = 'select';
    this._select.push(`RANK() OVER (${over})`);
    return this;
  }

  denseRank(over: string): this {
    this._type = 'select';
    this._select.push(`DENSE_RANK() OVER (${over})`);
    return this;
  }

  insert(values: Partial<T> | Partial<T>[]): this {
    this._type = 'insert';
    if (!values || (Array.isArray(values) && values.length === 0)) {
      throw new Error('At least one row required for INSERT');
    }
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  update(setObj: Partial<T>): this {
    this._type = 'update';
    if (!setObj || Object.keys(setObj).length === 0) {
      throw new Error('SET object cannot be empty for UPDATE');
    }
    this._set = setObj;
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

  where(conditions: Partial<T> | QueryBuilder<any>): this {
    this._addConditions('AND', conditions);
    return this;
  }

  orWhere(conditions: Partial<T> | QueryBuilder<any>): this {
    this._addConditions('OR', conditions);
    return this;
  }

  having(conditions: Partial<T>): this {
    this._addConditions('AND', conditions, true);
    return this;
  }

  groupBy(...fields: string[]): this {
    this._groupBy = fields;
    return this;
  }

  innerJoin(table: string, onLeft: string, onRight: string): this;
  innerJoin(table: string, on: Record<string, any>): this;
  innerJoin(table: string, onLeftOrObj: string | Record<string, any>, onRight?: string): this {
    return this._addJoin('INNER', table, onLeftOrObj, onRight);
  }

  leftJoin(table: string, onLeft: string, onRight: string): this;
  leftJoin(table: string, on: Record<string, any>): this;
  leftJoin(table: string, onLeftOrObj: string | Record<string, any>, onRight?: string): this {
    return this._addJoin('LEFT', table, onLeftOrObj, onRight);
  }

  rightJoin(table: string, onLeft: string, onRight: string): this;
  rightJoin(table: string, on: Record<string, any>): this;
  rightJoin(table: string, onLeftOrObj: string | Record<string, any>, onRight?: string): this {
    return this._addJoin('RIGHT', table, onLeftOrObj, onRight);
  }

  fullJoin(table: string, onLeft: string, onRight: string): this;
  fullJoin(table: string, on: Record<string, any>): this;
  fullJoin(table: string, onLeftOrObj: string | Record<string, any>, onRight?: string): this {
    return this._addJoin('FULL', table, onLeftOrObj, onRight);
  }

  with(cteName: string, builder: QueryBuilder<any>): this {
    this._ctes.push({ name: cteName, builder });
    return this;
  }

  dialect(dialect: Dialect): this {
    this._dialect = dialect;
    return this;
  }

  offset(offset: number): this {
    this._offsetVal = offset;
    return this;
  }

  private _addJoin(type: JoinType, table: string, onLeftOrObj: string | Record<string, any>, onRight?: string): this {
    const onClauses: string[] = [];
    const onParams: any[] = [];

    if (typeof onLeftOrObj === 'string' && onRight !== undefined) {
      onClauses.push(`${onLeftOrObj} = ${onRight}`);
    } else if (typeof onLeftOrObj === 'object') {
      for (const [left, right] of Object.entries(onLeftOrObj)) {
        if (typeof right === 'object' && right !== null && 'op' in right && 'val' in right) {
          if (right.val instanceof QueryBuilder && ['IN', 'NOT IN'].includes(right.op)) {
            const { sql: subSql, params: subParams } = right.val.toSQL();
            onClauses.push(`${left} ${right.op} (${subSql})`);
            onParams.push(...subParams);
          } else {
            onClauses.push(`${left} ${right.op} ?`);
            onParams.push(right.val);
          }
        } else {
          onClauses.push(`${left} = ?`);
          onParams.push(right);
        }
      }
    }

    const on = onClauses.join(' AND ');
    this._joins.push({ type, table, on, onParams });
    this._params.push(...onParams);
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

  private _addConditions(logicalOp: 'AND' | 'OR', conditions: Record<string, any> | QueryBuilder<any>, isHaving = false): void {
    const target = isHaving ? this._having : this._where;
    const targetParams = isHaving ? this._havingParams : this._params;

    if (conditions instanceof QueryBuilder) {
      const { sql, params } = conditions.toSQL();
      target.push(`(${sql})`);
      targetParams.push(...params);
      return;
    }

    const clauses: string[] = [];
    for (const [field, cond] of Object.entries(conditions)) {
      if (typeof cond === 'object' && cond !== null && 'op' in cond && 'val' in cond) {
        if (cond.val instanceof QueryBuilder) {
          const { sql: subSql, params: subParams } = cond.val.toSQL();
          clauses.push(`${field} ${cond.op} (${subSql})`);
          targetParams.push(...subParams);
        } else {
          clauses.push(`${field} ${cond.op} ?`);
          targetParams.push(cond.val);
        }
      } else {
        clauses.push(`${field} = ?`);
        targetParams.push(cond);
      }
    }
    if (clauses.length > 0) {
      target.push(`(${clauses.join(` ${logicalOp} `)})`);
    }
  }

  toSQL(): { sql: string; params: any[] } {
    // Default to SELECT * if no explicit operation but table is set (common/intuitive pattern)
    if (this._type === null) {
      if (this._table === null && this._ctes.length === 0) {
        throw new Error('Table required');
      }
      this._type = 'select';
      this._select = ['*'];
    }

    let sql = '';
    const params: any[] = [];

    if (this._ctes.length > 0) {
      sql += 'WITH ';
      sql += this._ctes.map(cte => {
        const { sql: cteSql, params: cteParams } = cte.builder.toSQL();
        params.push(...cteParams);
        return `${cte.name} AS (${cteSql})`;
      }).join(', ');
      sql += ' ';
    }

    if (this._type === 'select') {
      sql += `SELECT ${this._select.join(', ')} FROM ${this._table}`;
      this._joins.forEach(j => sql += ` ${j.type} JOIN ${j.table} ON ${j.on}`);
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._groupBy.length > 0) sql += ` GROUP BY ${this._groupBy.join(', ')}`;
      if (this._having.length > 0) sql += ` HAVING ${this._having.join(' AND ')}`;
      if (this._orderByVal) sql += ` ORDER BY ${this._orderByVal.field} ${this._orderByVal.direction}`;

      if (this._limitVal !== null) {
        if (this._dialect === 'mysql' || this._dialect === 'sqlite') {
          sql += ` LIMIT ${this._limitVal}`;
          if (this._offsetVal !== null) sql += ` OFFSET ${this._offsetVal}`;
        } else { // postgres
          sql += ` LIMIT ${this._limitVal}`;
          if (this._offsetVal !== null) sql += ` OFFSET ${this._offsetVal}`;
        }
      } else if (this._offsetVal !== null) { // Offset without limit (some dialects allow this or treat it differently, standard PG supports it)
        sql += ` OFFSET ${this._offsetVal}`;
      }

      params.push(...this._params, ...this._havingParams);
    } else if (this._type === 'insert') {
      if (this._values === null || this._values.length === 0) throw new Error('No values for INSERT');
      const rows = this._values;
      const allKeys = new Set<string>();
      rows.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
      const keys = Array.from(allKeys);
      if (keys.length === 0) throw new Error('No columns for INSERT');
      const placeholder = `(${keys.map(() => '?').join(', ')})`;
      const placeholders = rows.map(() => placeholder).join(', ');
      sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES ${placeholders}`;
      rows.forEach(row => keys.forEach(k => params.push((row as any)[k] ?? undefined)));
    } else if (this._type === 'update') {
      const setKeys = Object.keys(this._set);
      const setClauses = setKeys.map(k => `${k} = ?`);
      sql = `UPDATE ${this._table} SET ${setClauses.join(', ')}`;
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
      setKeys.forEach(k => params.push((this._set as any)[k]));
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

  async exec(client: any): Promise<any> {
    const { sql, params } = this.toSQL();
    let result;
    if (typeof client.query === 'function') {
      result = await client.query(sql, params);
    } else if (typeof client.execute === 'function') {
      [result] = await client.execute(sql, params);
    } else {
      throw new Error('Unsupported client');
    }
    return 'rows' in result ? result.rows : result;
  }
}

export async function transaction(client: any, callback: (tx: QueryBuilder<any>) => Promise<void>): Promise<void> {
  try {
    await client.query('BEGIN');
    const tx = new QueryBuilder();
    await callback(tx);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export const db = <T = any>(table?: string, schema?: TableSchema<T>): QueryBuilder<T> => {
  const builder = new QueryBuilder<T>(schema);
  if (table) builder.table(table);
  return builder;
};