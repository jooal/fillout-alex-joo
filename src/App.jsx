import { useState } from "react";
import "./App.css";
import { MultiStepFormNavbar } from "./components/MultiStepFormNavbar";
import { InfoPage } from "./pages/InfoPage";
import { DetailPage } from "./pages/DetailPage";
import { OtherPage } from "./pages/OtherPage";
import { MultiStepProvider, PageType } from "./context/MultiStepFormContext";
import { MultiStepFormViewport } from "./components/MultiStepFormViewport";

function App() {
  const [tabs] = useState([
    {
      label: "Info",
      id: "tab-1",
      content: <InfoPage />,
      type: PageType.Info,
    },
    {
      label: "Details",
      id: "tab-2",
      content: <DetailPage />,
      type: PageType.Details,
    },
    {
      label: "Other",
      id: "tab-3",
      content: <OtherPage />,
      type: PageType.Other,
    },
  ]);

  //default the selectedTab to the first one
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);
  return (
    <MultiStepProvider tabs={tabs}>
      <MultiStepFormViewport />
      <MultiStepFormNavbar
        tabs={tabs}
        selectedTabId={selectedTab}
        setSelectedTab={setSelectedTab}
      />
    </MultiStepProvider>
  );
}

export default App;
