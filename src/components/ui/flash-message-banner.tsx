"use client";

import { useEffect } from "react";

import { FormMessage } from "@/components/ui/form-message";
import type { FlashTone } from "@/lib/flash";

type FlashMessageBannerProps = {
  message: string;
  tone: FlashTone;
};

export function FlashMessageBanner({ message, tone }: FlashMessageBannerProps) {
  useEffect(() => {
    void fetch("/api/flash", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined);
  }, []);

  return <FormMessage message={message} tone={tone} />;
}
