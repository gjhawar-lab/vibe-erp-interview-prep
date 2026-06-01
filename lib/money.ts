/** Format a decimal string for USD display (commas + 2 decimal places). */
export function formatUsd(amount: string | number): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Sum money amounts without JavaScript float error.
 * Converts each amount to integer cents, adds, then converts back to "1234.56".
 * Avoids: 0.1 + 0.2 === 0.30000000000000004
 */
export function sumDecimalStrings(amounts: string[]): string {
  const totalCents = amounts.reduce((sum, a) => {
    const [whole, frac = ""] = a.split(".");
    const cents =
      parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, "0").slice(0, 2), 10);
    return sum + cents;
  }, 0);
  const whole = Math.floor(Math.abs(totalCents) / 100);
  const frac = String(Math.abs(totalCents) % 100).padStart(2, "0");
  return `${totalCents < 0 ? "-" : ""}${whole}.${frac}`;
}
