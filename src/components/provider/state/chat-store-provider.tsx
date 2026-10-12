"use client";

import {
  CHAT_STORE_KEY,
  chatStoreAtom,
  chatStoreStorage,
  INITIAL_CHAT_STATE,
  type ChatState,
} from "@/store/chat-store";
import { environmentManager } from "@tanstack/react-query";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";

// Load-bearing half of the chatStoreAtom getOnInit pair (see CLAUDE.md "State"); removing
// it alone reintroduces React #418.
export function ChatStoreProvider(props: {
  children: ReactNode;
  data?: ChatState;
}) {
  // useHydrateAtoms records the atom in a WeakSet keyed by the store, and the store is a
  // module singleton, so on the server it seeds the FIRST request of a process and every
  // later one renders INITIAL_CHAT_STATE: the model button shipped "Select model" while
  // the client read the cookie, which is the #418 text mismatch. Forcing is safe there
  // because a server render happens once and never re-renders. On the client the flag is
  // still wrong (b56c0328): it re-runs store.set on EVERY render, and once a consumer has
  // mounted that writes during render.
  // The cookie the server rendered from leaves out the fields kept in
  // localStorage; seeding without them would wipe them on the next save.
  const seed = environmentManager.isServer()
    ? (props.data ?? INITIAL_CHAT_STATE)
    : {
        ...(props.data ?? INITIAL_CHAT_STATE),
        ...chatStoreStorage.readLocal(CHAT_STORE_KEY),
      };
  useHydrateAtoms([[chatStoreAtom, seed]], {
    dangerouslyForceHydrate: environmentManager.isServer(),
  });

  return <>{props.children}</>;
}
