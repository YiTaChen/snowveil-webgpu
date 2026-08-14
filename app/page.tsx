import type { Metadata } from "next";
import { SnowveilScene } from "./snowveil-scene";

export const metadata: Metadata = {
  title: "Snowveil — Procedural WebGPU Snow",
  description:
    "An original real-time snow-world study built with native WebGPU and hand-written WGSL.",
};

export default function Home() {
  return <SnowveilScene />;
}
