"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "";

export function ClarityScript() {
  useEffect(() => {
    if (!CLARITY_ID) return;
    Clarity.init(CLARITY_ID);
  }, []);

  return null;
}
