// src/schema.ts (NEW for v3 - optional schema definition for TS autocomplete)
export type TableSchema<T> = {
    columns: readonly (keyof T)[];
};

export const defineTable = <T extends Record<string, any>>(schema: TableSchema<T>) => schema;

// Example usage in user code:
// import { defineTable } from '@razinshafayet/jsql';
// const usersSchema = defineTable<{ id: number; name: string; age: number; active: boolean }>({
//   columns: ['id', 'name', 'age', 'active'],
// });
// db('users', usersSchema).select('id', 'name') // TS autocompletes columns!