/** Only changed commerce documents are persisted; identities/settings are untouched. */
export function commerceChanges(previous: any, next: any) {
  const changes: {collection: string; id: string; before: any; after: any}[] = [];
  for (const collection of ['products','orders','paymentTransactions','financialAuditLogs','auditLogs','fulfillmentInventory','inventoryMovements','fulfillmentOrders','storeBalances','settlements','users','stores','banners','disputes','orderMessages','storageRequests','fulfillmentIncidences','fulfillmentReturns','fulfillmentWithdrawals','fulfillmentConfig']) {
    const rows = (state: any) => collection === 'fulfillmentConfig' ? (state.fulfillmentConfig ? [{...state.fulfillmentConfig,id:'default'}] : []) : collection === 'storeBalances' ? Object.values(state[collection] || {}) : state[collection] || [];
    const old = new Map(rows(previous).map((r: any) => [r.id || r.storeId, r]));
    for (const row of rows(next) as any[]) {
      const id = row.id || row.storeId;
      const before = old.get(id);
      if (JSON.stringify(before) !== JSON.stringify(row)) changes.push({collection,id,before:collection==='fulfillmentConfig' && previous.fulfillmentConfig?.id!=='default'?undefined:before,after:row});
    }
  }
  return changes;
}
