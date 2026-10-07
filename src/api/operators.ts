/* The operators hooks live in ./organisations (the foundation's file, extended
   rather than duplicated — ARCHITECTURE §8). This module keeps the
   one-file-per-module naming so `@/api/operators` resolves. */

export { organisationKeys, useCreateOperator, useDeactivateOperator, useOperator, useOperators, useUpdateOperator } from './organisations';
