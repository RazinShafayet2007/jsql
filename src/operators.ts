export const op = {
  eq: (val: any) => ({ op: '=', val }),
  gt: (val: any) => ({ op: '>', val }),
  gte: (val: any) => ({ op: '>=', val }),
  lt: (val: any) => ({ op: '<', val }),
  lte: (val: any) => ({ op: '<=', val }),
  like: (val: any) => ({ op: 'LIKE', val }),
  in: (val: any) => ({ op: 'IN', val }),
  not: (condition: any) => ({ op: 'NOT', val: condition }),
} as const;