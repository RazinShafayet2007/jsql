# jsql

A lightweight, chainable, pure-JavaScript-feeling SQL query builder.

## Features
- Full CRUD support (SELECT, INSERT, UPDATE, DELETE)
- Safe parameterized queries (prevents SQL injection)
- Fluent chaining that feels like normal JavaScript
- Joins (inner, left, right, full) with simple or multi-condition ON clauses
- Subqueries (including `op.in(subquery)`, `op.eq(subquery)`, etc.)
- Aggregation (`groupBy`, `having`)
- Direct execution with `.exec(client)` (supports pg, mysql2, better-sqlite3, etc.)
- Transaction helper (`db.transaction(client, async (tx) => ...)`)
- Zero runtime dependencies
- Excellent TypeScript support

## Installation
```
npm install @razinshafayet/jsql
```


## Usage
```ts
import { db, op } from '@razinshafayet/jsql';

const query = db()
  .select('id', 'name')
  .table('users')
  .where({ age: op.gt(30) })
  .toSQL();

console.log(query.sql);     // SELECT id, name FROM users WHERE (age > ?)
console.log(query.params);  // [30]
```

Run examples:
```
npx ts-node examples/basic-select.ts
```

Build: `npm run build`  
Test: `npm run test`
