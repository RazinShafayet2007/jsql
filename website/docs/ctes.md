# Common Table Expressions (CTEs)

You can define CTEs using the `.with()` method.

```typescript
const cte = db('logs').select('user_id').where({ error: true });

db('users')
  .with('error_users', cte)
  .select('*')
  .from('error_users')
  .toSQL();
```

## Recursive CTEs

JSQL treats CTEs as sub-builders basically, so recursion logic depends on the SQL dialect support and how you structure the inner query.
