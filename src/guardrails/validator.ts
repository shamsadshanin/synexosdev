/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DirectiveInterpretation, OptimizeRequest, DirectiveType } from "../types";

export class GuardrailValidator {
  static validate(
    interpretations: DirectiveInterpretation[],
    request: OptimizeRequest
  ): DirectiveInterpretation[] {
    const validated: DirectiveInterpretation[] = [];
    const supportedTypes: DirectiveType[] = [
      "solar_reduction",
      "minimum_battery_reserve",
      "no_charge_window",
      "no_discharge_window",
      "max_grid_window",
      "no_op",
    ];

    // Ensure we have one entry per note
    for (let i = 0; i < request.operator_notes.length; i++) {
      let interpretation = interpretations.find((int) => int.note_index === i);

      if (!interpretation) {
        interpretation = {
          note_index: i,
          applies: false,
          directive_type: "no_op",
          structured_adjustment: null,
          explanation: "Note missing in LLM output. Defaulted to no_op.",
        };
      }

      // 1. directive_type is supported
      if (!supportedTypes.includes(interpretation.directive_type)) {
        interpretation.directive_type = "no_op";
        interpretation.applies = false;
        interpretation.structured_adjustment = null;
        interpretation.explanation = `Invalid directive type: ${interpretation.directive_type}. Defaulted to no_op.`;
      }

      // 5, 6. no_op and applies consistency
      if (interpretation.directive_type === "no_op") {
        interpretation.applies = false;
        interpretation.structured_adjustment = null;
      } else {
        interpretation.applies = true;
      }

      // 7-10. Hours validation
      if (interpretation.applies && interpretation.structured_adjustment) {
        const adj = interpretation.structured_adjustment as any;
        if (Array.isArray(adj.hours)) {
          let hours: number[] = adj.hours
            .filter((h: any) => typeof h === "number" && h >= 0 && h <= 23)
            .map((h: number) => Math.floor(h));
          
          hours = Array.from(new Set(hours)).sort((a, b) => a - b);
          adj.hours = hours;
        } else {
          adj.hours = [];
        }

        // 11-14. Specific field validations
        if (interpretation.directive_type === "solar_reduction") {
          if (typeof adj.factor !== "number" || isNaN(adj.factor)) {
            adj.factor = 1.0;
          }
          adj.factor = Math.max(0, Math.min(1, adj.factor));
        } else if (interpretation.directive_type === "minimum_battery_reserve") {
          if (typeof adj.minimum_energy_kwh !== "number" || isNaN(adj.minimum_energy_kwh)) {
            adj.minimum_energy_kwh = request.battery.minimum_energy_kwh;
          }
          adj.minimum_energy_kwh = Math.max(
            0,
            Math.min(request.battery.capacity_kwh, adj.minimum_energy_kwh)
          );
        } else if (interpretation.directive_type === "max_grid_window") {
          if (typeof adj.max_grid_kwh !== "number" || isNaN(adj.max_grid_kwh)) {
            adj.max_grid_kwh = 999999; // Effectively unlimited
          }
          adj.max_grid_kwh = Math.max(0, adj.max_grid_kwh);
        }
      }

      validated.push(interpretation);
    }

    return validated.sort((a, b) => a.note_index - b.note_index);
  }
}
