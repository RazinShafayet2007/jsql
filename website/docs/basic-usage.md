---
sidebar_position: 3
---

Initialize the `db` helper.

```typescript
import { db } from '@razinshafayet/jsql';
import { op } from '@razinshafayet/jsql';

// Simple usage
const query = db('users').select('*');

// SELECT (auto SELECT * if no .select())
db('users')
  .where({ age: op.gt(30) })
  .toSQL();

// INSERT / UPDATE / DELETE
db('users').insert({ name: 'Alice' }).returning('id').toSQL();
```

## Typed Schema (v3)

You can define a schema for autocompletion.

```typescript
type User = { id: number; name: string };
const userSchema = { columns: ['id', 'name'] as const };

db<User>('users', userSchema).select('name'); // Autocompletes 'name'
```

## Dialects

JSQL defaults to Postgres syntax but supports others for pagination.

```typescript
db('users')
  .dialect('mysql') // or 'sqlite', 'postgres'
  .limit(10)
  .offset(5);
```
