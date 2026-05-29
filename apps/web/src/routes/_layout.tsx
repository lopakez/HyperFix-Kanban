import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AssistantPanel } from "@/components/ai/assistant-panel";
import CommandPalette from "@/components/command-palette";
import SearchCommandMenu from "@/components/search-command-menu";
import {
  getModifierKeyText,
  useRegisterShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { useAIStore } from "@/store/ai";

// layout for the main app
export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { toggle } = useAIStore();

  useRegisterShortcuts({
    modifierShortcuts: {
      [getModifierKeyText()]: {
        a: toggle,
      },
    },
  });

  return (
    <>
      <Outlet />
      <CommandPalette />
      <SearchCommandMenu open={searchOpen} setOpen={setSearchOpen} />
      <AssistantPanel />
    </>
  );
}
