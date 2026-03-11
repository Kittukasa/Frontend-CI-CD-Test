export const FEATURE_FLAGS = {
  analytics: {
    loyalty: false,
    stores: false,
    cdp: false,
  },
} as const;

export type AnalyticsFeatureKey = keyof typeof FEATURE_FLAGS.analytics;

export const isAnalyticsFeatureEnabled = (feature: AnalyticsFeatureKey): boolean =>
  FEATURE_FLAGS.analytics[feature];
