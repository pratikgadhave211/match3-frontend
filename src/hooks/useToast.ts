import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");

  const show = (nextMessage: string) => setMessage(nextMessage);
  const clear = () => setMessage("");

  return { message, show, clear };
}
