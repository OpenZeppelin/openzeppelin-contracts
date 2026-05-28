import Handlebars, { type HelperOptions } from 'handlebars';

export * from '../../common/helpers';

/**
 * Returns a Markdown heading marker. An optional number increases the heading level.
 *
 *    Input                  Output
 *    {{h}} {{name}}         # Name
 *    {{h 2}} {{name}}       ## Name
 */
export function h(opts: HelperOptions): string;
export function h(hsublevel: number, opts: HelperOptions): string;
export function h(hsublevel: number | HelperOptions, opts?: HelperOptions) {
  const { hlevel } = getHLevel(hsublevel, opts);
  return new Array(hlevel).fill('#').join('');
}

/**
 * Delineates a section where headings should be increased by 1 or a custom number.
 *
 *    {{#hsection}}
 *    {{>partial-with-headings}}
 *    {{/hsection}}
 */
export function hsection(opts: HelperOptions): string;
export function hsection(hsublevel: number, opts: HelperOptions): string;
export function hsection(this: unknown, hsublevel: number | HelperOptions, opts?: HelperOptions) {
  let hlevel;
  ({ hlevel, opts } = getHLevel(hsublevel, opts));
  opts.data = Handlebars.Utils.createFrame(opts.data);
  opts.data.hlevel = hlevel;
  return opts.fn(this as unknown, opts);
}

/**
 * Helper for dealing with the optional hsublevel argument.
 */
function getHLevel(hsublevel: number | HelperOptions, opts?: HelperOptions) {
  if (typeof hsublevel === 'number') {
    opts = opts!;
    hsublevel = Math.max(1, hsublevel);
  } else {
    opts = hsublevel;
    hsublevel = 1;
  }
  const contextHLevel: number = opts.data?.hlevel ?? 0;
  return { opts, hlevel: contextHLevel + hsublevel };
}
