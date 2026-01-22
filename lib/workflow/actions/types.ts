/**
 * Action Types
 * Contract: WORKFLOW_FUNC_ACTIONS
 */

import { Industry } from "../industries";

export interface ActionInput {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "color" | "image" | "number";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string | number;
  min?: number;
  max?: number;
}

export interface Action {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  industry: Industry;
  inputs: ActionInput[];
  promptTemplate: string;
  creditCost: number;
  examples?: string[];
}

export interface ActionCategory {
  id: string;
  name: string;
  nameKo: string;
  actions: Action[];
}
