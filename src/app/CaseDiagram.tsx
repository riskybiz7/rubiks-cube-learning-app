import type { Color, Cube } from '../cube/types';
import { topView } from '../render/caseDiagram';
import { cssColor } from '../render/colors';

const CELL = 20; // one square of the top face
const BAR = 6; // how deep a side strip is drawn
const SIZE = BAR * 2 + CELL * 3;

/**
 * oll: only the yellow squares are colored, since that's all OLL looks at.
 * oll-edges: the same, but only the edges (the first 2-look step ignores the corners).
 * pll: every color, since the side colors tell the cases apart.
 */
export type DiagramStyle = 'oll' | 'oll-edges' | 'pll';

/** A flat picture of the top layer seen from above (back at the top), as on OLL and PLL charts. */
export function CaseDiagram({
  cube,
  style,
  label,
}: {
  cube: Cube;
  style: DiagramStyle;
  label: string;
}) {
  const view = topView(cube);
  const fill = (color: Color, isCorner: boolean) => {
    if (style === 'pll') return cssColor(color);
    if (style === 'oll-edges' && isCorner) return cssColor(null);
    return color === 'Y' ? cssColor(color) : cssColor(null);
  };
  const square = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    color: Color,
    isCorner: boolean,
  ) => (
    <rect
      key={key}
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill(color, isCorner)}
      stroke="#111"
      strokeWidth={1}
    />
  );
  const topCorner = (i: number) => i === 0 || i === 2 || i === 6 || i === 8;
  const stripCorner = (i: number) => i !== 1; // a strip's two ends belong to corners
  return (
    <svg className="case-diagram" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      {view.top.map((c, i) =>
        square(
          `t${i}`,
          BAR + (i % 3) * CELL,
          BAR + Math.floor(i / 3) * CELL,
          CELL,
          CELL,
          c,
          topCorner(i),
        ),
      )}
      {view.back.map((c, i) => square(`b${i}`, BAR + i * CELL, 0, CELL, BAR, c, stripCorner(i)))}
      {view.front.map((c, i) =>
        square(`f${i}`, BAR + i * CELL, BAR + 3 * CELL, CELL, BAR, c, stripCorner(i)),
      )}
      {view.left.map((c, i) => square(`l${i}`, 0, BAR + i * CELL, BAR, CELL, c, stripCorner(i)))}
      {view.right.map((c, i) =>
        square(`r${i}`, BAR + 3 * CELL, BAR + i * CELL, BAR, CELL, c, stripCorner(i)),
      )}
    </svg>
  );
}
