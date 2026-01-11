---
sidebar_position: 5
---

# Execution & Transactions

```typescript
// Direct exec
await db('users').exec(pool);

// Transaction
await transaction(pool, async (tx) => {
  await tx.insert('orders', {...}).exec(pool);
});
```
