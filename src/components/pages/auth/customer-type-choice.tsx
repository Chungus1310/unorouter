"use client";

import { cn } from "@/lib/utils";
import { unionLiterals } from "@/lib/validation/helpers";
import { customerTypeSchema, type CustomerType } from "@/lib/validation/auth";
import { useTranslations } from "next-intl";
import { useId } from "react";

const CUSTOMER_TYPES = unionLiterals(customerTypeSchema);

const LABEL_KEYS = {
  consumer: {
    title: "AUTH.CUSTOMER_TYPE.CONSUMER",
    hint: "AUTH.CUSTOMER_TYPE.CONSUMER_HINT",
  },
  business: {
    title: "AUTH.CUSTOMER_TYPE.BUSINESS",
    hint: "AUTH.CUSTOMER_TYPE.BUSINESS_HINT",
  },
} as const satisfies Record<CustomerType, { title: string; hint: string }>;

type CustomerTypeChoiceProps = {
  value: CustomerType | undefined;
  onChange: (value: CustomerType) => void;
  disabled?: boolean;
};

export function CustomerTypeChoice(props: CustomerTypeChoiceProps) {
  const t = useTranslations();
  const labelId = useId();

  return (
    <div className="space-y-2">
      <p id={labelId} className="text-foreground text-sm font-medium">
        {t("AUTH.CUSTOMER_TYPE.LABEL")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {CUSTOMER_TYPES.map((type) => {
          const selected = props.value === type;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={props.disabled}
              onClick={() => props.onChange(type)}
              className={cn(
                "border-border/60 bg-background/60 hover:bg-accent flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-50",
                selected && "border-primary bg-primary/10 hover:bg-primary/10",
              )}
            >
              <span className="text-foreground text-sm font-medium">
                {t(LABEL_KEYS[type].title)}
              </span>
              <span className="text-muted-foreground text-xs">
                {t(LABEL_KEYS[type].hint)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        {t("AUTH.CUSTOMER_TYPE.HELP")}
      </p>
    </div>
  );
}
