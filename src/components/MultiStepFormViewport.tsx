import React from "react";
import { useMultiStep } from "../context/MultiStepFormContext";

interface StepViewportProps {
  keepMounted?: boolean;
}
export const MultiStepFormViewport = ({ keepMounted }: StepViewportProps) => {
  const { tabs, selectedTab } = useMultiStep();

  if (keepMounted) {
    return (
      <>
        {tabs.map(t => {
          const active = t.id === selectedTab;
          return (
            <section
              key={t.id}
              id={`panel-${t.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${t.id}`}
              hidden={!active}
            >
              {t.content}
            </section>
          );
        })}
      </>
    );
  }

  const active = tabs.find(t => t.id === selectedTab);
  return (
    <section
      id={`panel-${active?.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${active?.id}`}
    >
      {active?.content}
    </section>
  );
};
