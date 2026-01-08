# JS SQL Builder

A lightweight, chainable, pure-JavaScript-feeling SQL query builder.

## Features
- Full CRUD support (SELECT, INSERT, UPDATE, DELETE)
- Safe parameterized queries
- Feels like writing normal JS (no visible SQL strings)

## Installation
```
npm install js-sql-builder
```


## Usage
```ts
import { db, op } from 'jsql';

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
