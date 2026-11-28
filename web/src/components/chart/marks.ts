import uPlot from "uplot";

/** Ranges of the x axis to shade, in a colour token, such as the moments a signal is high. */
export type ChartMarks = { spans: [number, number][]; color: string };

/** Shades each span across the plot, under the lines, at least 2 px wide so a short one shows. */
function shade(chart: uPlot, spans: [number, number][], color: string) {
  const { ctx, bbox } = chart;
  const right = bbox.left + bbox.width;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  for (const [from, to] of spans) {
    const start = Math.max(chart.valToPos(from, "x", true), bbox.left);
    const end = Math.min(chart.valToPos(to, "x", true), right);
    if (end >= bbox.left && start <= right) {
      ctx.fillRect(start, bbox.top, Math.max(end - start, 2 * devicePixelRatio), bbox.height);
    }
  }
  ctx.restore();
}

/** A dashed line across the plot at `value`, with `label` on the y axis over the tick labels. */
function referenceLine(chart: uPlot, value: number, label: string, style: LineStyle) {
  const { ctx, bbox } = chart;
  const y = Math.round(chart.valToPos(value, "y", true));
  if (y < bbox.top || y > bbox.top + bbox.height) return;
  const pixel = devicePixelRatio;
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = pixel;
  ctx.setLineDash([4 * pixel, 4 * pixel]);
  ctx.beginPath();
  ctx.moveTo(bbox.left, y);
  ctx.lineTo(bbox.left + bbox.width, y);
  ctx.stroke();
  ctx.font = style.font.replace(/^(\d+)px/, (_, size) => `${size * pixel}px`);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(label).width + 8 * pixel;
  ctx.fillStyle = style.background;
  ctx.fillRect(bbox.left - width - 2 * pixel, y - 8 * pixel, width, 16 * pixel);
  ctx.fillStyle = style.color;
  ctx.fillText(label, bbox.left - 6 * pixel, y);
  ctx.restore();
}

type LineStyle = { color: string; background: string; font: string };

/** A y axis set by hand, or one that fits the data and the reference line. */
export function yScale(range?: [number, number], reference?: number): uPlot.Scale {
  if (range) return { range };
  if (reference === undefined) return {};
  return {
    range: (_, min, max) =>
      uPlot.rangeNum(
        Math.min(min ?? reference, reference),
        Math.max(max ?? reference, reference),
        0.1,
        true,
      ),
  };
}

/**
 * Hooks that shade the marks under the lines and draw the reference over them. `read` gives the
 * current ones, so a redraw is enough when they change. `token` turns a colour token into a colour.
 */
export function markHooks(
  read: () => { marks?: ChartMarks; reference?: number },
  token: (name: string) => string,
  font: string,
): Partial<uPlot.Hooks.Arrays> {
  const style = { color: token("muted"), background: token("screen"), font };
  return {
    drawClear: [
      (chart) => {
        const { marks } = read();
        if (marks) shade(chart, marks.spans, token(marks.color));
      },
    ],
    draw: [
      (chart) => {
        const { reference } = read();
        if (reference !== undefined) {
          referenceLine(chart, reference, reference.toLocaleString(), style);
        }
      },
    ],
  };
}
