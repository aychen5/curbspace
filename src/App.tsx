import { chapters } from "./story/chapters";
import { useScrollSteps } from "./hooks/useScrollSteps";
import { Scrolly } from "./components/scrolly";
import { ConfigGallery } from "./components/config-gallery";
import { PressureBridge } from "./components/pressure-bridge";
import { PressureStory } from "./components/pressure-story";
import { TradeoffBridge } from "./components/tradeoff-bridge";

const chapterStepIds = chapters.map((chapter) => chapter.id);

export default function App() {
  const activeStepId = useScrollSteps(chapterStepIds);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="hero__kicker">Small strip of asphalt. Massive drama.</p>
          <h1>Curb chaos, explained.</h1>
        </div>
        <p className="hero__body">
          See how curb demand turns into congestion and safety risk, flip through design tradeoffs, and zoom out to citywide pressure.
        </p>
      </header>

      <section className="curb-story-flow">
        <Scrolly chapters={chapters} activeStepId={activeStepId} />
      </section>
      <PressureBridge />
      <PressureStory />
      <TradeoffBridge />
      <ConfigGallery />
    </main>
  );
}
