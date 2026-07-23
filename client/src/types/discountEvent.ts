export type DiscountEventScope = "all" | "branch";

export interface DiscountEvent {
  _id: string;
  name: string;
  scope: DiscountEventScope;
  branchIds: string[];
  branchNames?: string[]; // only present on the admin list endpoint
  cashierCap: number;
  managerCap: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrentlyLive?: boolean; // only present on the admin list endpoint
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountEventPayload {
  name: string;
  scope: DiscountEventScope;
  branchIds?: string[]; // required when scope === "branch"
  cashierCap: number;
  managerCap: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export interface UpdateDiscountEventPayload {
  name?: string;
  scope?: DiscountEventScope;
  branchIds?: string[];
  cashierCap?: number;
  managerCap?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface EffectiveDiscountCap {
  capPercent: number;
  source: "static" | "event";
  eventName?: string;
}