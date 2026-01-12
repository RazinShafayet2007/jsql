# Window Functions

JSQL supports standard SQL window functions.

```typescript
// SELECT name, ROW_NUMBER() OVER (ORDER BY score DESC) FROM players
const result = db('players')
  .select('name')
  .rowNumber('ORDER BY score DESC')
  .toSQL();
```

## Available Functions

- `rowNumber(over: string)`
- `rank(over: string)`
- `denseRank(over: string)`

argument `over` expects the content of the OVER clause (e.g. `PARTITION BY x ORDER BY y`).
