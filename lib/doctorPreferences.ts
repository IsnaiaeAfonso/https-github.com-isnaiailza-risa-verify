import { useEffect, useState } from "react";

export type DoctorPreferences = {
  showRisaSection: boolean;
  enableRisaAudio: boolean;
  showClinicalSummary: boolean;
  showRiskCards: boolean;
  showTimeline: boolean;
};

export const DEFAULT_DOCTOR_PREFERENCES: DoctorPreferences = {
  showRisaSection: true,
  enableRisaAudio: true,
  showClinicalSummary: true,
  showRiskCards: true,
  showTimeline: true,
};

const STORAGE_KEY = "iasx-doctor-preferences-v1";
const PREFERENCES_EVENT = "iasx-doctor-preferences-changed";

export function getDoctorPreferences(): DoctorPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_DOCTOR_PREFERENCES;
  }

  try {
    const rawPreferences = window.localStorage.getItem(STORAGE_KEY);
    if (!rawPreferences) {
      return DEFAULT_DOCTOR_PREFERENCES;
    }

    const parsed = JSON.parse(rawPreferences) as Partial<DoctorPreferences>;
    return {
      ...DEFAULT_DOCTOR_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_DOCTOR_PREFERENCES;
  }
}

export function notifyDoctorPreferencesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT));
}

export function saveDoctorPreferences(
  nextPreferences: Partial<DoctorPreferences>,
): DoctorPreferences {
  const merged = {
    ...getDoctorPreferences(),
    ...nextPreferences,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    notifyDoctorPreferencesChanged();
  }

  return merged;
}

export function resetDoctorPreferences(): DoctorPreferences {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyDoctorPreferencesChanged();
  }

  return DEFAULT_DOCTOR_PREFERENCES;
}

export function useDoctorPreferences() {
  const [preferences, setPreferences] = useState<DoctorPreferences>(DEFAULT_DOCTOR_PREFERENCES);

  useEffect(() => {
    const syncPreferences = () => setPreferences(getDoctorPreferences());
    syncPreferences();

    if (typeof window === "undefined") return;

    window.addEventListener("storage", syncPreferences);
    window.addEventListener(PREFERENCES_EVENT, syncPreferences);

    return () => {
      window.removeEventListener("storage", syncPreferences);
      window.removeEventListener(PREFERENCES_EVENT, syncPreferences);
    };
  }, []);

  return preferences;
}
