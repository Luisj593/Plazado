import crypto from 'crypto';
const round = (n: number) => Math.round(n * 100) / 100;
const ensureBalance = (state: any, storeId: string) => {
  const balance = state.storeBalances[storeId] ||= {storeId,lastUpdated:new Date().toISOString()};
  for(const field of ['totalSales','cardSales','cashSales','plazaCommissionsPaid','pendingCashCommissions','pendingBalance','availableBalance','settledBalance','retainedBalance','adjustments','carriedOverDebt']) {
    balance[field] ??= 0;
    if(!Number.isFinite(balance[field]) || balance[field]<0) throw Error('Saldo inconsistente. Requiere conciliación');
  }
  return balance;
};
function audit(state: any, data: any) { (state.financialAuditLogs ||= []).unshift({...data,id:`fin-${crypto.randomUUID()}`,timestamp:new Date().toISOString()}); }
function synchronizeTransaction(state: any, order: any) {
  for (const transaction of state.paymentTransactions || []) if (transaction.orderId === order.id) Object.assign(transaction,{orderStatus:order.status,paymentStatus:order.paymentStatus,settlementStatus:order.settlementStatus,settlementId:order.settlementId});
}
export function transitionOrder(state: any, orderId: string, status: string, note?: string, confirmationCode?: string, fulfillmentAuthorized=false) {
  const order = state.orders.find((o: any) => o.id === orderId);
  if (!order) return {success:false,message:'Pedido no encontrado'};
  const allowed = ['PENDING','PENDING_STORE_CONFIRMATION','CONFIRMED','PREPARING','READY_FOR_PICKUP','SHIPPED','DELIVERED','CANCELLED'];
  if (!allowed.includes(status)) return {success:false,message:'Estado de pedido inválido'};
  if (status === order.status) return {success:true,message:'El pedido ya tiene este estado',order};
  if (['DELIVERED','CANCELLED'].includes(order.status)) return {success:false,message:'El pedido ya está cerrado'};
  const progress = ['PENDING','PENDING_STORE_CONFIRMATION','CONFIRMED','PREPARING','READY_FOR_PICKUP','SHIPPED','DELIVERED'];
  if (status !== 'CANCELLED' && progress.indexOf(status) < progress.indexOf(order.status)) return {success:false,message:'No se puede retroceder el estado del pedido'};
  if (order.fulfillmentOrderId && !fulfillmentAuthorized) return {success:false,message:'Este pedido debe gestionarse desde el flujo de Plazado Fulfillment'};
  const now = new Date().toISOString();
  if(!Number.isFinite(order.total) || !Number.isFinite(order.plazaCommissionAmount) || order.total<0 || order.plazaCommissionAmount<0) return {success:false,message:'Importes inconsistentes. Requiere conciliación'};
  const balance = ensureBalance(state,order.storeId);
  if (status === 'DELIVERED') {
    if (!confirmationCode || confirmationCode.trim() !== order.deliveryConfirmationCode) return {success:false,message:'Código de entrega incorrecto'};
    if (order.paymentMethod !== 'CASH_ON_DELIVERY' && order.paymentStatus !== 'PAID') return {success:false,message:'El pago debe confirmarse con el proveedor antes de liberar fondos'};
    const before = balance.availableBalance || 0;
    if (order.paymentMethod === 'CASH_ON_DELIVERY') {
      if (order.accountingVersion === 2) {
        balance.totalSales = round(balance.totalSales + order.total);
        balance.cashSales = round(balance.cashSales + order.total);
        balance.pendingCashCommissions = round(balance.pendingCashCommissions + order.plazaCommissionAmount);
      }
      order.paymentStatus = 'PAID';
    } else {
      if (balance.pendingBalance < order.storeNetEarnings) return {success:false,message:'Saldo pendiente insuficiente. Requiere conciliación'};
      balance.pendingBalance = round(balance.pendingBalance - order.storeNetEarnings);
      balance.availableBalance = round(balance.availableBalance + order.storeNetEarnings);
    }
    audit(state,{orderId,storeId:order.storeId,amount:order.total,commission:order.plazaCommissionAmount,paymentMethod:order.paymentMethod,movementType:order.paymentMethod==='CASH_ON_DELIVERY'?'SALE_CASH':'SALE_CARD',actor:'ORDER_DELIVERY_VALIDATION',previousBalance:before,newBalance:balance.availableBalance,status:'DELIVERED',notes:'Entrega confirmada con código del cliente'});
  }
  if (status === 'CANCELLED') {
    if (order.status === 'SHIPPED') return {success:false,message:'Un pedido enviado requiere validar su devolución antes de reponer inventario'};
    if (order.paymentMethod !== 'CASH_ON_DELIVERY' && order.paymentStatus === 'PAID') return {success:false,message:'El reembolso debe confirmarse con el proveedor antes de cancelar'};
    for (const item of order.items) {
      const product = state.products.find((p: any) => p.id === item.productId && p.storeId === order.storeId);
      if (!product || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw Error('No se puede reponer un inventario inconsistente');
      product.stock += item.quantity;
      product.soldCount = Math.max(0,(product.soldCount || 0) - item.quantity);
    }
    if (order.accountingVersion !== 2 && order.paymentMethod === 'CASH_ON_DELIVERY') {
      balance.totalSales = Math.max(0,round(balance.totalSales - order.total));
      balance.cashSales = Math.max(0,round(balance.cashSales - order.total));
      balance.pendingCashCommissions = Math.max(0,round(balance.pendingCashCommissions - order.plazaCommissionAmount));
    }
    Object.assign(order,{cancelReason:note || 'Cancelado por la tienda',cancelledAt:now,cancelledBy:'Tienda',settlementStatus:'EXEMPT'});
    // A cancelled unpaid order has no bank refund. Keep paymentStatus PENDING.
    audit(state,{orderId,storeId:order.storeId,amount:order.total,commission:order.plazaCommissionAmount,paymentMethod:order.paymentMethod,movementType:'ADJUSTMENT',actor:'ORDER_CANCELLATION',previousBalance:balance.availableBalance,newBalance:balance.availableBalance,status:'CANCELLED',notes:'Reserva de inventario liberada; no se realizó reembolso bancario'});
  }
  const previousStatus = order.status;
  order.status = status; balance.lastUpdated = now;
  (order.statusHistory ||= []).push({status,timestamp:now,updatedBy:'Plazado',note:note || `Estado ${previousStatus} → ${status}`});
  synchronizeTransaction(state,order);
  return {success:true,message:`Estado actualizado a ${status}`,order};
}
export function processSettlementState(state: any, id: string, status: string, reference?: string) {
  const settlement = state.settlements.find((s: any) => s.id === id);
  if (!settlement) return null;
  if (!['PENDING','SCHEDULED','RETAINED','PAID','REJECTED','CANCELLED'].includes(status)) throw Error('Estado de liquidación inválido');
  if (status === settlement.status) return settlement;
  if (['PAID','REJECTED','CANCELLED'].includes(settlement.status)) throw Error('La liquidación ya está cerrada');
  if (status === 'PAID' && (!reference?.trim() || /^(ACH-REQ|ACH-BPD|AUTO|SIMUL)/i.test(reference.trim()))) throw Error('Ingresa la referencia bancaria real de la transferencia efectuada');
  if (settlement.accountingVersion !== 2) throw Error('Esta liquidación anterior requiere conciliación de sus saldos antes de procesarse');
  const balance = ensureBalance(state,settlement.storeId),before = balance.availableBalance;
  const reserved = settlement.reservedAmount;
  if (!Number.isFinite(reserved) || reserved < 0 || balance.retainedBalance < reserved) throw Error('Fondos reservados inconsistentes. Requiere conciliación');
  if (status === 'PAID') {
    if (state.settlements.some((s:any)=>s.id!==id && s.status==='PAID' && s.bankReference===reference!.trim())) throw Error('Esta referencia bancaria ya fue utilizada');
    if (balance.pendingCashCommissions < settlement.reservedCashCommissions || balance.carriedOverDebt < settlement.reservedDebt || balance.adjustments < settlement.adjustments) throw Error('Las deducciones cambiaron. Requiere conciliación');
    balance.pendingCashCommissions = round(balance.pendingCashCommissions - settlement.reservedCashCommissions);
    balance.carriedOverDebt = round(balance.carriedOverDebt - settlement.reservedDebt);
    balance.adjustments = round(balance.adjustments - settlement.adjustments);
    balance.plazaCommissionsPaid = round(balance.plazaCommissionsPaid + settlement.cashCommissionsDeducted);
    balance.retainedBalance = round(balance.retainedBalance - reserved);
    balance.settledBalance = round(balance.settledBalance + settlement.netAmount);
    settlement.bankReference = reference!.trim();settlement.paidAt = new Date().toISOString();
    for (const order of state.orders) if (settlement.orderIds?.includes(order.id)) {
      if(order.paymentMethod==='CASH_ON_DELIVERY') {
        const deduction=settlement.cashDeductions?.find((row:any)=>row.orderId===order.id)?.amount || 0;
        order.settlementPaidCommission=round((order.settlementPaidCommission || 0)+deduction);
        order.settlementStatus=order.settlementPaidCommission >= (order.plazaCommissionAmount || 0)?'SETTLED':'PENDING';
        if(order.settlementStatus==='PENDING') order.settlementId=null;
      } else order.settlementStatus='SETTLED';
      synchronizeTransaction(state,order);
    }
  } else if (status === 'REJECTED' || status === 'CANCELLED') {
    balance.availableBalance = round(balance.availableBalance + reserved);
    balance.retainedBalance = round(balance.retainedBalance - reserved);
    for (const order of state.orders) if (settlement.orderIds?.includes(order.id)) {order.settlementStatus='PENDING';order.settlementId=null;synchronizeTransaction(state,order);}
  }
  settlement.status=status;balance.lastUpdated=new Date().toISOString();
  audit(state,{settlementId:id,storeId:settlement.storeId,amount:settlement.netAmount,commission:settlement.commissionAmount,paymentMethod:'TRANSFERENCIA_ACH',movementType:status==='PAID'?'SETTLEMENT_PAYOUT':'ADJUSTMENT',actor:'SUPER_ADMIN',previousBalance:before,newBalance:balance.availableBalance,externalRef:status==='PAID'?settlement.bankReference:undefined,status,notes:status==='PAID'?'Transferencia confirmada manualmente con referencia bancaria':'Cambio administrativo de liquidación; no se ejecutó una transferencia'});
  return settlement;
}

export function requestSettlementState(state: any, storeId: string, notes?: string, cycle?: string) {
  const store = state.stores.find((s:any)=>s.id===storeId), balance = state.storeBalances[storeId];
  if (!store || !balance || balance.availableBalance < 500) return {success:false,message:'El saldo disponible mínimo para solicitar liquidación es de RD$ 500'};
  if (state.settlements.some((s:any)=>s.storeId===storeId && !['PAID','REJECTED','CANCELLED'].includes(s.status))) return {success:false,message:'La tienda ya tiene una liquidación pendiente'};
  const idempotencyKey = cycle ? `SETTL-CYCLE-${storeId}-${cycle}` : undefined;
  if (idempotencyKey && state.settlements.some((s:any)=>s.idempotencyKey===idempotencyKey)) return {success:false,message:'Esta tienda ya fue procesada en este ciclo'};
  const orders = state.orders.filter((o:any)=>o.storeId===storeId && o.status==='DELIVERED' && o.paymentStatus==='PAID' && o.settlementStatus==='PENDING' && !o.settlementId && !state.disputes?.some((d:any)=>d.orderId===o.id && ['OPEN','UNDER_REVIEW'].includes(d.status)));
  const releasedNet = round(orders.filter((o:any)=>o.paymentMethod!=='CASH_ON_DELIVERY').reduce((sum:number,o:any)=>sum+(o.storeNetEarnings || 0),0));
  if (balance.availableBalance < releasedNet) return {success:false,message:'Los fondos liberados y el balance no coinciden. Requiere conciliación'};
  const amount = releasedNet;
  if (amount < 500) return {success:false,message:'No hay RD$ 500 de fondos liberados de pedidos entregados sin reclamaciones'};
  for (const field of ['availableBalance','pendingCashCommissions','carriedOverDebt','adjustments','retainedBalance']) if (!Number.isFinite(balance[field] || 0) || (balance[field] || 0) < 0) throw Error('Saldo inconsistente. Requiere conciliación');
  const debt = Math.min(amount,balance.carriedOverDebt || 0);
  const cashOrders = orders.filter((o:any)=>o.paymentMethod==='CASH_ON_DELIVERY');
  let cashBudget = Math.min(amount-debt,balance.pendingCashCommissions || 0);
  const cashDeductions:{orderId:string;amount:number}[]=[];
  for(const order of cashOrders) {
    const deduction = round(Math.min(cashBudget,Math.max(0,(order.plazaCommissionAmount || 0)-(order.settlementPaidCommission || 0))));
    if(deduction>0) {cashDeductions.push({orderId:order.id,amount:deduction});cashBudget=round(cashBudget-deduction);}
  }
  const cash = round(cashDeductions.reduce((sum,row)=>sum+row.amount,0));
  const includedOrders=orders.filter((o:any)=>o.paymentMethod!=='CASH_ON_DELIVERY' || cashDeductions.some(row=>row.orderId===o.id));
  const adjustments = Math.min(amount-debt-cash,balance.adjustments || 0);
  const net = round(amount-debt-cash-adjustments);
  const bank = store.bankInfo;
  const validBank = !!(bank?.bank?.trim() && bank?.accountNumber?.trim() && !/^pendiente/i.test(bank.accountNumber.trim()));
  const settlement = {
    id:`SETTL-${crypto.randomUUID()}`,storeId,storeName:store.name,grossAmount:amount,commissionAmount:0,
    cashCommissionsDeducted:round(debt+cash),adjustments,netAmount:net,status:validBank?'PENDING':'RETAINED',
    accountingVersion:2,reservedAmount:amount,reservedCashCommissions:cash,reservedDebt:debt,cashDeductions,
    bankName:bank?.bank || 'Pendiente',bankAccountType:bank?.accountType || 'CORRIENTE',accountHolder:bank?.accountHolder || store.ownerName,
    rncOrCedula:bank?.rncOrCedula || '',accountNumberMasked:bank?.accountNumber ? `****${bank.accountNumber.slice(-4)}`:'****',
    paymentMethodName:'Transferencia bancaria pendiente de revisión',orderIds:includedOrders.map((o:any)=>o.id),ordersCount:includedOrders.length,
    idempotencyKey,notes:notes || 'Fondos reservados para revisión. No se ha ejecutado una transferencia.',createdAt:new Date().toISOString()
  };
  balance.availableBalance=round(balance.availableBalance-amount);
  balance.retainedBalance=round((balance.retainedBalance || 0)+amount);balance.lastUpdated=settlement.createdAt;
  for (const order of includedOrders) {order.settlementStatus='SCHEDULED';order.settlementId=settlement.id;synchronizeTransaction(state,order);}
  state.settlements.unshift(settlement);
  audit(state,{settlementId:settlement.id,storeId,amount:net,commission:0,paymentMethod:'TRANSFERENCIA_ACH',movementType:'ADJUSTMENT',actor:'SETTLEMENT_REQUEST',previousBalance:round(balance.availableBalance+amount),newBalance:balance.availableBalance,status:settlement.status,notes:'Reserva de fondos pendiente de revisión y confirmación bancaria'});
  return {success:true,message:'Solicitud guardada. Los fondos están reservados; el pago bancario está pendiente de revisión.',settlement};
}

export function weeklySettlementsState(state:any, actor:string) {
  const cycle = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santo_Domingo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const settlementsCreated:any[]=[];
  for(const store of state.stores) {
    const result=requestSettlementState(state,store.id,`Ciclo preparado por ${actor}; pendiente de confirmación bancaria`,cycle);
    if(result.success && result.settlement) settlementsCreated.push(result.settlement);
  }
  return {success:true,message:`Se prepararon ${settlementsCreated.length} solicitudes. No se ejecutaron transferencias bancarias.`,settlementsCreated,totalLiquidated:0,totalCommissionsDeducted:0,totalCashCommissionsDeducted:0,storesProcessed:settlementsCreated.length};
}
