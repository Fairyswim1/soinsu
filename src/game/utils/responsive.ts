export function isPortrait(): boolean {
  return window.matchMedia("(orientation: portrait)").matches;
}

export function requestFullscreen(): void {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    void element.requestFullscreen();
  }
}
