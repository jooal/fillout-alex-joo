import React, { createContext, useContext, useState, ReactNode } from "react";

// need to define a step/tab in multi step form, should have an id for tracking state and label to display.
// clicking each tab should display the page

// this would match types defined from the BE
export enum PageType {
  Info = "Info",
  Details = "Details",
  Other = "Other",
}

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
  type: PageType;
};

const arrayMove = <T,>(arr: T[], from: number, to: number): T[] => {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

type MultiStepFormContextValue = {
  // each step in the form, should we set maximum steps?
  tabs: Tab[];
  selectedTab: string;
  setSelectedTab: (id: string) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  canGoToNext: boolean;
  canGoToPrev: boolean;
  //how do add a new tab, set id of the tab to put it after
  // addTabAfter: (
  //   afterId: string,
  //   // the id doesnt exist yet since it's not created
  //   newTab: Omit<Tab, "id"> & { id?: string }
  // ) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
};

const MultiStepFormContext = createContext<MultiStepFormContextValue | null>(
  null
);
export function MultiStepProvider({
  children,
  tabs,
  initialStepId,
}: {
  children: ReactNode;
  tabs: Tab[];
  initialStepId?: string;
}) {
  const [existingTabs, setExistingTabs] = useState<Tab[]>(tabs);
  const [selectedTab, setSelectedTab] = useState(initialStepId ?? tabs[0].id);

  const currentIndex = existingTabs.findIndex(s => s.id === selectedTab);
  const canGoToPrev = currentIndex > 0;
  const canGoToNext = currentIndex < existingTabs.length - 1;

  const goToPrevStep = () => {
    if (canGoToPrev) setSelectedTab(existingTabs[currentIndex - 1].id);
  };
  const goToNextStep = () => {
    if (canGoToNext) setSelectedTab(existingTabs[currentIndex + 1].id);
  };

  // const addTabAfter: MultiStepFormContextValue["addTabAfter"] = (
  //   afterId,
  //   newTab
  // ) => {
  //   const id = newTab.id ?? `tab-${Math.random().toString(36).slice(2, 10)}`;

  //   setExistingTabs(prev => {
  //     const idx = prev.findIndex(t => t.id === afterId);
  //     const nextTab: Tab = { id, ...newTab };
  //     if (idx === -1) return [...prev, nextTab];
  //     const copy = prev.slice();
  //     copy.splice(idx + 1, 0, nextTab);
  //     return copy;
  //   });

  //   setSelectedTab(id);
  // };

  const reorderTabs: MultiStepFormContextValue["reorderTabs"] = (
    fromIndex,
    toIndex
  ) => {
    setExistingTabs(prev => arrayMove(prev, fromIndex, toIndex));
  };

  return (
    <MultiStepFormContext.Provider
      value={{
        tabs: existingTabs,
        selectedTab,
        setSelectedTab,
        goToNextStep,
        goToPrevStep,
        canGoToNext,
        canGoToPrev,
        reorderTabs,
      }}
    >
      {children}
    </MultiStepFormContext.Provider>
  );
}

export function useMultiStep() {
  const ctx = useContext(MultiStepFormContext);
  if (!ctx) {
    throw new Error("useMultiStepForm must be used inside <MultiStepProvider>");
  }
  return ctx;
}
