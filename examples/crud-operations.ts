import { db, op } from '../src/index';

// SELECT
console.log(db().select('*').table('users').toSQL());

// INSERT
console.log(db().insert('users', { name: 'Alice', age: 30 }).returning('id').toSQL());

// UPDATE
console.log(db().update('users', { age: 31 }).where({ name: op.eq('Alice') }).toSQL());

// DELETE
console.log(db().delete('users').where({ active: op.eq(false) }).toSQL());
