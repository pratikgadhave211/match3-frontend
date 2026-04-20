import { useState } from "react";
import type { ContractCallResult } from "../services/contract";
import { invokeContractMethod } from "../services/contract";

export function useContract() {
  const [lastResult, setLastResult] = useState<ContractCallResult | null>(null);

  const callMethod = async (method: string, args: unknown[] = []) => {
    const result = await invokeContractMethod(method, args);
    setLastResult(result);
    return result;
  };

  return { lastResult, callMethod };
}
