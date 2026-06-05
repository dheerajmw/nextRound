"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterRoleSuggestions } from "@/lib/interview/role-suggestions";
import { cn } from "@/lib/utils";

type TargetRoleComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export function TargetRoleCombobox({
  value,
  onChange,
  label = "Target role",
  placeholder = "e.g. Software Engineer, APM",
}: TargetRoleComboboxProps) {
  const listId = useId();
  const inputId = `${listId}-input`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    filterRoleSuggestions("")
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSuggestions = useCallback(async (query: string) => {
    try {
      const res = await fetch(
        `/api/roles/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        return;
      }
    } catch {
      // fall through to local list
    }
    setSuggestions(filterRoleSuggestions(query));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadSuggestions(value);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, loadSuggestions]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function selectRole(role: string) {
    onChange(role);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectRole(suggestions[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={rootRef} className="relative space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setOpen(true);
          void loadSuggestions(value);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-[var(--nr-surface-container-high)] py-1 shadow-lg"
        >
          {suggestions.map((role, index) => (
            <li
              key={role}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-foreground",
                index === activeIndex && "bg-primary/15 text-primary"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectRole(role);
              }}
            >
              {role}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
