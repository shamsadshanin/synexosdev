# GridWise LLM Energy Optimizer

GridWise is a production-quality energy management system designed for the BUP CSE Fest 2026 Hackathon. It utilizes Large Language Models (LLMs) to interpret natural-language operator directives and applies deterministic linear programming to optimize 24-hour grid electricity usage.

## 🚀 Overview

The system addresses the challenge of balancing varying energy demand, solar availability, and fluctuating grid tariffs while adhering to strict operational directives issued by human operators in natural language.

### Core Capabilities

- **LLM-Based Interpretation**: Uses Google Gemini 1.5 Flash to convert complex natural language notes into structured energy directives.
- **Deterministic Guardrails**: Validates all LLM outputs to ensure they adhere to physical and competition constraints.
- **Optimal Scheduling**: Employs a Linear Programming (LP) solver to minimize total electricity cost across a 24-hour window.
- **Rigid Validation**: Independently verifies the final energy plan against all battery rules, energy balances, and directives before responding.

## 🛠 Architecture

The application follows a clean, modular architecture:

1.  **API Layer (`server.ts`)**: Express-based HTTP endpoints (`/health`, `/optimize-energy`).
2.  **Service Layer (`src/services/gridwise-service.ts`)**: Orchestrates the flow from input to optimized output.
3.  **LLM Interpreter (`src/llm/interpreter.ts`)**: Communicates with the Gemini API using advanced system prompting and structured output.
4.  **Guardrails (`src/guardrails/validator.ts`)**: Ensures LLM interpretations are safe, deterministic, and valid.
5.  **Optimizer (`src/optimizer/optimizer.ts`)**: Formulates and solves the LP problem for energy scheduling.
6.  **Plan Validator (`src/validation/plan-validator.ts`)**: Performs post-optimization checks and calculates totals.

## 🔋 Battery Model & Rules

The system implements a precise battery model:
- **Energy Balance**: `Grid + SolarUsed + Discharge = Demand + Charge`
- **Capacity Constraints**: `Reserve <= E_after <= Capacity`
- **Transition Logic**: `E_after = E_before + Charge - Discharge`
- **Rate Limits**: Respects maximum charge and discharge rates per hour.
- **End-of-Day Neutrality**: Final battery energy at hour 23 must equal the initial energy at hour 0.

## 📡 API Endpoints

### GET `/health`
Returns the operational status of the service.
- **Response**: `{ "status": "ok" }`

### POST `/optimize-energy`
Accepts a scenario and returns an optimized 24-hour energy plan.
- **Request Body**: See `src/types.ts` for `OptimizeRequest`.
- **Response Body**: See `src/types.ts` for `OptimizeResponse`.

## ⚙️ Environment Variables

- `GEMINI_API_KEY`: Required for Gemini AI API calls.
- `APP_URL`: The URL where the applet is hosted (injected at runtime).

## 🚀 Getting Started

### Local Setup
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set your `GEMINI_API_KEY` in a `.env` file.
4.  Run the development server: `npm run dev`

### Testing
- Run automated tests: `npm run test`
- Check health: `curl http://localhost:3000/health`

### Docker
- Build: `docker build -t gridwise-llm .`
- Run: `docker run -p 3000:3000 -e GEMINI_API_KEY=your_key gridwise-llm`

## 📊 Optimization Method
The system uses **Linear Programming (LP)** via the `javascript-lp-solver` library. This ensures a deterministic, global optimum for the cost-minimization objective while strictly satisfying all linear constraints and directives.

## 🤖 AI and Tools
Built with **Google AI Studio** using **Gemini 1.5 Flash**. The optimization logic is purely deterministic to ensure reliability in competition settings.
