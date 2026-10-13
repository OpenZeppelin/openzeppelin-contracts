/**
 * Iterates over all contiguous matches of the regular expression over the
 * text. Stops as soon as the regular expression no longer matches at the
 * current position.
 */
export function* execAll(re: RegExp, text: string) {
  re = new RegExp(re, re.flags + (re.sticky ? '' : 'y'));

  while (true) {
    const match = re.exec(text);

    // We break out of the loop if there is no match or if the empty string is
    // matched because no progress will be made and it will loop indefinitely.
    if (!match?.[0]) break;

    yield match;
  }
}
