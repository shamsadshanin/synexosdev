/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptimizeRequest } from "../src/types";

async function runTests() {
  console.log("🚀 Starting GridWise Optimization Tests...");

  const testScenario: OptimizeRequest = {
    scenario_id: "test_comprehensive",
    operator_notes: [
      "Reduce solar output to 10% from 12 PM to 2 PM due to panel cleaning.",
      "Keep battery at least 50% charged (10 kWh) between 8 PM and midnight for backup.",
      "Do not charge the battery during peak pricing hours from 7 PM to 10 PM."
    ],
    hours: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      demand_kwh: 10,
      solar_kwh: (i >= 8 && i <= 16) ? 15 : 0,
      tariff_bdt_per_kwh: (i >= 18 && i <= 22) ? 15 : 5,
    })),
    battery: {
      capacity_kwh: 20,
      initial_energy_kwh: 10,
      minimum_energy_kwh: 2,
      max_charge_kwh_per_hour: 5,
      max_discharge_kwh_per_hour: 5,
    }
  };

  try {
    console.log("Sending request to /optimize-energy...");
    const response = await fetch("http://0.0.0.0:3000/optimize-energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testScenario),
      // Increase timeout for LLM call
      signal: AbortSignal.timeout(60000), 
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Test Failed:", error);
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Test Passed! Result Summary:");
    console.log("- Scenario ID:", result.scenario_id);
    console.log("- Total Cost:", result.total_cost_bdt.toFixed(2), "BDT");
    console.log("- Total Grid:", result.total_grid_kwh.toFixed(2), "kWh");
    console.log("- Interpretations:", result.directive_interpretation.length);
    
    // Basic verification of LLM interpretation
    result.directive_interpretation.forEach((di: any) => {
      console.log(`  - Note ${di.note_index}: [${di.directive_type}] - ${di.explanation}`);
    });

  } catch (err) {
    console.error("❌ Test Error:", err);
    process.exit(1);
  }
}

// Check if server is up before testing
async function waitForServer() {
  let attempts = 0;
  while (attempts < 10) {
    try {
      const res = await fetch("http://0.0.0.0:3000/health");
      if (res.ok) return;
    } catch (e) {}
    attempts++;
    await new Promise(r => setTimeout(r, 1000));
  }
  console.error("Server failed to start");
  process.exit(1);
}

waitForServer().then(runTests);
