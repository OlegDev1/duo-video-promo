import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, TOTAL_SECONDS, WIDTH, toFrames } from "./timeline";
import { Video } from "./Video";

export const Root: React.FC = () => (
  <Composition
    id="DuoPromo"
    component={Video}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={toFrames(TOTAL_SECONDS, FPS)}
  />
);
