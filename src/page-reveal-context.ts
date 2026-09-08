import { createContext } from 'react';

// Entrance animations must wait until both the initial loader and route curtain are gone.
export const PageRevealContext = createContext(true);
