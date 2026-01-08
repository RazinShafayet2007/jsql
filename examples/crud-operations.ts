import { db, op } from '../src/index';

// SELECT
console.log(db('users').select('*').toSQL());

// INSERT (single)
console.log(db('users').insert({ name: 'Alice', age: 30 }).returning('id').toSQL());

// INSERT (multi)
console.log(db('users').insert([{ name: 'Bob' }, { name: 'Eve', age: 28 }]).toSQL());

// UPDATE
console.log(db('users').update({ age: 31 }).where({ name: op.eq('Alice') }).toSQL());

// DELETE
console.log(db('users').delete().where({ active: op.eq(false) }).toSQL());