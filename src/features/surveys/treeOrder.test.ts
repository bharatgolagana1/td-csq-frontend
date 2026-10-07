import { describe, expect, it } from 'vitest';

import { categories } from './fixtures';
import { applyOrder, buildOrderInput, CATEGORIES_GROUP, catQuestionsGroup, changedGroups, groupIds, isSameOrder, moveIdBy, moveIdTo, sortByIds, subQuestionsGroup } from './treeOrder';

describe('treeOrder', () => {
  it('sortByIds puts listed ids first and keeps the rest in their original order', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(sortByIds(items, ['c', 'a']).map((i) => i.id)).toEqual(['c', 'a', 'b', 'd']);
    expect(sortByIds(items, undefined).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('moveIdTo clamps and moveIdBy steps', () => {
    expect(moveIdTo(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(moveIdTo(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a']);
    expect(moveIdBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveIdBy(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
    expect(moveIdBy(['a', 'b', 'c'], 'zz', 1)).toEqual(['a', 'b', 'c']);
  });

  it('applyOrder re-sorts every level from the spec without touching the server tree', () => {
    const tree = categories();
    const spec = { [CATEGORIES_GROUP]: ['c2', 'c1'], [catQuestionsGroup('c1')]: ['q2', 'q1'], [subQuestionsGroup('sub1')]: ['q4', 'q3'] };
    const displayed = applyOrder(tree, spec);
    expect(displayed.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(displayed[1]?.questions.map((q) => q.id)).toEqual(['q2', 'q1']);
    expect(displayed[0]?.subcategories[0]?.questions.map((q) => q.id)).toEqual(['q4', 'q3']);
    expect(tree.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  it('groupIds, isSameOrder and changedGroups agree on what is pending', () => {
    const tree = categories();
    expect(groupIds(tree, subQuestionsGroup('sub1'))).toEqual(['q3', 'q4']);
    expect(groupIds(tree, 'sub:unknown')).toEqual([]);
    expect(isSameOrder(tree, { [CATEGORIES_GROUP]: ['c1', 'c2'] })).toBe(true);
    expect(changedGroups(tree, { [CATEGORIES_GROUP]: ['c1', 'c2'], [catQuestionsGroup('c1')]: ['q2', 'q1'] })).toBe(1);
  });

  it('buildOrderInput lists every node with 1-based orders', () => {
    expect(buildOrderInput(applyOrder(categories(), { [catQuestionsGroup('c1')]: ['q2', 'q1'] }))).toEqual({
      categories: [
        { id: 'c1', order: 1, questions: [{ id: 'q2', order: 1 }, { id: 'q1', order: 2 }], subcategories: [] },
        { id: 'c2', order: 2, questions: [], subcategories: [{ id: 'sub1', order: 1, questions: [{ id: 'q3', order: 1 }, { id: 'q4', order: 2 }] }] },
      ],
    });
  });
});
