import { db, op } from '../src/index';

const query = db('users')
  .select('id', 'name', 'email')
  .where({ age: op.gt(18), active: op.eq(true) })
  .orderBy('name')
  .limit(50);

console.log('SQL:', query.toSQL().sql);
console.log('Params:', query.toSQL().params);