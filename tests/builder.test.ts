import { db, op } from '../src';

describe('QueryBuilder', () => {
  it('builds basic SELECT', () => {
    const { sql, params } = db()
      .select('id', 'name')
      .table('users')
      .where({ age: op.gt(30), active: op.eq(true) })
      .toSQL();

    expect(sql).toBe('SELECT id, name FROM users WHERE (age > ? AND active = ?)');
    expect(params).toEqual([30, true]);
  });

  it('builds INSERT', () => {
    const { sql, params } = db()
      .insert('users', { name: 'Alice', age: 25 })
      .returning('id')
      .toSQL();

    expect(sql).toBe('INSERT INTO users (name, age) VALUES (?, ?) RETURNING id');
    expect(params).toEqual(['Alice', 25]);
  });

  it('builds multi-row INSERT', () => {
    const { sql, params } = db()
      .insert('users', [{ name: 'Bob' }, { name: 'Eve', age: 28 }])
      .toSQL();

    expect(sql).toBe('INSERT INTO users (name, age) VALUES (?, ?), (?, ?)');
    expect(params).toEqual(['Bob', undefined, 'Eve', 28]);
  });

  it('builds UPDATE', () => {
    const { sql, params } = db()
      .update('users', { age: 26 })
      .where({ name: op.eq('Alice') })
      .toSQL();

    expect(sql).toBe('UPDATE users SET age = ? WHERE (name = ?)');
    expect(params).toEqual([26, 'Alice']);
  });

  it('builds DELETE', () => {
    const { sql, params } = db()
      .delete('users')
      .where({ active: op.eq(false) })
      .limit(10)
      .toSQL();

    expect(sql).toBe('DELETE FROM users WHERE (active = ?) LIMIT 10');
    expect(params).toEqual([false]);
  });
});
