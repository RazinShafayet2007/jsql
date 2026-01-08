import { db, op } from '../src/index';

const query = db()
  .select('id', 'name', 'email')
  .table('users')
  .where({ age: op.gt(18), active: op.eq(true) })
  .orderBy('name')
  .limit(50);

console.log('SQL:', query.toSQL().sql);
console.log('Params:', query.toSQL().params);
