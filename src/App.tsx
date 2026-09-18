/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Battery, 
  Sun, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  FileText, 
  RefreshCw, 
  LayoutDashboard, 
  Settings, 
  Table as TableIcon, 
  LineChart as ChartIcon, 
  Trash2, 
  Plus, 
  Info, 
  Check, 
  RotateCcw,
  Sliders,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { OptimizeRequest, OptimizeResponse, HourlyData, BatteryConfig, SampleCase } from "./types";

const DEMO_HOURS: HourlyData[] = [
  { hour: 0, demand_kwh: 90, solar_kwh: 0, tariff_bdt_per_kwh: 6 },
  { hour: 1, demand_kwh: 85, solar_kwh: 0, tariff_bdt_per_kwh: 6 },
  { hour: 2, demand_kwh: 80, solar_kwh: 0, tariff_bdt_per_kwh: 5 },
  { hour: 3, demand_kwh: 80, solar_kwh: 0, tariff_bdt_per_kwh: 5 },
  { hour: 4, demand_kwh: 85, solar_kwh: 0, tariff_bdt_per_kwh: 5 },
  { hour: 5, demand_kwh: 95, solar_kwh: 0, tariff_bdt_per_kwh: 6 },
  { hour: 6, demand_kwh: 110, solar_kwh: 5, tariff_bdt_per_kwh: 8 },
  { hour: 7, demand_kwh: 130, solar_kwh: 20, tariff_bdt_per_kwh: 10 },
  { hour: 8, demand_kwh: 150, solar_kwh: 50, tariff_bdt_per_kwh: 12 },
  { hour: 9, demand_kwh: 165, solar_kwh: 90, tariff_bdt_per_kwh: 14 },
  { hour: 10, demand_kwh: 175, solar_kwh: 130, tariff_bdt_per_kwh: 16 },
  { hour: 11, demand_kwh: 180, solar_kwh: 160, tariff_bdt_per_kwh: 16 },
  { hour: 12, demand_kwh: 185, solar_kwh: 180, tariff_bdt_per_kwh: 15 },
  { hour: 13, demand_kwh: 180, solar_kwh: 170, tariff_bdt_per_kwh: 14 },
  { hour: 14, demand_kwh: 170, solar_kwh: 140, tariff_bdt_per_kwh: 13 },
  { hour: 15, demand_kwh: 165, solar_kwh: 90, tariff_bdt_per_kwh: 14 },
  { hour: 16, demand_kwh: 170, solar_kwh: 45, tariff_bdt_per_kwh: 18 },
  { hour: 17, demand_kwh: 185, solar_kwh: 10, tariff_bdt_per_kwh: 22 },
  { hour: 18, demand_kwh: 205, solar_kwh: 0, tariff_bdt_per_kwh: 28 },
  { hour: 19, demand_kwh: 215, solar_kwh: 0, tariff_bdt_per_kwh: 30 },
  { hour: 20, demand_kwh: 205, solar_kwh: 0, tariff_bdt_per_kwh: 26 },
  { hour: 21, demand_kwh: 175, solar_kwh: 0, tariff_bdt_per_kwh: 18 },
  { hour: 22, demand_kwh: 135, solar_kwh: 0, tariff_bdt_per_kwh: 10 },
  { hour: 23, demand_kwh: 105, solar_kwh: 0, tariff_bdt_per_kwh: 7 },
];

const DEMO_BATTERY: BatteryConfig = {
  capacity_kwh: 220,
  initial_energy_kwh: 110,
  minimum_energy_kwh: 40,
  max_charge_kwh_per_hour: 50,
  max_discharge_kwh_per_hour: 50,
};

const DEMO_OPERATOR_NOTES: string[] = [
  "Facilities will wash the rooftop solar panels from noon until 2 PM. During cleaning, usable solar should be treated as roughly 25% of the forecast.",
  "The sports office moved next month's registration deadline."
];

// Initial demonstration preview plan so that first-time load has visual data immediately
const INITIAL_DEMO_RESULT: OptimizeResponse = {
  scenario_id: "DEMO-PREVIEW-01",
  directive_interpretation: [
    {
      note_index: 0,
      applies: true,
      directive_type: "solar_reduction",
      structured_adjustment: { hours: [12, 13], factor: 0.25 },
      explanation: "Solar output reduced to 25% of forecasted generation between 12:00 and 14:00 due to planned panel cleaning."
    },
    {
      note_index: 1,
      applies: false,
      directive_type: "no_op",
      structured_adjustment: null,
      explanation: "Note regarding sports office registration deadline has no operational impact on campus energy scheduling."
    }
  ],
  hourly_plan: [
    { hour: 0, grid_kwh: 50, solar_used_kwh: 0, battery_action: "discharge", battery_kwh: 40, battery_energy_after_kwh: 70 },
    { hour: 1, grid_kwh: 85, solar_used_kwh: 0, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 70 },
    { hour: 2, grid_kwh: 130, solar_used_kwh: 0, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 120 },
    { hour: 3, grid_kwh: 130, solar_used_kwh: 0, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 170 },
    { hour: 4, grid_kwh: 135, solar_used_kwh: 0, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 220 },
    { hour: 5, grid_kwh: 95, solar_used_kwh: 0, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 6, grid_kwh: 105, solar_used_kwh: 5, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 7, grid_kwh: 110, solar_used_kwh: 20, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 8, grid_kwh: 100, solar_used_kwh: 50, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 9, grid_kwh: 75, solar_used_kwh: 90, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 10, grid_kwh: 0, solar_used_kwh: 130, battery_action: "discharge", battery_kwh: 45, battery_energy_after_kwh: 175 },
    { hour: 11, grid_kwh: 0, solar_used_kwh: 160, battery_action: "discharge", battery_kwh: 20, battery_energy_after_kwh: 155 },
    { hour: 12, grid_kwh: 90, solar_used_kwh: 45, battery_action: "discharge", battery_kwh: 50, battery_energy_after_kwh: 105 },
    { hour: 13, grid_kwh: 187.5, solar_used_kwh: 42.5, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 155 },
    { hour: 14, grid_kwh: 80, solar_used_kwh: 140, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 205 },
    { hour: 15, grid_kwh: 90, solar_used_kwh: 90, battery_action: "charge", battery_kwh: 15, battery_energy_after_kwh: 220 },
    { hour: 16, grid_kwh: 125, solar_used_kwh: 45, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 220 },
    { hour: 17, grid_kwh: 145, solar_used_kwh: 10, battery_action: "discharge", battery_kwh: 30, battery_energy_after_kwh: 190 },
    { hour: 18, grid_kwh: 155, solar_used_kwh: 0, battery_action: "discharge", battery_kwh: 50, battery_energy_after_kwh: 140 },
    { hour: 19, grid_kwh: 165, solar_used_kwh: 0, battery_action: "discharge", battery_kwh: 50, battery_energy_after_kwh: 90 },
    { hour: 20, grid_kwh: 155, solar_used_kwh: 0, battery_action: "discharge", battery_kwh: 50, battery_energy_after_kwh: 40 },
    { hour: 21, grid_kwh: 175, solar_used_kwh: 0, battery_action: "idle", battery_kwh: 0, battery_energy_after_kwh: 40 },
    { hour: 22, grid_kwh: 155, solar_used_kwh: 0, battery_action: "charge", battery_kwh: 20, battery_energy_after_kwh: 60 },
    { hour: 23, grid_kwh: 155, solar_used_kwh: 0, battery_action: "charge", battery_kwh: 50, battery_energy_after_kwh: 110 }
  ],
  total_grid_kwh: 2692.5,
  total_cost_bdt: 38365,
  peak_grid_kwh: 187.5,
  plan_summary: "Demo Preview: Solar output curtailed by 75% between 12:00-14:00 due to cleaning. Battery pre-charged during low-tariff off-peak periods and discharged during evening peak tariff window."
};

