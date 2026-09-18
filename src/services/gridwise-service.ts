/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptimizeRequest, OptimizeResponse } from "../types";
import { LLMInterpreter } from "../llm/interpreter";
import { GuardrailValidator } from "../guardrails/validator";
import { EnergyOptimizer } from "../optimizer/optimizer";
import { PlanValidator } from "../validation/plan-validator";

export class GridWiseService {
  private interpreter: LLMInterpreter;
  private optimizer: EnergyOptimizer;

  constructor() {
    this.interpreter = new LLMInterpreter();
    this.optimizer = new EnergyOptimizer();
  }

  async optimize(request: OptimizeRequest): Promise<OptimizeResponse> {
    // 1. Interpret notes
    const llmResult = await this.interpreter.interpret(request);

    // 2. Validate interpretations
    const validatedInterpretations = GuardrailValidator.validate(
      llmResult.interpretations,
      request
    );

    // 3. Optimize
    const hourlyPlan = this.optimizer.optimize(request, validatedInterpretations);

    // 4. Validate plan and calculate totals
    PlanValidator.validate(hourlyPlan, request, validatedInterpretations);
    const totals = PlanValidator.calculateTotals(hourlyPlan, request);

    return {
      scenario_id: request.scenario_id,
      directive_interpretation: validatedInterpretations,
      hourly_plan: hourlyPlan,
      ...totals,
      plan_summary: llmResult.plan_summary,
    };
  }
}
