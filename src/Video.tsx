import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Grain } from "./components/Background";
import { loadFonts } from "./fonts";
import { useTime } from "./motion";
import { Birth } from "./scenes/Birth";
import { Features } from "./scenes/Features";
import { Hook } from "./scenes/Hook";
import { Numbers } from "./scenes/Numbers";
import { Reveal } from "./scenes/Reveal";
import { timeline, toFrames } from "./timeline";

loadFonts();

const SCENES: Array<{ key: keyof typeof timeline.scenes; Component: React.FC }> = [
  { key: "hook", Component: Hook },
  { key: "birth", Component: Birth },
  { key: "reveal", Component: Reveal },
  { key: "features", Component: Features },
  { key: "numbers", Component: Numbers },
];

export const Video: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useTime();
  return (
    <AbsoluteFill style={{ background: "#05060b" }}>
      {SCENES.map(({ key, Component }) => {
        const { start, end } = timeline.scenes[key];
        return (
          <Sequence key={key} name={key} from={toFrames(start, fps)} durationInFrames={toFrames(end - start, fps)}>
            <Component />
          </Sequence>
        );
      })}
      <Grain t={t} />
    </AbsoluteFill>
  );
};
