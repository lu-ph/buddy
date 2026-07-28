import { exec } from "node:child_process";

type Position = [x: number, y: number];
type Size = [width: number, height: number];

export function openBrowser(url: string, position: Position, size: Size) {
  const [x, y] = position;
  const [width, height] = size;

  const flags = `--app="${url}" --window-position=${x},${y} --window-size=${width},${height}`;

  const cmd =
    process.platform === "win32"
      ? `start chrome ${flags} || start msedge ${flags}`
      : `open -n -a "Google Chrome" --args ${flags}`;

  exec(cmd);
}
