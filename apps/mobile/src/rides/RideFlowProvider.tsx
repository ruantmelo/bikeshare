import type { RideWithBicycle } from '@bikeshare/contracts';
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type RideFlowContextValue = {
  startedRide: RideWithBicycle | null;
  endedRide: RideWithBicycle | null;
  setStartedRide: (ride: RideWithBicycle | null) => void;
  setEndedRide: (ride: RideWithBicycle | null) => void;
  clearRideFlow: () => void;
};

const RideFlowContext = createContext<RideFlowContextValue | null>(null);

export function RideFlowProvider({ children }: { children: ReactNode }) {
  const [startedRide, setStartedRide] = useState<RideWithBicycle | null>(null);
  const [endedRide, setEndedRide] = useState<RideWithBicycle | null>(null);

  const clearRideFlow = () => {
    setStartedRide(null);
    setEndedRide(null);
  };

  const value = useMemo(
    () => ({ startedRide, endedRide, setStartedRide, setEndedRide, clearRideFlow }),
    [startedRide, endedRide],
  );

  return <RideFlowContext.Provider value={value}>{children}</RideFlowContext.Provider>;
}

export function useRideFlow() {
  const context = useContext(RideFlowContext);
  if (!context) throw new Error('useRideFlow must be used within RideFlowProvider');
  return context;
}
