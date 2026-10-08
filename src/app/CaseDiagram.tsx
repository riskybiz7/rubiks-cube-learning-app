import type { Color, Cube } from '../cube/types';
import { topView } from '../render/caseDiagram';
import { cssColor } from '../render/colors';

const CELL = 20; // one square of the top face
const BAR = 6; // how deep a side strip is drawn
const SIZE = BAR * 2 + CELL * 3;

/**
 * A flat picture of the top layer seen from above (back at the top), as on OLL and PLL
 * charts. OLL style colors only the yellow squares, since that's all OLL looks at; PLL
 * style shows every color, since the side colors tell the cases apart.
 */
export function CaseDiagram({
  cube,
  style,
  label,
}: {
  cube: Cube;
  style: 'oll' | 'pll';
  label: string;
}) {
  const view = topView(cube);
  const fill = (color: Color) =>
    style === 'oll' && color !== 'Y' ? cssColor(null) : cssColor(color);
  const square = (key: string, x: number, y: number, w: number, h: number, color: Color) => (
    <rect
      key={key}
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill(color)}
      stroke="#111"
      strokeWidth={1}
    />
  );
  return (
    <svg className="case-diagram" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      {view.top.map((c, i) =>
        square(`t${i}`, BAR + (i % 3) * CELL, BAR + Math.floor(i / 3) * CELL, CELL, CELL, c),
      )}
      {view.back.map((c, i) => square(`b${i}`, BAR + i * CELL, 0, CELL, BAR, c))}
      {view.front.map((c, i) => square(`f${i}`, BAR + i * CELL, BAR + 3 * CELL, CELL, BAR, c))}
      {view.left.map((c, i) => square(`l${i}`, 0, BAR + i * CELL, BAR, CELL, c))}
      {view.right.map((c, i) => square(`r${i}`, BAR + 3 * CELL, BAR + i * CELL, BAR, CELL, c))}
    </svg>
  );
}
