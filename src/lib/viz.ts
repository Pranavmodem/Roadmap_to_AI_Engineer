// Visualizer access layer. Step-scripts live in src/data/visualizers*.js;
// each is an array of frames rendered by one of 12 shared families.
// @ts-ignore untyped data module
import { VIZ as VIZ1 } from "@/data/visualizers";
// @ts-ignore untyped data module
import { VIZ2 } from "@/data/visualizers-2";
// @ts-ignore untyped data module
import { VIZ3 } from "@/data/visualizers-3";

const VIZ = { ...(VIZ1 as object), ...(VIZ2 as object), ...(VIZ3 as object) };

export interface Predict {
  q: string;
  a: string;
  b: string;
  t: boolean; // true → first option is correct
}

/** A frame is family-shaped; msg is universal, the rest is per-family. */
export interface Frame {
  msg: string;
  caption?: string;
  predict?: Predict;
  [key: string]: unknown;
}

export interface LessonViz {
  key: string;
  family: string;
  title: string;
  frames: Frame[];
}

export function vizForKey(key: string | null | undefined): LessonViz | null {
  if (!key) return null;
  const v = (VIZ as Record<string, { family: string; title: string; frames: Frame[] }>)[key];
  if (!v?.frames?.length) return null;
  return { key, family: v.family, title: v.title, frames: v.frames };
}
