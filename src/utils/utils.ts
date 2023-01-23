// Matches '/<re/po>/tree/<ref>/<dir>'
export const URL_PARSER_REGEX = /^[/]([^/]+)[/]([^/]+)[/]tree[/]([^/]+)[/](.*)/;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export function spenderNameToKey(name: string): string {
  return name.split(" ").join("_").trim().toLowerCase();
}

export function escapeFilepath(path: string) {
  return path.replaceAll("#", "%23");
}
