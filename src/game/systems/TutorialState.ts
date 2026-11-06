import { SaveManager } from './SaveManager';
const KEY = 'number-break:first-visit-tutorial:v1';
let seenInTab = false;
export function hasSeenTutorial(): boolean {
  if (seenInTab || SaveManager.load().tutorialComplete === true) return true;
  try { if (localStorage.getItem(KEY) === 'done') return true; } catch {}
  try { return sessionStorage.getItem(KEY) === 'done'; } catch { return false; }
}
export function markTutorialSeen(): void {
  seenInTab = true;
  try { localStorage.setItem(KEY, 'done'); return; } catch {}
  try { sessionStorage.setItem(KEY, 'done'); } catch {}
}
export function initialScene(): 'MenuScene' | 'TutorialScene' {
  return hasSeenTutorial() ? 'MenuScene' : 'TutorialScene';
}
