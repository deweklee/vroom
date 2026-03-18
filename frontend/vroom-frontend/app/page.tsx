import Image from "next/image";
import HeroCTA from "@/components/HeroCTA";

const features = [
  {
    icon: "⛽",
    title: "Fuel Tracking",
    description:
      "Log every fill-up and monitor your cost per gallon and fuel economy over time.",
  },
  {
    icon: "🔧",
    title: "Maintenance Records",
    description:
      "Never forget an oil change. Keep a full service history for every vehicle you own.",
  },
  {
    icon: "🏎️",
    title: "Modifications",
    description:
      "Document every upgrade from suspension to audio with costs and install dates.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "Visualize spending trends and get insights across your entire garage.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-6 text-center">
        <Image
          src="/vroom-logo-2.png"
          alt="Vroom"
          width={96}
          height={96}
          className="mb-6"
        />
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Own your drive.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-500">
          Vroom is your personal vehicle logbook. Track fuel, maintenance, and
          mods for every car in your garage.
        </p>
        <div className="mt-8">
          <HeroCTA />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-24 mt-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
