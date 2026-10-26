"use client";

import { useEffect, useState } from "react";
import { getArgentinaDateKey } from "./recitales";

export function useArgentinaToday() {
  const [today, setToday] = useState(() => getArgentinaDateKey());

  useEffect(() => {
    const refreshToday = () => setToday(getArgentinaDateKey());
    const timer = window.setInterval(refreshToday, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return today;
}
