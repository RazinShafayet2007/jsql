---
sidebar_position: 4
---

# Joins & Subqueries

## Joins
```typescript
db('users')
  .leftJoin('posts', 'users.id', 'posts.user_id')
  .toSQL();
```

## Subqueries
```typescript
const sub = db('orders').select('user_id').where({ total: op.gt(100) });
db('users').where({ id: op.in(sub) }).toSQL();
```
