type Primitive = string | number | boolean | Date;
export type FilterValue = Primitive | Primitive[];
export type Filters = Record<string, FilterValue>;
