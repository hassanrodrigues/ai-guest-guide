interface QuickInfoCardsProps {
  checkInTime: string;
  checkOutTime: string;
  bedroomQuantity: number;
  bathroomQuantity: number;
  guestCapacity: number;
}

/** "15:00" -> "15h", "12:30" -> "12h30". */
function formatTime(time: string): string {
  const [hour, minute] = time.split(":");
  return minute && minute !== "00" ? `${hour}h${minute}` : `${hour}h`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function QuickInfoCards({
  checkInTime,
  checkOutTime,
  bedroomQuantity,
  bathroomQuantity,
  guestCapacity,
}: QuickInfoCardsProps) {
  const times = [
    { label: "Check-in a partir das", value: formatTime(checkInTime) },
    { label: "Check-out até as", value: formatTime(checkOutTime) },
  ];

  return (
    <section className="flex flex-wrap items-end gap-x-12 gap-y-6">
      <dl className="flex gap-10 sm:gap-12">
        {times.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-rio-foreground/70">{label}</dt>
            <dd className="mt-1 text-5xl font-semibold tracking-tight tabular-nums font-stretch-expanded text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="pb-1 text-rio-foreground/80">
        {plural(bedroomQuantity, "quarto", "quartos")},{" "}
        {plural(bathroomQuantity, "banheiro", "banheiros")}, até{" "}
        {plural(guestCapacity, "hóspede", "hóspedes")}
      </p>
    </section>
  );
}
