---
sidebar_position: 3
---

# Basic Usage

```typescript
// SELECT (auto SELECT * if no .select())
db('users')
  .where({ age: op.gt(30) })
  .toSQL();

// INSERT / UPDATE / DELETE
db('users').insert({ name: 'Alice' }).returning('id').toSQL();
```
