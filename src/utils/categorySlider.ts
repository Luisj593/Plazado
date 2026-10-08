/** Each round gives every populated category one slot, independent of catalog size. */
export function categorySliderSequence<T extends { categoryId: string; images: string[] }>(products: T[], random = Math.random): T[] {
  const shuffle = <V,>(values: V[]): V[] => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const groups = new Map<string, T[]>();
  for (const product of products) {
    if (!product.images?.length) continue;
    const group = groups.get(product.categoryId) || [];
    group.push(product);
    groups.set(product.categoryId, group);
  }
  const decks = shuffle([...groups.values()].map(shuffle));
  const rounds = Math.max(0, ...decks.map(deck => deck.length));
  const result: T[] = [];
  for (let round = 0; round < rounds; round++) {
    for (const deck of decks) result.push(deck[round % deck.length]);
  }
  return result;
}
