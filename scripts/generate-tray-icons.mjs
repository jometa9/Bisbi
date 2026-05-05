import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildResources = path.resolve(__dirname, '..', 'build-resources');

const SIZE = 512;

const states = [
  { name: 'idle', source: 'owl_head.svg' },
  { name: 'rec', source: 'owl_head_rec.svg' },
];

const colors = [
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#FFFFFF' },
];

function render(svg, outputName) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: SIZE },
    background: 'rgba(0,0,0,0)',
  });
  const png = resvg.render().asPng();
  const out = path.join(buildResources, outputName);
  fs.writeFileSync(out, png);
  console.log(`Wrote ${out} (${png.length} bytes)`);
}

const STROKE_MULTIPLIER = 6;

function thickenStrokes(svg) {
  return svg.replace(/stroke-width="([\d.]+)"/g, (_, w) => {
    const v = parseFloat(w);
    return `stroke-width="${(v * STROKE_MULTIPLIER).toFixed(4)}"`;
  });
}

for (const state of states) {
  const sourceSvg = fs.readFileSync(path.join(buildResources, state.source), 'utf8');
  for (const color of colors) {
    const svg = thickenStrokes(sourceSvg)
      .replace(/fill="#000000"/g, `fill="${color.hex}"`)
      .replace(/stroke="#000000"/g, `stroke="${color.hex}"`);
    render(svg, `owl_${state.name}_${color.name}.png`);
  }
}
