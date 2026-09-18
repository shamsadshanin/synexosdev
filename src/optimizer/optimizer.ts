/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import solver from "javascript-lp-solver";
import { OptimizeRequest, DirectiveInterpretation, HourlyPlanEntry, BatteryAction } from "../types";

export class EnergyOptimizer {
  optimize(
    request: OptimizeRequest,
    interpretations: DirectiveInterpretation[]
  ): HourlyPlanEntry[] {
    const { hours, battery } = request;
    const model: any = {
      optimize: "cost",
      opType: "minimize",
      constraints: {},
      variables: {},
    };

    // Initialize effective solar and min reserves for each hour
    const solar_eff = hours.map((h) => h.solar_kwh);
    const min_reserves = hours.map(() => battery.minimum_energy_kwh);
    const no_charge = new Array(24).fill(false);
    const no_discharge = new Array(24).fill(false);
    const max_grid = new Array(24).fill(Infinity);

    // Apply directives
    for (const inter of interpretations) {
      if (!inter.applies || !inter.structured_adjustment) continue;
      const adj = inter.structured_adjustment as any;
      const affectedHours = adj.hours || [];

      for (const h of affectedHours) {
        if (h < 0 || h > 23) continue;
        if (inter.directive_type === "solar_reduction") {
          solar_eff[h] = hours[h].solar_kwh * adj.factor;
        } else if (inter.directive_type === "minimum_battery_reserve") {
          min_reserves[h] = Math.max(min_reserves[h], adj.minimum_energy_kwh);
        } else if (inter.directive_type === "no_charge_window") {
          no_charge[h] = true;
        } else if (inter.directive_type === "no_discharge_window") {
          no_discharge[h] = true;
        } else if (inter.directive_type === "max_grid_window") {
          max_grid[h] = Math.min(max_grid[h], adj.max_grid_kwh);
        }
      }
    }

    // Set up variables and constraints
    for (let h = 0; h < 24; h++) {
      const g_var = `grid_${h}`;
      const s_var = `solar_${h}`;
      const c_var = `charge_${h}`;
      const d_var = `discharge_${h}`;
      const e_var = `energy_${h}`;

      // Objective: minimize grid cost + tiny penalty for battery usage to prevent simultaneous charge/discharge
      model.variables[g_var] = { cost: hours[h].tariff_bdt_per_kwh };
      model.variables[s_var] = { cost: 0 };
      model.variables[c_var] = { cost: 0.000001 };
      model.variables[d_var] = { cost: 0.000001 };
      model.variables[e_var] = { cost: 0 };

      // Constraints
      // 1. Energy Balance: grid + solar + discharge = demand + charge
      // => grid + solar + discharge - charge = demand
      const balance_name = `balance_${h}`;
      model.constraints[balance_name] = { min: hours[h].demand_kwh, max: hours[h].demand_kwh };
      model.variables[g_var][balance_name] = 1;
      model.variables[s_var][balance_name] = 1;
      model.variables[d_var][balance_name] = 1;
      model.variables[c_var][balance_name] = -1;

      // 2. Solar Limit: solar <= solar_eff
      const solar_limit_name = `solar_limit_${h}`;
      model.constraints[solar_limit_name] = { max: solar_eff[h] };
      model.variables[s_var][solar_limit_name] = 1;

      // 3. Max Charge
      const charge_limit_name = `charge_limit_${h}`;
      const max_c = no_charge[h] ? 0 : battery.max_charge_kwh_per_hour;
      model.constraints[charge_limit_name] = { max: max_c };
      model.variables[c_var][charge_limit_name] = 1;

      // 4. Max Discharge
      const discharge_limit_name = `discharge_limit_${h}`;
      const max_d = no_discharge[h] ? 0 : battery.max_discharge_kwh_per_hour;
      model.constraints[discharge_limit_name] = { max: max_d };
      model.variables[d_var][discharge_limit_name] = 1;

      // 5. Grid Cap
      if (max_grid[h] !== Infinity) {
        const grid_limit_name = `grid_limit_${h}`;
        model.constraints[grid_limit_name] = { max: max_grid[h] };
        model.variables[g_var][grid_limit_name] = 1;
      }

      // 6. Energy Transition
      // energy_h = energy_{h-1} + charge_h - discharge_h
      // => energy_h - energy_{h-1} - charge_h + discharge_h = 0
      const transition_name = `transition_${h}`;
      model.constraints[transition_name] = { min: 0, max: 0 };
      model.variables[e_var][transition_name] = 1;
      model.variables[c_var][transition_name] = -1;
      model.variables[d_var][transition_name] = 1;

      if (h === 0) {
        // energy_0 - charge_0 + discharge_0 = initial_energy
        model.constraints[transition_name] = { min: battery.initial_energy_kwh, max: battery.initial_energy_kwh };
      } else {
        model.variables[`energy_${h-1}`][transition_name] = -1;
      }

      // 7. Battery Limits
      const energy_min_name = `energy_min_${h}`;
      const energy_max_name = `energy_max_${h}`;
      model.constraints[energy_min_name] = { min: min_reserves[h] };
      model.constraints[energy_max_name] = { max: battery.capacity_kwh };
      model.variables[e_var][energy_min_name] = 1;
      model.variables[e_var][energy_max_name] = 1;
    }

    // 8. End-of-day neutrality
    const neutrality_name = `neutrality`;
    model.constraints[neutrality_name] = { min: battery.initial_energy_kwh, max: battery.initial_energy_kwh };
    model.variables[`energy_23`][neutrality_name] = 1;

    try {
      const result = solver.Solve(model) as any;
      
      if (!result.feasible) {
        throw new Error("Optimization problem is infeasible");
      }

      // Convert result back to HourlyPlanEntry[]
      const hourly_plan: HourlyPlanEntry[] = [];
      for (let h = 0; h < 24; h++) {
        const grid = result[`grid_${h}`] || 0;
        const solar = result[`solar_${h}`] || 0;
        const charge = result[`charge_${h}`] || 0;
        const discharge = result[`discharge_${h}`] || 0;
        const energy = result[`energy_${h}`] || 0;
        
        const net_flow = charge - discharge;
        let action: BatteryAction = "idle";
        let b_kwh = 0;
        if (net_flow > 0.0001) {
          action = "charge";
          b_kwh = net_flow;
        } else if (net_flow < -0.0001) {
          action = "discharge";
          b_kwh = Math.abs(net_flow);
        }

        hourly_plan.push({
          hour: h,
          grid_kwh: grid,
          solar_used_kwh: solar,
          battery_action: action,
          battery_kwh: b_kwh,
          battery_energy_after_kwh: energy,
        });
      }
      return hourly_plan;
    } catch (e: any) {
      if (e.message.includes("infeasible")) throw e;
      throw new Error(`Optimization failed: ${e.message}`);
    }
  }
}
