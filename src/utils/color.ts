import Color, { type ColorTypes } from 'colorjs.io';

export function getBackgroundColor(inputColor: ColorTypes) {
  const color = new Color(inputColor).to('oklch');
  color.alpha = 0.2;
  return color.toString({ format: 'hex' });
}

export function getContrastColor(inputColor: ColorTypes) {
  const color = new Color(inputColor);

  const onWhite = Math.abs(color.contrastAPCA('white'));
  const onBlack = Math.abs(color.contrastAPCA('black'));

  if (onWhite >= 25 && onBlack >= 25) {
    return color.toString({ format: 'hex' });
  }

  const target = onBlack < onWhite ? 'white' : 'black';

  let mixRatio = 0.15;
  if (onBlack < 5) mixRatio = 0.5;
  else if (onBlack < 15 || onWhite < 15) mixRatio = 0.25;

  return color.mix(target, mixRatio, { space: 'oklab' }).toString({
    format: 'hex',
  });
}
