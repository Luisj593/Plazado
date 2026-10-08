/** Only changed commerce documents are persisted; identities/settings are untouched. */
export function commerceChanges(previous: any, next: any) {
  const changes: {collection: string; id: string; before: any; after: any}[] = [];
  for (const collection of ['products','orders','paymentTransactions','financialAuditLogs','auditLogs','fulfillmentInventory','inventoryMovements','fulfillmentOrders','storeBalances','settlements','users','stores','banners']) {
    const rows = (state: any) => collection === 'storeBalances' ? Object.values(state[collection] || {}) : state[collection] || [];
    const old = new Map(rows(previous).map((r: any) => [r.id || r.storeId, r]));
    for (const row of rows(next) as any[]) {
      const id = row.id || row.storeId;
      const before = old.get(id);
      if (JSON.stringify(before) !== JSON.stringify(row)) changes.push({collection,id,before,after:row});
    }
  }
  return changes;
}
