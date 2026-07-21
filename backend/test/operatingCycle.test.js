const assert=require('assert');const test=require('node:test');const r=require('../src/domain/operatingCycle');
test('forecast is deterministic and bounded',()=>assert.equal(r.demandForecast([100,110,90],.5),50));
test('opening requires safety interlocks',()=>assert.throws(()=>r.validateTransition('planned','open',{role:'site_manager'},{equipmentReadinessId:'E',staffingPlanId:'S'}),/interlock/));
test('large chemical variance needs approval',()=>assert.throws(()=>r.validateTransition('open','reconciled',{role:'site_manager'},{posBatchId:'P',paymentSettlementId:'X',inventoryCountId:'I',laborSnapshotId:'L',accountingBatchId:'A',chemicalVariancePercent:6}),/Chemical variance/));
test('telemetry requires device identity',()=>assert.throws(()=>r.validateTelemetry({sequence:1,readings:[{}]}),/Device/));
