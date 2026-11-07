/**
 * SAMPLE rows: placeholders that are not real Vest payouts. They appear only while no
 * real payouts exist (in Supabase via the visible_payouts view, or locally when Supabase
 * isn't configured) and are always labelled "Sample" in the UI.
 * `yarn db:seed-sql` regenerates supabase/seed.sql from packages/shared/src/sample-data.ts.
 */
export interface SampleRow {
  ref: string;
  hoursAgo: number;
  amount: number;
  processingHours: number;
}

export const SAMPLE_NOTE = "SAMPLE DATA — placeholder, not a real Vest payout.";

export const SAMPLE_ROWS: SampleRow[] = [
  { ref: "01", hoursAgo: 0.4, amount: 412.5, processingHours: 9.5 },
  { ref: "02", hoursAgo: 1.1, amount: 88.2, processingHours: 11 },
  { ref: "03", hoursAgo: 2.6, amount: 1250, processingHours: 13.2 },
  { ref: "04", hoursAgo: 4.0, amount: 54.1, processingHours: 7.8 },
  { ref: "05", hoursAgo: 6.3, amount: 2730.4, processingHours: 15.1 },
  { ref: "06", hoursAgo: 9.8, amount: 199, processingHours: 10.4 },
  { ref: "07", hoursAgo: 14.5, amount: 640, processingHours: 12.6 },
  { ref: "08", hoursAgo: 22, amount: 31.75, processingHours: 8.9 },
  { ref: "09", hoursAgo: 30, amount: 5400, processingHours: 18.3 },
  { ref: "10", hoursAgo: 41, amount: 920.3, processingHours: 11.7 },
  { ref: "11", hoursAgo: 55, amount: 150, processingHours: 9.1 },
  { ref: "12", hoursAgo: 70, amount: 3310, processingHours: 16.4 },
  { ref: "13", hoursAgo: 96, amount: 75.5, processingHours: 10.2 },
  { ref: "14", hoursAgo: 130, amount: 1800, processingHours: 14 },
  { ref: "15", hoursAgo: 190, amount: 260.9, processingHours: 12.1 },
  { ref: "16", hoursAgo: 260, amount: 11200, processingHours: 20.5 },
  { ref: "17", hoursAgo: 380, amount: 495, processingHours: 13.3 },
  { ref: "18", hoursAgo: 520, amount: 2045.6, processingHours: 15.8 },
];

export const sampleTraderName = (ref: string) => `Sample trader ${ref}`;
