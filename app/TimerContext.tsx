"use client";
import React, { createContext, useContext, ReactNode, useState } from "react";
import { Tracker } from "./types";

type TimerContextProps = {
  children: ReactNode;
};

type TimerContextType = {
  runningTrackers: Tracker[];
  setRunningTrackers: React.Dispatch<React.SetStateAction<Tracker[]>>;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<TimerContextProps> = ({ children }) => {
  const [runningTrackers, setRunningTrackers] = useState<Tracker[]>([]);

  return (
    <TimerContext.Provider value={{ runningTrackers, setRunningTrackers }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
