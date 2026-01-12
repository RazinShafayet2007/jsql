import { db, op } from '../src';

describe('QueryBuilder', () => {
  it('builds basic SELECT', () => {
    const { sql, params } = db('users')
      .select('id', 'name')
      .where({ age: op.gt(30), active: op.eq(true) })
      .toSQL();

    expect(sql).toBe('SELECT id, name FROM users WHERE (age > ? AND active = ?)');
    expect(params).toEqual([30, true]);
  });

  it('builds INSERT (single)', () => {
    const { sql, params } = db('users')
      .insert({ name: 'Alice', age: 25 })
      .returning('id')
      .toSQL();

    expect(sql).toBe('INSERT INTO users (name, age) VALUES (?, ?) RETURNING id');
    expect(params).toEqual(['Alice', 25]);
  });

  it('builds multi-row INSERT', () => {
    const { sql, params } = db('users')
      .insert([{ name: 'Bob' }, { name: 'Eve', age: 28 }])
      .toSQL();

    expect(sql).toBe('INSERT INTO users (name, age) VALUES (?, ?), (?, ?)');
    expect(params).toEqual(['Bob', undefined, 'Eve', 28]);
  });

  it('builds UPDATE', () => {
    const { sql, params } = db('users')
      .update({ age: 26 })
      .where({ name: op.eq('Alice') })
      .toSQL();

    expect(sql).toBe('UPDATE users SET age = ? WHERE (name = ?)');
    expect(params).toEqual([26, 'Alice']);
  });

  it('builds DELETE', () => {
    const { sql, params } = db('users')
      .delete()
      .where({ active: op.eq(false) })
      .limit(10)
      .toSQL();

    expect(sql).toBe('DELETE FROM users WHERE (active = ?) LIMIT 10');
    expect(params).toEqual([false]);
  });
});

it('builds JOIN', () => {
  const { sql } = db('users')
    .select('users.*', 'posts.title')
    .leftJoin('posts', 'users.id', 'posts.user_id')
    .where({ 'users.active': op.eq(true) })
    .toSQL();

  expect(sql).toBe('SELECT users.*, posts.title FROM users LEFT JOIN posts ON users.id = posts.user_id WHERE (users.active = ?)');
});

it('supports subquery in op.in', () => {
  const sub = db('orders').select('user_id').where({ total: op.gt(100) });
  const { sql, params } = db('users')
    .where({ id: op.in(sub) })
    .toSQL();

  expect(sql).toBe('SELECT * FROM users WHERE (id IN (SELECT user_id FROM orders WHERE (total > ?)))');
  expect(params).toEqual([100]);
});

it('supports CTE', () => {
  const cte = db('temp').select('id').from('users');
  const { sql } = db('posts')
    .with('active_users', cte)
    .where({ user_id: op.in(db('active_users').select('id')) })
    .toSQL();
  expect(sql).toContain('WITH active_users AS (SELECT id FROM users)');
});

it('handles aggregates', () => {
  const { sql } = db('users')
    .count('id')
    .sum('age')
    .groupBy('active')
    .having({ 'COUNT(id)': op.gt(5) })
    .toSQL();
  expect(sql).toContain('COUNT(id)');
  expect(sql).toContain('SUM(age)');
  expect(sql).toContain('GROUP BY active');
  expect(sql).toContain('HAVING (COUNT(id) > ?)');
});

it('type-safe schema', () => {
  const usersSchema = { columns: ['id', 'name'] as const };
  db('users', usersSchema).select('id', 'name'); // OK, 'email' would error
});