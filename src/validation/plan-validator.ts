/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptimizeRequest, DirectiveInterpretation, HourlyPlanEntry } from "../types";

export class PlanValidator {
  static validate(
    plan: HourlyPlanEntry[],
    request: OptimizeRequest,
    interpretations: DirectiveInterpretation[]
  ): void {
    const { battery, hours } = request;
    let currentEnergy = battery.initial_energy_kwh;

    if (plan.length !== 24) {
      throw new Error("Plan must have exactly 24 entries");
    }

    for (let h = 0; h < 24; h++) {
      const entry = plan[h];
      if (entry.hour !== h) {
        throw new Error(`Hour mismatch at index ${h}`);
      }

      // Energy Balance
      const discharge = entry.battery_action === "discharge" ? entry.battery_kwh : 0;
      const charge = entry.battery_action === "charge" ? entry.battery_kwh : 0;
      
      const balance = entry.grid_kwh + entry.solar_used_kwh + discharge - (hours[h].demand_kwh + charge);
      if (Math.abs(balance) > 0.001) {
        throw new Error(`Energy balance violated at hour ${h}: ${balance}`);
      }

      // Solar Limit
      let solarEff = hours[h].solar_kwh;
      const solarDirective = interpretations.find(i => i.applies && i.directive_type === "solar_reduction" && (i.structured_adjustment as any)?.hours.includes(h));
      if (solarDirective) {
        solarEff *= (solarDirective.structured_adjustment as any).factor;
      }
      if (entry.solar_used_kwh > solarEff + 0.001) {
        throw new Error(`Solar limit violated at hour ${h}`);
      }

      // Battery Transition
      const expectedEnergy = currentEnergy + charge - discharge;
      if (Math.abs(entry.battery_energy_after_kwh - expectedEnergy) > 0.001) {
        throw new Error(`Battery transition mismatch at hour ${h}`);
      }
      currentEnergy = entry.battery_energy_after_kwh;

      // Battery Limits
      let minRes = battery.minimum_energy_kwh;
      const reserveDirective = interpretations.find(i => i.applies && i.directive_type === "minimum_battery_reserve" && (i.structured_adjustment as any)?.hours.includes(h));
      if (reserveDirective) {
        minRes = Math.max(minRes, (reserveDirective.structured_adjustment as any).minimum_energy_kwh);
      }
      if (currentEnergy < minRes - 0.001 || currentEnergy > battery.capacity_kwh + 0.001) {
        throw new Error(`Battery energy limits violated at hour ${h}`);
      }

      // Rate Limits
      if (charge > battery.max_charge_kwh_per_hour + 0.001) {
        throw new Error(`Max charge rate violated at hour ${h}`);
      }
      if (discharge > battery.max_discharge_kwh_per_hour + 0.001) {
        throw new Error(`Max discharge rate violated at hour ${h}`);
      }

      // Directive Windows
      const chargeDirective = interpretations.find(i => i.applies && i.directive_type === "no_charge_window" && (i.structured_adjustment as any)?.hours.includes(h));
      if (chargeDirective && charge > 0.001) {
        throw new Error(`No-charge window violated at hour ${h}`);
      }
      const dischargeDirective = interpretations.find(i => i.applies && i.directive_type === "no_discharge_window" && (i.structured_adjustment as any)?.hours.includes(h));
      if (dischargeDirective && discharge > 0.001) {
        throw new Error(`No-discharge window violated at hour ${h}`);
      }
      const gridDirective = interpretations.find(i => i.applies && i.directive_type === "max_grid_window" && (i.structured_adjustment as any)?.hours.includes(h));
      if (gridDirective && entry.grid_kwh > (gridDirective.structured_adjustment as any).max_grid_kwh + 0.001) {
        throw new Error(`Max grid window violated at hour ${h}`);
      }
    }

    // Neutrality
    if (Math.abs(currentEnergy - battery.initial_energy_kwh) > 0.001) {
      throw new Error("End-of-day battery neutrality violated");
    }
  }

  static calculateTotals(plan: HourlyPlanEntry[], request: OptimizeRequest) {
    const total_grid_kwh = plan.reduce((sum, entry) => sum + entry.grid_kwh, 0);
    const total_cost_bdt = plan.reduce((sum, entry, h) => sum + entry.grid_kwh * request.hours[h].tariff_bdt_per_kwh, 0);
    const peak_grid_kwh = plan.reduce((max, entry) => Math.max(max, entry.grid_kwh), 0);

    return { total_grid_kwh, total_cost_bdt, peak_grid_kwh };
  }
}
