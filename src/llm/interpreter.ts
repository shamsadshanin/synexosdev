/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { OptimizeRequest, LLMResponse } from "../types";
import { SYSTEM_PROMPT } from "./prompts";

export class LLMInterpreter {
  private ai: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  async interpret(request: OptimizeRequest): Promise<LLMResponse> {
    if (!request.operator_notes || request.operator_notes.length === 0) {
      return {
        interpretations: [],
        plan_summary: "No operator directives provided; standard 24-hour tariff cost minimization applied."
      };
    }

    if (!this.ai) {
      throw new Error("Gemini API key is not configured. Add it in SynexOS settings.");
    }

    const prompt = `
Scenario ID: ${request.scenario_id}
Operator Notes:
${request.operator_notes.map((note, i) => `${i}: ${note}`).join("\n")}

Battery Config:
Capacity: ${request.battery.capacity_kwh} kWh
Current Reserve: ${request.battery.minimum_energy_kwh} kWh

Please interpret these notes according to the supported directives. Return pure JSON.
`;

    try {
      const model = this.ai.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.0,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response received from LLM model");
      }

      const parsed = JSON.parse(text) as LLMResponse;
      if (!parsed.interpretations || !Array.isArray(parsed.interpretations)) {
        throw new Error("LLM output missing 'interpretations' array");
      }

      return parsed;
    } catch (error: any) {
      throw new Error(`LLM Directive Interpretation failed: ${error.message || 'Unknown error'}`);
    }
  }
}