export default function App() {
  // API Health status
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthChecking, setHealthChecking] = useState<boolean>(false);

  // Sample cases loaded dynamically from public/samples.json
  const [sampleCases, setSampleCases] = useState<SampleCase[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [activeSampleCase, setActiveSampleCase] = useState<SampleCase | null>(null);

  // Editable Scenario Input State (starts with Demo Data for Preview)
  const [scenarioId, setScenarioId] = useState<string>("DEMO-PREVIEW-01");
  const [operatorNotes, setOperatorNotes] = useState<string[]>(DEMO_OPERATOR_NOTES);
  const [hours, setHours] = useState<HourlyData[]>(DEMO_HOURS);
  const [battery, setBattery] = useState<BatteryConfig>(DEMO_BATTERY);

  // Optimization Result & UI State
  const [isDemoResult, setIsDemoResult] = useState<boolean>(true); // starts true for initial preview
  const [result, setResult] = useState<OptimizeResponse | null>(INITIAL_DEMO_RESULT);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [inputValidationError, setInputValidationError] = useState<string | null>(null);
  
  // Navigation tabs and chart view options
  const [activeTab, setActiveTab] = useState<"dashboard" | "table" | "config">("dashboard");
  const [chartView, setChartView] = useState<"combined" | "power" | "battery" | "tariff">("combined");

  // Initial check on mount: check health and load public sample cases
  useEffect(() => {
    handleCheckHealth();
    loadPublicSamples();
  }, []);

  // Check API Health: GET /health
  const handleCheckHealth = async () => {
    setHealthChecking(true);
    setHealthError(null);
    try {
      const res = await fetch("/health");
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setHealthStatus("online");
      } else {
        setHealthStatus("offline");
        setHealthError(data.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setHealthStatus("offline");
      setHealthError(err.message || "Failed to reach /health endpoint");
    } finally {
      setHealthChecking(false);
    }
  };

  // Load public samples from /samples.json dynamically without hardcoding contents
  const loadPublicSamples = async () => {
    try {
      const res = await fetch("/samples.json");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.cases)) {
          setSampleCases(data.cases);
        }
      }
    } catch (e) {
      console.warn("Could not load /samples.json:", e);
    }
  };

  // User selects a public sample case from dropdown
  const handleSelectSampleCase = (caseId: string) => {
    setSelectedSampleId(caseId);
    if (!caseId) {
      setActiveSampleCase(null);
      return;
    }
    const found = sampleCases.find((c) => c.id === caseId);
    if (found) {
      setActiveSampleCase(found);
      setScenarioId(found.input.scenario_id);
      setOperatorNotes(
        found.input.operator_notes.length > 0 
          ? [...found.input.operator_notes] 
          : [""]
      );
      setHours(found.input.hours.map((h) => ({ ...h })));
      setBattery({ ...found.input.battery });
      setIsDemoResult(false);
      // Clear previous result so user explicitly triggers real optimizer
      setResult(null);
      setApiError(null);
      setInputValidationError(null);
    }
  };

  // Reset back to initial demo scenario
  const handleResetToDemo = () => {
    setSelectedSampleId("");
    setActiveSampleCase(null);
    setScenarioId("DEMO-PREVIEW-01");
    setOperatorNotes([...DEMO_OPERATOR_NOTES]);
    setHours(DEMO_HOURS.map((h) => ({ ...h })));
    setBattery({ ...DEMO_BATTERY });
    setResult(INITIAL_DEMO_RESULT);
    setIsDemoResult(true);
    setApiError(null);
    setInputValidationError(null);
  };

  // Validate frontend input before dispatching to POST /optimize-energy
  const validateInputs = (): string | null => {
    if (!scenarioId || scenarioId.trim() === "") {
      return "Validation Error: Scenario ID cannot be empty.";
    }
    if (!Array.isArray(hours) || hours.length !== 24) {
      return "Validation Error: Exactly 24 hourly records (0-23) are required.";
    }
    for (let i = 0; i < 24; i++) {
      const h = hours[i];
      if (typeof h.demand_kwh !== "number" || isNaN(h.demand_kwh) || h.demand_kwh < 0) {
        return `Validation Error: Hour ${i} has invalid demand (${h.demand_kwh} kWh). Must be >= 0.`;
      }
      if (typeof h.solar_kwh !== "number" || isNaN(h.solar_kwh) || h.solar_kwh < 0) {
        return `Validation Error: Hour ${i} has invalid solar (${h.solar_kwh} kWh). Must be >= 0.`;
      }
      if (typeof h.tariff_bdt_per_kwh !== "number" || isNaN(h.tariff_bdt_per_kwh) || h.tariff_bdt_per_kwh < 0) {
        return `Validation Error: Hour ${i} has invalid tariff (${h.tariff_bdt_per_kwh} BDT/kWh). Must be >= 0.`;
      }
    }
    if (battery.capacity_kwh <= 0) {
      return "Validation Error: Battery capacity must be strictly positive (> 0 kWh).";
    }
    if (battery.minimum_energy_kwh < 0 || battery.minimum_energy_kwh > battery.capacity_kwh) {
      return `Validation Error: Battery minimum reserve must be within [0, ${battery.capacity_kwh}] kWh.`;
    }
    if (battery.initial_energy_kwh < battery.minimum_energy_kwh || battery.initial_energy_kwh > battery.capacity_kwh) {
      return `Validation Error: Initial energy must be within [${battery.minimum_energy_kwh}, ${battery.capacity_kwh}] kWh.`;
    }
    if (battery.max_charge_kwh_per_hour <= 0 || battery.max_discharge_kwh_per_hour <= 0) {
      return "Validation Error: Battery max charge and discharge rates must be strictly positive (> 0 kWh/h).";
    }
    return null;
  };

  // Real Hackathon API call: POST /optimize-energy
  const handleOptimize = async () => {
    setInputValidationError(null);
    setApiError(null);

    // 1. Validate the frontend input
    const validationErr = validateInputs();
    if (validationErr) {
      setInputValidationError(validationErr);
      return;
    }

    setLoading(true);

    try {
      // 2. Build exact request payload from current state
      const requestPayload: OptimizeRequest = {
        scenario_id: scenarioId.trim(),
        operator_notes: operatorNotes.filter((n) => n.trim() !== ""),
        hours,
        battery,
      };

      // 3. Send exact request to POST /optimize-energy
      const response = await fetch("/optimize-energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || responseData.message || `API request failed with HTTP ${response.status}`
        );
      }

      // 4. Update UI with the actual returned response from the backend
      setResult(responseData);
      setIsDemoResult(false);
      setActiveTab("dashboard");
    } catch (err: any) {
      console.error("Optimization failed:", err);
      setApiError(err.message || "An unknown error occurred during optimization.");
    } finally {
      setLoading(false);
    }
  };

  // Transform result for chart visualizations
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.hourly_plan.map((entry, i) => ({
      hour: entry.hour,
      hourLabel: `${entry.hour}:00`,
      demand: hours[i]?.demand_kwh ?? 0,
      solarAvailable: hours[i]?.solar_kwh ?? 0,
      solarUsed: entry.solar_used_kwh,
      grid: entry.grid_kwh,
      batteryEnergy: entry.battery_energy_after_kwh,
      batteryAction: entry.battery_action,
      batteryAmount: entry.battery_kwh,
      tariff: hours[i]?.tariff_bdt_per_kwh ?? 0,
      minReserve: battery.minimum_energy_kwh,
      capacity: battery.capacity_kwh,
    }));
  }, [result, hours, battery]);

  // Comprehensive 6-Point Verification of the returned schedule
  const validationChecks = useMemo(() => {
    if (!result) return null;
    const tolerance = 0.01;
    const checks: { label: string; passed: boolean; details: string; failureReason?: string }[] = [];

    // 1. Energy Balance: grid + solar_used + discharge = demand + charge
    let balancePassed = true;
    let balanceFailure = "";
    for (let i = 0; i < 24; i++) {
      const entry = result.hourly_plan[i];
      const demand = hours[i].demand_kwh;
      const discharge = entry.battery_action === "discharge" ? entry.battery_kwh : 0;
      const charge = entry.battery_action === "charge" ? entry.battery_kwh : 0;
      const supply = entry.grid_kwh + entry.solar_used_kwh + discharge;
      const consumed = demand + charge;
      const diff = Math.abs(supply - consumed);
      if (diff > tolerance) {
        balancePassed = false;
        balanceFailure = `Hour ${i}:00 mismatch. Supply (${supply.toFixed(2)}) ≠ Demand+Charge (${consumed.toFixed(2)}). Diff = ${diff.toFixed(3)} kWh.`;
        break;
      }
    }
    checks.push({
      label: "Energy Balance",
      passed: balancePassed,
      details: balancePassed
        ? "grid_kwh + solar_used_kwh + discharge_kwh = demand_kwh + charge_kwh holds exactly for all 24 hours."
        : balanceFailure,
      failureReason: balancePassed ? undefined : balanceFailure,
    });

    // 2. Battery Bounds: minimum_energy <= energy_after <= capacity
    let boundsPassed = true;
    let boundsFailure = "";
    for (const entry of result.hourly_plan) {
      if (
        entry.battery_energy_after_kwh < battery.minimum_energy_kwh - tolerance ||
        entry.battery_energy_after_kwh > battery.capacity_kwh + tolerance
      ) {
        boundsPassed = false;
        boundsFailure = `Hour ${entry.hour}:00 battery energy ${entry.battery_energy_after_kwh} kWh is outside valid limits [${battery.minimum_energy_kwh}, ${battery.capacity_kwh}].`;
        break;
      }
    }
    checks.push({
      label: "Battery Bounds",
      passed: boundsPassed,
      details: boundsPassed
        ? `Battery energy remained strictly within physical limits [${battery.minimum_energy_kwh}, ${battery.capacity_kwh}] kWh for every hour.`
        : boundsFailure,
      failureReason: boundsPassed ? undefined : boundsFailure,
    });

    // 3. Charge/Discharge Limits
    let limitsPassed = true;
    let limitsFailure = "";
    for (const entry of result.hourly_plan) {
      if (entry.battery_action === "charge" && entry.battery_kwh > battery.max_charge_kwh_per_hour + tolerance) {
        limitsPassed = false;
        limitsFailure = `Hour ${entry.hour}:00 charge ${entry.battery_kwh} kWh exceeds max charge rate ${battery.max_charge_kwh_per_hour} kWh/h.`;
        break;
      }
      if (entry.battery_action === "discharge" && entry.battery_kwh > battery.max_discharge_kwh_per_hour + tolerance) {
        limitsPassed = false;
        limitsFailure = `Hour ${entry.hour}:00 discharge ${entry.battery_kwh} kWh exceeds max discharge rate ${battery.max_discharge_kwh_per_hour} kWh/h.`;
        break;
      }
      if (entry.battery_action === "idle" && entry.battery_kwh > tolerance) {
        limitsPassed = false;
        limitsFailure = `Hour ${entry.hour}:00 idle action had non-zero power flow (${entry.battery_kwh} kWh).`;
        break;
      }
    }
    checks.push({
      label: "Charge/Discharge Limits",
      passed: limitsPassed,
      details: limitsPassed
        ? `Hourly charge (max ${battery.max_charge_kwh_per_hour} kWh/h) and discharge (max ${battery.max_discharge_kwh_per_hour} kWh/h) rate limits respected; zero flow on idle.`
        : limitsFailure,
      failureReason: limitsPassed ? undefined : limitsFailure,
    });

    // 4. Solar Limit: solar_used <= effective_solar
    let solarPassed = true;
    let solarFailure = "";
    for (let h = 0; h < 24; h++) {
      let maxAvailable = hours[h].solar_kwh;
      // Check if directive reduced solar
      if (result.directive_interpretation) {
        for (const di of result.directive_interpretation) {
          if (di.applies && di.directive_type === "solar_reduction" && di.structured_adjustment) {
            const adj = di.structured_adjustment as any;
            if (adj.hours && adj.hours.includes(h)) {
              maxAvailable *= adj.factor;
            }
          }
        }
      }
      if (result.hourly_plan[h].solar_used_kwh > maxAvailable + tolerance) {
        solarPassed = false;
        solarFailure = `Hour ${h}:00 solar used (${result.hourly_plan[h].solar_used_kwh} kWh) exceeded usable solar (${maxAvailable.toFixed(2)} kWh).`;
        break;
      }
    }
    checks.push({
      label: "Solar Limit",
      passed: solarPassed,
      details: solarPassed
        ? "Usable solar generation limits strictly observed across all 24 hours (including reduction factors)."
        : solarFailure,
      failureReason: solarPassed ? undefined : solarFailure,
    });

    // 5. Operator Directive Compliance
    let directivesPassed = true;
    const violations: string[] = [];
    if (result.directive_interpretation) {
      for (const d of result.directive_interpretation) {
        if (!d.applies || !d.structured_adjustment) continue;
        const adj = d.structured_adjustment as any;
        const targetHours: number[] = adj.hours || [];

        if (d.directive_type === "solar_reduction") {
          const factor = adj.factor ?? 1.0;
          for (const h of targetHours) {
            const cap = hours[h].solar_kwh * factor;
            if (result.hourly_plan[h].solar_used_kwh > cap + tolerance) {
              directivesPassed = false;
              violations.push(`H${h}: solar used ${result.hourly_plan[h].solar_used_kwh} > curtailed limit ${cap.toFixed(1)}`);
            }
          }
        } else if (d.directive_type === "minimum_battery_reserve") {
          const minReserve = adj.minimum_energy_kwh;
          for (const h of targetHours) {
            if (result.hourly_plan[h].battery_energy_after_kwh < minReserve - tolerance) {
              directivesPassed = false;
              violations.push(`H${h}: battery ${result.hourly_plan[h].battery_energy_after_kwh} < required reserve ${minReserve}`);
            }
          }
        } else if (d.directive_type === "no_charge_window") {
          for (const h of targetHours) {
            if (result.hourly_plan[h].battery_action === "charge" && result.hourly_plan[h].battery_kwh > tolerance) {
              directivesPassed = false;
              violations.push(`H${h}: charged ${result.hourly_plan[h].battery_kwh} kWh during no-charge window`);
            }
          }
        } else if (d.directive_type === "no_discharge_window") {
          for (const h of targetHours) {
            if (result.hourly_plan[h].battery_action === "discharge" && result.hourly_plan[h].battery_kwh > tolerance) {
              directivesPassed = false;
              violations.push(`H${h}: discharged ${result.hourly_plan[h].battery_kwh} kWh during no-discharge window`);
            }
          }
        } else if (d.directive_type === "max_grid_window") {
          const maxG = adj.max_grid_kwh;
          for (const h of targetHours) {
            if (result.hourly_plan[h].grid_kwh > maxG + tolerance) {
              directivesPassed = false;
              violations.push(`H${h}: grid ${result.hourly_plan[h].grid_kwh} > max allowed cap ${maxG}`);
            }
          }
        }
      }
    }
    checks.push({
      label: "Operator Directive Compliance",
      passed: directivesPassed,
      details: directivesPassed
        ? "All extracted operator directives (solar reductions, reserve holds, blackout windows, grid caps) verified in schedule."
        : `Directive violations detected: ${violations.join(", ")}`,
      failureReason: directivesPassed ? undefined : violations.join("; "),
    });

    // 6. End-of-Day Battery Neutrality
    const finalEnergy = result.hourly_plan[23].battery_energy_after_kwh;
    const neutralityPassed = Math.abs(finalEnergy - battery.initial_energy_kwh) < tolerance;
    checks.push({
      label: "End-of-Day Battery Neutrality",
      passed: neutralityPassed,
      details: neutralityPassed
        ? `Final battery energy (${finalEnergy.toFixed(2)} kWh) equals initial battery energy (${battery.initial_energy_kwh} kWh).`
        : `Neutrality violation: Final energy is ${finalEnergy.toFixed(2)} kWh, but initial was ${battery.initial_energy_kwh} kWh.`,
      failureReason: neutralityPassed ? undefined : `Final energy ${finalEnergy.toFixed(2)} ≠ Initial ${battery.initial_energy_kwh}`,
    });

    return checks;
  }, [result, hours, battery]);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      
      {/* Ambient background glows for glassy depth */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Demo Banner when viewing initial demo preview */}
      {isDemoResult && (
        <div id="demo-banner" className="relative z-10 bg-amber-950/40 backdrop-blur-xl border-b border-amber-500/30 px-4 py-2.5 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_20px_rgba(245,158,11,0.1)]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg font-black text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
              Demo Data — Not Used by the Judge
            </span>
            <span className="font-semibold text-amber-100">
              Demo / Preview Data loaded for initial UI demonstration. You can replace this with your own scenario or click "Optimize Energy" to run the live API.
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">
            Demo Data — You can replace this with your own scenario.
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen">

        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-950/60 backdrop-blur-2xl border-r border-slate-800/80 hidden lg:flex flex-col p-6 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-cyan-400/30">
              <Zap className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight text-white tracking-tight">GridWise</h1>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">BUP CSE Fest 2026</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-2 flex-1">
            <button
              id="nav-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview & Visuals
            </button>
            <button
              id="nav-table"
              onClick={() => setActiveTab("table")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "table"
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              24-Hour Plan Table
            </button>
            <button
              id="nav-config"
              onClick={() => setActiveTab("config")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "config"
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Scenario Editor (24h)
            </button>
          </nav>

          {/* Sidebar Health Check Box */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="bg-slate-900/50 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800/80 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400">GET /health</span>
                <span
                  id="sidebar-health-status"
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                    healthStatus === "online"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : healthStatus === "checking"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      healthStatus === "online"
                        ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                        : healthStatus === "checking"
                        ? "bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]"
                        : "bg-rose-400 shadow-[0_0_6px_#f87171]"
                    }`}
                  />
                  {healthStatus === "online"
                    ? "API Status: Online"
                    : healthStatus === "checking"
                    ? "Checking..."
                    : "API Status: Offline"}
                </span>
              </div>
              {healthError && (
                <p className="text-[10px] text-rose-400 font-mono mb-2 truncate" title={healthError}>
                  {healthError}
                </p>
              )}
              <button
                id="btn-sidebar-check-health"
                onClick={handleCheckHealth}
                disabled={healthChecking}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 py-1.5 rounded-xl transition-all shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${healthChecking ? "animate-spin text-cyan-400" : ""}`} />
                Check API Health
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto overflow-x-hidden">
          
          {/* Header Section */}
          <header className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                  BUP CSE Fest 2026 · Online Preliminary
                </span>
                <span className="text-xs text-slate-400 font-medium">Smart Campus Energy Scheduling</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                GridWise LLM Energy Optimizer
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                Dynamic 24-Hour LP Cost Minimization with LLM Directive Extraction
              </p>
            </div>

            {/* Header Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Check API Health Button (Prominent Requirement #8) */}
              <button
                id="btn-check-api-health"
                onClick={handleCheckHealth}
                disabled={healthChecking}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all backdrop-blur-xl ${
                  healthStatus === "online"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : healthStatus === "checking"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                }`}
                title="Call GET /health"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthChecking ? "animate-spin" : ""}`} />
                <span>
                  {healthStatus === "online"
                    ? "API Status: Online"
                    : healthStatus === "checking"
                    ? "Checking API..."
                    : "API Status: Offline"}
                </span>
              </button>

              {/* Load Public Sample Case Dropdown (Requirement #6) */}
              <div className="flex items-center bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-xl p-1 shadow-lg">
                <span className="text-[11px] font-bold text-slate-400 uppercase px-2">Load Public Sample Case:</span>
                <select
                  id="select-sample-case"
                  value={selectedSampleId}
                  onChange={(e) => handleSelectSampleCase(e.target.value)}
                  className="bg-slate-900 text-xs font-semibold text-slate-200 border-none focus:ring-0 outline-none pr-3 py-1 cursor-pointer max-w-[200px] truncate rounded-lg"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Select Public Sample Case --</option>
                  {sampleCases.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.id}: {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset to Demo Data Button */}
              <button
                id="btn-reset-demo"
                onClick={handleResetToDemo}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl font-semibold text-xs transition-all shadow-md"
                title="Reset scenario back to initial Demo Data"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Demo Data</span>
              </button>

              {/* Prominent Optimize Energy Button (Requirement #7) */}
              <button
                id="btn-optimize-energy"
                onClick={handleOptimize}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs md:text-sm disabled:opacity-50 disabled:cursor-wait transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-blue-400/30 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Optimizing Schedule...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>Optimize Energy</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Active Sample Banner if selected */}
          {activeSampleCase && (
            <div className="mb-6 p-4 bg-blue-950/30 backdrop-blur-xl border border-blue-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Loaded Official Sample: </span>
                  <span className="font-mono font-bold text-cyan-400">{activeSampleCase.id}</span> — <span className="text-slate-200">{activeSampleCase.label}</span>
                  {activeSampleCase.rationale && (
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{activeSampleCase.rationale}</p>
                  )}
                </div>
              </div>
              {activeSampleCase.expected_output && (
                <div className="flex items-center gap-2.5 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-blue-500/20 flex-shrink-0">
                  <span className="text-slate-400">Ref Benchmark:</span>
                  <span className="font-bold text-emerald-400">{activeSampleCase.expected_output.total_cost_bdt} BDT</span>
                  <span className="text-slate-600">|</span>
                  <span className="font-bold text-cyan-300">{activeSampleCase.expected_output.total_grid_kwh} kWh</span>
                </div>
              )}
            </div>
          )}

          {/* Input Validation Error Alert */}
          {inputValidationError && (
            <div className="mb-6 p-4 bg-amber-950/30 backdrop-blur-xl border border-amber-500/40 rounded-2xl text-amber-200 text-xs flex items-start gap-3 shadow-[0_4px_20px_rgba(245,158,11,0.15)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold text-amber-300">Scenario Input Validation Warning</p>
                <p className="mt-0.5 text-[11px] text-amber-200/90">{inputValidationError}</p>
              </div>
            </div>
          )}

          {/* API Error Alert (Requirement #16 - Clear Error Display) */}
          {apiError && (
            <div className="mb-6 p-4 bg-rose-950/30 backdrop-blur-xl border border-rose-500/40 rounded-2xl text-rose-200 text-xs flex items-start gap-3 shadow-[0_4px_20px_rgba(244,63,94,0.15)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold text-rose-300">Backend Optimization Pipeline Error (POST /optimize-energy)</p>
                <p className="mt-0.5 text-[11px] font-mono leading-relaxed text-rose-200/90">{apiError}</p>
              </div>
            </div>
          )}

          {/* Navigation View Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Overview & Visuals
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "table"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              24-Hour Energy Plan (Table)
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "config"
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Scenario Editor (Grid, Solar, Tariffs & Battery)
            </button>
          </div>

          {/* ==================================================== */}
          {/* TAB 1: DASHBOARD (OVERVIEW, RESULTS, CHARTS, VALIDATION) */}
          {/* ==================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">

              {/* Status Header for Result */}
              {result && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        isDemoResult
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isDemoResult ? "Demo / Preview Data" : "Live API Optimization Result"}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      Scenario: <span className="font-mono text-cyan-400">{result.scenario_id}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isDemoResult
                      ? "Demo Data — You can replace this with your own scenario."
                      : "Dynamically solved by LP solver + Gemini LLM"}
                  </span>
                </div>
              )}

              {/* SECTION C: RESULT SUMMARY HERO CARDS (Requirement #9.C) */}
              {result && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Cost */}
                  <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)] group hover:border-slate-700/80 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/70 before:to-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Grid Cost</p>
                    <p className="text-2xl font-extrabold mt-1 text-emerald-400 tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                      {result.total_cost_bdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-bold text-slate-400">BDT</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Cost minimized</p>
                  </div>

                  {/* Total Grid kWh */}
                  <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)] group hover:border-slate-700/80 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-500/70 before:to-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Grid Energy</p>
                    <p className="text-2xl font-extrabold mt-1 text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                      {result.total_grid_kwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-bold text-slate-400">kWh</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">24h imported electricity</p>
                  </div>

                  {/* Peak Grid kWh */}
                  <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)] group hover:border-slate-700/80 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-amber-500/70 before:to-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Grid Load</p>
                    <p className="text-2xl font-extrabold mt-1 text-amber-400 tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                      {result.peak_grid_kwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-bold text-slate-400">kWh</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Max hourly demand on feeder</p>
                  </div>

                  {/* Solar Coverage */}
                  <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)] group hover:border-slate-700/80 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-cyan-500/70 before:to-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solar Used</p>
                    <p className="text-2xl font-extrabold mt-1 text-cyan-400 tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                      {result.hourly_plan.reduce((acc, h) => acc + h.solar_used_kwh, 0).toFixed(1)}{" "}
                      <span className="text-xs font-bold text-slate-400">kWh</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Clean solar power absorbed</p>
                  </div>
                </div>
              )}

              {/* SECTION 11: CHARTS (Requirement #11) */}
              <section className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ChartIcon className="w-4 h-4 text-cyan-400" />
                      Visualizations (Actual API Data)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hour-by-hour demand, solar utilization, grid purchases, battery state, and electricity tariff
                    </p>
                  </div>

                  {/* Chart View Selector */}
                  <div className="flex bg-slate-950/60 border border-slate-800/80 p-1 rounded-xl gap-1 self-start sm:self-auto">
                    <button
                      onClick={() => setChartView("combined")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        chartView === "combined"
                          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      Combined
                    </button>
                    <button
                      onClick={() => setChartView("power")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        chartView === "power"
                          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      Demand vs Solar vs Grid
                    </button>
                    <button
                      onClick={() => setChartView("battery")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        chartView === "battery"
                          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      Battery Energy (24h)
                    </button>
                    <button
                      onClick={() => setChartView("tariff")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        chartView === "tariff"
                          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      Tariff Profile (BDT)
                    </button>
                  </div>
                </div>

                <div className="h-[340px] w-full">
                  {result ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartView === "combined" ? (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '16px', backdropFilter: 'blur(16px)', color: '#f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', padding: '12px' }}
                            itemStyle={{ fontSize: "11px", fontWeight: 600 }}
                            formatter={(value: any, name?: any) => [`${Number(value).toFixed(1)} kWh`, String(name || "").toUpperCase()]}
                            labelFormatter={(lbl) => `Hour ${lbl}`}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "#94a3b8" }} />
                          <Area type="monotone" dataKey="solarAvailable" name="Solar Available" fill="#fbbf24" stroke="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                          <Line type="monotone" dataKey="demand" name="Demand" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                          <Line type="stepAfter" dataKey="grid" name="Grid Imported" stroke="#f1f5f9" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="batteryEnergy" name="Battery Energy After" stroke="#34d399" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                        </ComposedChart>
                      ) : chartView === "power" ? (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '16px', backdropFilter: 'blur(16px)', color: '#f8fafc', padding: '12px' }}
                            formatter={(value: any, name?: any) => [`${Number(value).toFixed(1)} kWh`, String(name || "").toUpperCase()]}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                          <Area type="monotone" dataKey="solarUsed" name="Solar Used" fill="#fbbf24" stroke="#f59e0b" fillOpacity={0.3} strokeWidth={2} />
                          <Line type="monotone" dataKey="demand" name="Campus Demand" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} />
                          <Line type="stepAfter" dataKey="grid" name="Grid Import" stroke="#f1f5f9" strokeWidth={2} dot={{ r: 2 }} />
                        </ComposedChart>
                      ) : chartView === "battery" ? (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} domain={[0, Math.max(battery.capacity_kwh * 1.1, 100)]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '16px', backdropFilter: 'blur(16px)', color: '#f8fafc', padding: '12px' }}
                            formatter={(value: any, name?: any) => [`${Number(value).toFixed(1)} kWh`, String(name || "").toUpperCase()]}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                          <Area type="monotone" dataKey="batteryEnergy" name="Battery Energy State" fill="#10b981" stroke="#34d399" fillOpacity={0.25} strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="minReserve" name="Min Reserve Bound" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '16px', backdropFilter: 'blur(16px)', color: '#f8fafc', padding: '12px' }}
                            formatter={(value: any) => [`${Number(value).toFixed(0)} BDT/kWh`, "Tariff Rate"]}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                          <Bar dataKey="tariff" name="Grid Tariff (BDT/kWh)" fill="#818cf8" radius={[6, 6, 0, 0]} />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                      <ChartIcon className="w-8 h-8 opacity-40 mb-2 text-cyan-400" />
                      <p className="text-xs font-semibold">Click "Optimize Energy" to run the schedule and view graphs</p>
                    </div>
                  )}
                </div>
              </section>

              {/* BOTTOM TWO COLUMNS: DIRECTIVES & 6-POINT VALIDATION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SECTION 9.A: DIRECTIVE INTERPRETATION (Requirement #9.A) */}
                <div className="lg:col-span-6 space-y-6">
                  <section className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        A. Directive Interpretation (LLM Extracted)
                      </h3>
                      {result?.directive_interpretation && (
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                          {result.directive_interpretation.length} Directives
                        </span>
                      )}
                    </div>

                    {result?.directive_interpretation && result.directive_interpretation.length > 0 ? (
                      <div className="space-y-3.5">
                        {result.directive_interpretation.map((di, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 space-y-2 hover:border-slate-700/80 transition-all">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-200">
                                note_index: <span className="font-mono text-cyan-400">{di.note_index}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                    di.applies ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-800/80 text-slate-400"
                                  }`}
                                >
                                  applies: {String(di.applies)}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  {di.directive_type}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {di.explanation}
                            </p>

                            <div className="pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                structured_adjustment:
                              </span>
                              <pre className="text-[11px] font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto shadow-inner">
                                {di.structured_adjustment ? JSON.stringify(di.structured_adjustment, null, 2) : "null"}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-500 text-xs italic">
                        No directives interpreted yet. Click "Optimize Energy" to run the LLM interpreter.
                      </div>
                    )}

                    {/* SECTION 9.C: PLAN SUMMARY */}
                    {result && (
                      <div className="mt-5 p-4 rounded-2xl bg-blue-950/30 backdrop-blur-md border border-blue-500/30 shadow-[0_4px_16px_rgba(59,130,246,0.1)]">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          Plan Summary:
                        </span>
                        <p className="text-xs text-blue-100 italic leading-relaxed">
                          "{result.plan_summary}"
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* SECTION 10: 6-POINT VALIDATION DISPLAY (Requirement #10) */}
                <div className="lg:col-span-6 space-y-6">
                  <section className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Backend Validation Status (6-Point Integrity)
                      </h3>
                      {validationChecks && (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            validationChecks.every((c) => c.passed)
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                          }`}
                        >
                          {validationChecks.every((c) => c.passed) ? "ALL CHECKS PASSED" : "VIOLATION DETECTED"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {validationChecks ? (
                        validationChecks.map((v, i) => (
                          <div
                            key={i}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              v.passed
                                ? "bg-emerald-950/20 border-emerald-500/30"
                                : "bg-rose-950/30 border-rose-500/40"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  v.passed ? "bg-emerald-500 text-slate-950 shadow-[0_0_8px_#34d399]" : "bg-rose-500 text-white shadow-[0_0_8px_#f87171]"
                                }`}
                              >
                                {v.passed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <AlertCircle className="w-2.5 h-2.5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-white">{v.label}</p>
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                      v.passed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    }`}
                                  >
                                    {v.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-1 leading-snug">{v.details}</p>
                                {v.failureReason && (
                                  <p className="text-[10px] font-mono font-bold text-rose-400 mt-1">
                                    Failure: {v.failureReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-500 text-xs italic">
                          Click "Optimize Energy" to run the plan and verify physical integrity.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: 24-HOUR PLAN TABLE (Requirement #9.B) */}
          {/* ==================================================== */}
          {activeTab === "table" && (
            <section className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    B. 24-Hour Energy Plan (Exact Output Schedule)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hourly power allocation: demand, solar available, solar used, grid import, battery action, and state of charge
                  </p>
                </div>
                {result && (
                  <div className="text-xs font-semibold text-slate-300 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800/80 shadow-inner">
                    Total Cost: <span className="font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{result.total_cost_bdt.toFixed(2)} BDT</span>
                  </div>
                )}
              </div>

              {result ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800/80 text-[10px]">
                      <tr>
                        <th className="px-3 py-3">Hour</th>
                        <th className="px-3 py-3">Demand (kWh)</th>
                        <th className="px-3 py-3">Solar Avail (kWh)</th>
                        <th className="px-3 py-3">Solar Used (kWh)</th>
                        <th className="px-3 py-3">Grid (kWh)</th>
                        <th className="px-3 py-3">Tariff (BDT/kWh)</th>
                        <th className="px-3 py-3">Battery Action</th>
                        <th className="px-3 py-3">Battery Amount (kWh)</th>
                        <th className="px-3 py-3">Battery Energy After (kWh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {result.hourly_plan.map((entry, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-400">{entry.hour}:00</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-200">{hours[i]?.demand_kwh ?? "-"}</td>
                          <td className="px-3 py-2.5 text-amber-400">{hours[i]?.solar_kwh ?? "-"}</td>
                          <td className="px-3 py-2.5 font-semibold text-amber-300">{entry.solar_used_kwh.toFixed(1)}</td>
                          <td className="px-3 py-2.5 font-bold text-white">{entry.grid_kwh.toFixed(1)}</td>
                          <td className="px-3 py-2.5 text-indigo-300">{hours[i]?.tariff_bdt_per_kwh ?? "-"}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                entry.battery_action === "charge"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : entry.battery_action === "discharge"
                                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                  : "bg-slate-800 text-slate-400 border border-slate-700/60"
                              }`}
                            >
                              {entry.battery_action}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-300">{entry.battery_kwh.toFixed(1)}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-emerald-400">
                            {entry.battery_energy_after_kwh.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs italic border-2 border-dashed border-slate-800 rounded-2xl">
                  No plan generated yet. Click "Optimize Energy" to run the schedule.
                </div>
              )}
            </section>
          )}

          {/* ==================================================== */}
          {/* TAB 3: SCENARIO EDITOR (Requirement #5) */}
          {/* ==================================================== */}
          {activeTab === "config" && (
            <div className="space-y-8">
              
              {/* Scenario ID & Operator Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Scenario ID & Directives Editor */}
                <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Scenario Identity & Operator Notes
                    </h3>
                    <span className="text-[10px] font-bold bg-blue-500/10 text-cyan-300 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                      {operatorNotes.filter((n) => n.trim() !== "").length} Active Notes
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Scenario ID
                    </label>
                    <input
                      id="input-scenario-id"
                      type="text"
                      value={scenarioId}
                      onChange={(e) => setScenarioId(e.target.value)}
                      placeholder="e.g. SAMPLE-01 or CAMPUS-TEST-01"
                      className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-xs font-semibold text-slate-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">
                        Operator Notes (1–3 Natural Language Directives)
                      </label>
                      <span className="text-[10px] text-slate-500">Interpreted dynamically by Gemini LLM</span>
                    </div>

                    <div className="space-y-2.5">
                      {operatorNotes.map((note, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-[10px] font-bold text-slate-500 mt-2 px-1 font-mono">
                            #{idx}
                          </span>
                          <textarea
                            value={note}
                            onChange={(e) => {
                              const updated = [...operatorNotes];
                              updated[idx] = e.target.value;
                              setOperatorNotes(updated);
                            }}
                            placeholder={`Enter operator note ${idx}...`}
                            className="flex-1 px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-xs text-slate-200 outline-none transition-all min-h-[55px] resize-none leading-relaxed placeholder:text-slate-600"
                          />
                          {operatorNotes.length > 1 && (
                            <button
                              onClick={() => setOperatorNotes(operatorNotes.filter((_, i) => i !== idx))}
                              className="p-2 text-slate-500 hover:text-rose-400 transition-colors mt-1"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {operatorNotes.length < 3 && (
                        <button
                          onClick={() => setOperatorNotes([...operatorNotes, ""])}
                          className="w-full py-2 border-2 border-dashed border-slate-800/80 text-slate-400 rounded-xl hover:border-blue-500/40 hover:text-cyan-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Note ({operatorNotes.length}/3)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Battery Hardware Specs Editor */}
                <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    Battery Hardware Specifications
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Total Capacity (kWh)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={battery.capacity_kwh}
                        onChange={(e) => setBattery({ ...battery, capacity_kwh: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-semibold text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Initial Energy (kWh)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={battery.initial_energy_kwh}
                        onChange={(e) => setBattery({ ...battery, initial_energy_kwh: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-semibold text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Min Reserve (kWh)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={battery.minimum_energy_kwh}
                        onChange={(e) => setBattery({ ...battery, minimum_energy_kwh: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-semibold text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Max Charge Rate (kWh/h)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={battery.max_charge_kwh_per_hour}
                        onChange={(e) => setBattery({ ...battery, max_charge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-semibold text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Max Discharge Rate (kWh/h)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={battery.max_discharge_kwh_per_hour}
                        onChange={(e) => setBattery({ ...battery, max_discharge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-semibold text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Note: End-of-day battery neutrality constraint ensures hour 23 energy after equals initial energy ({battery.initial_energy_kwh} kWh).
                  </p>
                </div>
              </div>

              {/* 24-Hour Input Data Table (Editable) */}
              <section className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      24-Hour Profile Data (Hourly Records)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Directly edit demand, forecasted solar generation, and electricity tariffs for all 24 hours
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg">
                    24 Hours Loaded
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800/80 text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Hour</th>
                        <th className="px-4 py-3">Demand (kWh)</th>
                        <th className="px-4 py-3">Solar Forecast (kWh)</th>
                        <th className="px-4 py-3">Tariff (BDT/kWh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {hours.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2 font-mono font-bold text-slate-400">{h.hour}:00</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={h.demand_kwh}
                              onChange={(e) => {
                                const copy = [...hours];
                                copy[i].demand_kwh = parseFloat(e.target.value) || 0;
                                setHours(copy);
                              }}
                              className="w-28 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg text-slate-200 font-medium outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={h.solar_kwh}
                              onChange={(e) => {
                                const copy = [...hours];
                                copy[i].solar_kwh = parseFloat(e.target.value) || 0;
                                setHours(copy);
                              }}
                              className="w-28 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg text-amber-400 font-medium outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              value={h.tariff_bdt_per_kwh}
                              onChange={(e) => {
                                const copy = [...hours];
                                copy[i].tariff_bdt_per_kwh = parseFloat(e.target.value) || 0;
                                setHours(copy);
                              }}
                              className="w-28 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg text-indigo-300 font-medium outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
