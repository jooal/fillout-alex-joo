import React, { JSX, useEffect, useRef, useState } from "react";
import { PageType, useMultiStep } from "../context/MultiStepFormContext";
import {
  MdInfo,
  MdListAlt,
  MdMoreHoriz,
  MdContentCopy,
  MdDelete,
  MdEdit,
} from "react-icons/md";
import { FiPlus } from "react-icons/fi";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// renders selected form page
// drag to reorder
// on hover + button to add new page between two pages
// open menu per page
// highlight active page + select other page

// things to consider:
// accessability
//   - https://dev.to/eevajonnapanula/keyboard-accessible-tabs-with-react-5ch4https://medium.com/@andreasmcd/creating-an-accessible-tab-component-with-react-24ed30fde86a
//   - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
// custom colors/design
// responsiveness

// export interface Tab {
//   id: string;
//   label: string;
//   content: ReactNode;
// }

// export interface MultiStepFormNavbarProps {
//   tabs: Tab[];
//   selectedTabId: string;
//   onSelect: (id: string) => void;
// }

//sorting library: https://docs.dndkit.com/presets/sortable

interface SortableTabProps {
  id: string;
  isSelected: boolean;
  onClick: () => void;
  setRef?: (el: HTMLButtonElement | null) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const pageTypeIcons: Record<PageType, JSX.Element> = {
  [PageType.Info]: <MdInfo className="inline text-lg" />,
  [PageType.Details]: <MdListAlt className="inline text-lg" />,
  [PageType.Other]: <MdMoreHoriz className="inline text-lg" />,
};

const SortableTab = ({
  id,
  isSelected,
  onClick,
  setRef,
  children,
  onContextMenu,
}: SortableTabProps) => {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: "grab",
  };

  return (
    <button
      ref={el => {
        setNodeRef(el);
        setRef?.(el);
      }}
      style={style}
      className="tab-button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${id}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...listeners}
    >
      {children}
      <span className="drag-handle" aria-hidden="true" />
    </button>
  );
};

const NewPageModal = ({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) => {
  const [pageName, setPageName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = pageName.trim();
    if (!name) return;
    onSave(name);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <form onSubmit={handleSubmit}>
          <label htmlFor="pageName" className="modal-label">
            Page Name
          </label>
          <input
            id="pageName"
            type="text"
            value={pageName}
            onChange={e => setPageName(e.target.value.trim())}
            placeholder="Enter page name"
            className="modal-input"
          />
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn cancel"
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContextMenu = ({
  x,
  y,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: x,
    top: y,
  });

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(e.target as Node))
        return;
      onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const padding = 8;
    const { innerWidth: vw, innerHeight: vh } = window;

    let left = x;
    let top = y;

    const rect = el.getBoundingClientRect();

    if (left + rect.width + padding > vw) {
      left = Math.max(padding, vw - rect.width - padding);
    }
    if (top + rect.height + padding > vh) {
      top = Math.max(padding, y - rect.height - padding);
    }

    setPos({ left, top });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="ctx-menu"
      style={{ position: "fixed", left: pos.left, top: pos.top }}
    >
      <button role="menuitem" className="ctx-item" onClick={onRename}>
        <MdEdit /> Rename
      </button>
      <button role="menuitem" className="ctx-item" onClick={onDuplicate}>
        <MdContentCopy /> Duplicate
      </button>
      <button role="menuitem" className="ctx-item danger" onClick={onDelete}>
        <MdDelete /> Delete
      </button>
    </div>
  );
};

export const MultiStepFormNavbar = () => {
  const { tabs, selectedTab, setSelectedTab, reorderTabs, addTabAfter } =
    useMultiStep();

  const [newPageModalOpen, setNewPageModalOpen] = useState<boolean>(false);
  // need to track which tab to add new page after
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);

  //right click menu state
  const [menu, setMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    tabId: string | null;
  }>({
    open: false,
    x: 0,
    y: 0,
    tabId: null,
  });

  //how to keep track of tabs changing and reordering

  // currently selected tab index
  const selectedTabIndex = tabs.findIndex(t => t.id === selectedTab);

  // create a ref for keyboard accessability
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (i: number) => {
    tabRefs.current[i]?.focus();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = e => {
    if (
      !["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(e.key)
    )
      return;

    e.preventDefault();
    const last = tabs.length - 1;

    switch (e.key) {
      case "ArrowLeft":
        focusTab(selectedTabIndex > 0 ? selectedTabIndex - 1 : last);
        break;
      case "ArrowRight":
        focusTab(selectedTabIndex < last ? selectedTabIndex + 1 : 0);
        break;
      //spacebar
      case " ":
      case "Enter": {
        const focusedIndex = tabRefs.current.findIndex(
          el => el === document.activeElement
        );
        const idx = focusedIndex >= 0 ? focusedIndex : selectedTabIndex;
        setSelectedTab(tabs[idx].id);
        break;
      }
    }
  };

  //drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex(t => t.id === active.id);
    const newIndex = tabs.findIndex(t => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    reorderTabs(oldIndex, newIndex);
  };

  //right click menu
  const handleTabContextMenu =
    (tabId: string) =>
    (e: React.MouseEvent): void => {
      e.preventDefault();
      setMenu({ open: true, x: e.clientX, y: e.clientY, tabId });
    };

  const closeMenu = () => setMenu({ open: false, x: 0, y: 0, tabId: null });

  return (
    <div className="tabs-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div
          role="tablist"
          aria-label={"Multi Step Form"}
          className="tabs-row"
          onKeyDown={handleKeyDown}
        >
          <SortableContext
            items={tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="tabs-list">
              {tabs.map((tab, index) => {
                // is the tab selected
                const isSelected = tab.id === selectedTab;
                return (
                  <React.Fragment key={tab.id}>
                    <SortableTab
                      id={tab.id}
                      isSelected={isSelected}
                      onClick={() => setSelectedTab(tab.id)}
                      onContextMenu={handleTabContextMenu(tab.id)}
                      setRef={el => {
                        tabRefs.current[index] = el;
                      }}
                    >
                      <span className="label-icon">
                        {pageTypeIcons[tab.type]} {tab.label}
                      </span>
                    </SortableTab>

                    {index < tabs.length - 1 && (
                      <div className="tab-slot">
                        <button
                          className="add-inline-btn"
                          aria-label={`Add page after ${tab.label}`}
                          onClick={() => {
                            setNewPageModalOpen(true);
                            setInsertAfterId(tab.id);
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </SortableContext>
          <button className="tab-button">
            <span className="label-icon">
              <FiPlus className="text-lg" />
              Add page
            </span>
          </button>
        </div>
      </DndContext>

      {menu.open && menu.tabId && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          onRename={() => {
            console.log("Rename");
          }}
          onDuplicate={() => {
            console.log("Duplicate");
          }}
          onDelete={() => {
            console.log("Delete");
          }}
        />
      )}

      {newPageModalOpen && (
        <NewPageModal
          onClose={() => setNewPageModalOpen(false)}
          onSave={(name: string) => {
            if (!insertAfterId) return;
            addTabAfter(insertAfterId, {
              label: name,
              // Hard coding this page type for now but in real case this modal would have a dropdown to select page type
              type: PageType.Other,
              content: <div style={{ padding: 16 }}>{name}</div>,
            });
            setNewPageModalOpen(false);
            setInsertAfterId(null);
          }}
        />
      )}
    </div>
  );
};
