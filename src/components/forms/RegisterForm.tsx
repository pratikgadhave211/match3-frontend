import { useState } from "react";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white"
      />
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white"
      />
      <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold">
        Register
      </button>
    </form>
  );
}
