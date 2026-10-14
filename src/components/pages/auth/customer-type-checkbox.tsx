"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { CustomerType } from "@/lib/validation/auth";

type CustomerTypeCheckboxProps = {
  value: CustomerType;
  onChange: (value: CustomerType) => void;
  label: string;
  disabled?: boolean;
};

export function CustomerTypeCheckbox(props: CustomerTypeCheckboxProps) {
  return (
    <label className="text-foreground flex cursor-pointer items-start gap-2.5 text-sm">
      <Checkbox
        className="mt-0.5"
        checked={props.value === "business"}
        disabled={props.disabled}
        onCheckedChange={(checked) =>
          props.onChange(checked ? "business" : "consumer")
        }
      />
      <span>{props.label}</span>
    </label>
  );
}
