# Aggregates

JSQL supports common SQL aggregate functions with a chainable API.

```typescript
// SELECT COUNT(id), SUM(age), AVG(score) FROM users GROUP BY active
const result = db('users')
  .count('id')
  .sum('age')
  .avg('score')
  .groupBy('active')
  .toSQL();
```

## Available Aggregates

- `count(column: string | '*')`
- `sum(column: string)`
- `avg(column: string)`
- `min(column: string)`
- `max(column: string)`

## Grouping and Having

You can combine aggregates with `groupBy` and `having` clauses.

```typescript
db('sales')
  .sum('amount')
  .groupBy('category')
  .having({ 'SUM(amount)': op.gt(1000) })
  .toSQL();
```
