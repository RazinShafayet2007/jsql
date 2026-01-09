import { op } from './operators';

type OperationType = 'select' | 'insert' | 'update' | 'delete';
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

interface JoinClause {
  type: JoinType;
  table: string;
  on: string;
  onParams: any[];
}

export class QueryBuilder {
  private _type: OperationType | null = null;
  private _table: string | null = null;
  private _select: string[] = ['*'];
  private _values: Record<string, any>[] | null = null;
  private _set: Record<string, any> = {};
  private _where: string[] = [];
  private _params: any[] = [];
  private _joins: JoinClause[] = [];
  private _groupBy: string[] = [];
  private _having: string[] = [];
  private _havingParams: any[] = [];
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
    if (!values || (Array.isArray(values) && values.length === 0)) {
      throw new Error('At least one row required for INSERT');
    }
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  update(setObj: Record<string, any>): this {
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

  where(conditions: Record<string, any> | QueryBuilder): this {
    this._addConditions('AND', conditions);
    return this;
  }

  orWhere(conditions: Record<string, any> | QueryBuilder): this {
    this._addConditions('OR', conditions);
    return this;
  }

  having(conditions: Record<string, any>): this {
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

  private _addConditions(logicalOp: 'AND' | 'OR', conditions: Record<string, any> | QueryBuilder, isHaving = false): void {
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
      if (this._table === null) {
        throw new Error('Table required');
      }
      this._type = 'select';
      this._select = ['*'];
    }
  
    let sql = '';
    const params: any[] = [];
  
    if (this._type === 'select') {
      sql = `SELECT ${this._select.join(', ')} FROM ${this._table}`;
      this._joins.forEach(j => sql += ` ${j.type} JOIN ${j.table} ON ${j.on}`);
      if (this._where.length > 0) sql += ` WHERE ${this._where.join(' AND ')}`;
      if (this._groupBy.length > 0) sql += ` GROUP BY ${this._groupBy.join(', ')}`;
      if (this._having.length > 0) sql += ` HAVING ${this._having.join(' AND ')}`;
      if (this._orderByVal) sql += ` ORDER BY ${this._orderByVal.field} ${this._orderByVal.direction}`;
      if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
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
      rows.forEach(row => keys.forEach(k => params.push(row[k] ?? undefined)));
    } else if (this._type === 'update') {
      const setKeys = Object.keys(this._set);
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

export async function transaction(client: any, callback: (tx: QueryBuilder) => Promise<void>): Promise<void> {
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

export const db = (table?: string): QueryBuilder => {
  const builder = new QueryBuilder();
  if (table) builder.table(table);
  return builder;
};