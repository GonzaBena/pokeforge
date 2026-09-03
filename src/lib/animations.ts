import anime from "animejs";
import { playCoinSound, playStampSound } from "./sound";

export function staggerCardsIn(targets: Element[] | NodeListOf<Element>): void {
  anime.set(targets, { opacity: 0, translateY: 16, scale: 0.96 });
  anime({
    targets: Array.from(targets),
    opacity: [0, 1],
    translateY: [16, 0],
    scale: [0.96, 1],
    duration: 420,
    delay: anime.stagger(40),
    easing: "easeOutQuad",
  });
}

export function cardHoverTilt(gridEl: HTMLElement): void {
  if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }
  const MAX_DEG = 10;

  gridEl.addEventListener("mousemove", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".pokemon-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    anime({
      targets: card,
      rotateY: px * MAX_DEG * 2,
      rotateX: -py * MAX_DEG * 2,
      scale: 1.04,
      duration: 150,
      easing: "easeOutQuad",
    });
  });

  gridEl.addEventListener("mouseout", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".pokemon-card");
    const toEl = e.relatedTarget as HTMLElement | null;
    if (!card || (toEl && card.contains(toEl))) return;
    anime({ targets: card, rotateX: 0, rotateY: 0, scale: 1, duration: 300, easing: "easeOutElastic(1, .6)" });
  });
}

/**
 * "Coin flip" capture reveal: the sprite rises while squashing horizontally
 * (a 2D scaleX flip — avoids the tearing/half-frame artifacts real 3D
 * rotateY flips cause on <img> elements), swaps silhouette->color exactly
 * at the zero-width crossing (hidden by the squash), then falls back into
 * place with a bounce. Resolves once the mini pokeball badge pops in.
 */
export function animateCaptureReveal(cardEl: HTMLElement): Promise<void> {
  const sprite = cardEl.querySelector<HTMLElement>(".pokemon-card__sprite-wrap");
  const badge = cardEl.querySelector<HTMLElement>(".captured-badge");
  if (!sprite) return Promise.resolve();

  const riseDuration = 320;
  const fallDuration = 480;

  playCoinSound();

  return new Promise((resolve) => {
    anime
      .timeline({ easing: "linear" })
      .add({
        targets: sprite,
        translateY: [0, -28],
        scaleX: [1, 0],
        duration: riseDuration,
        easing: "easeInQuad",
        complete: () => cardEl.classList.add("captured"),
      })
      .add({
        targets: sprite,
        translateY: [-28, 0],
        scaleX: [0, 1],
        duration: fallDuration,
        easing: "easeOutBounce",
        complete: () => {
          if (badge) {
            playStampSound();
            anime.set(badge, { opacity: 0, scale: 0 });
            anime({
              targets: badge,
              opacity: [0, 1],
              scale: [0, 1.2, 1],
              duration: 420,
              easing: "easeOutElastic(1, .5)",
            });
          }
          resolve();
        },
      });
  });
}

/**
 * Live capture-from-the-modal reveal: the medal does the same rise + scaleX
 * flip + bounce used by animateCaptureReveal (kept visually consistent with
 * the card animation), then — with a short delay so it reads as a second
 * beat, not simultaneous — the "CAPTURED" stamp pops in from oversized/
 * transparent to its resting size, overlapping the medal's lower half (the
 * overlap itself is positioning, handled in CSS).
 */
export function animateMedalReveal(medalEl: HTMLElement, stampEl: HTMLElement): Promise<void> {
  const riseDuration = 320;
  const fallDuration = 420;

  playCoinSound();

  return new Promise((resolve) => {
    anime.set(medalEl, { translateY: 0, scaleX: 1, opacity: 1 });
    anime.set(stampEl, { opacity: 0, scale: 1.5 });

    anime
      .timeline({ easing: "linear" })
      .add({
        targets: medalEl,
        translateY: [0, -14],
        scaleX: [1, 0],
        duration: riseDuration,
        easing: "easeInQuad",
      })
      .add({
        targets: medalEl,
        translateY: [-14, 0],
        scaleX: [0, 1],
        duration: fallDuration,
        easing: "easeOutBounce",
        complete: () => {
          setTimeout(() => {
            playStampSound();
          }, 120);

          anime({
            targets: stampEl,
            opacity: [0, 1],
            scale: [1.5, 1],
            duration: 420,
            delay: 150,
            easing: "easeOutElastic(1, .6)",
            complete: () => resolve(),
          });
        },
      });
  });
}

export function slotPopIn(slotEl: HTMLElement): void {
  anime.set(slotEl, { opacity: 0, scale: 0.7 });
  anime({
    targets: slotEl,
    opacity: [0, 1],
    scale: [0.7, 1],
    duration: 380,
    easing: "easeOutElastic(1, .6)",
  });
}

export function teamSizeTransition(opts: {
  removed?: HTMLElement[];
  added?: HTMLElement[];
  onRemoved?: () => void;
}): void {
  const { removed = [], added = [], onRemoved } = opts;

  if (removed.length) {
    anime({
      targets: removed,
      scale: 0,
      opacity: 0,
      duration: 260,
      easing: "easeInQuad",
      complete: onRemoved,
    });
  }

  if (added.length) {
    anime.set(added, { opacity: 0, scale: 0.85 });
    anime({
      targets: added,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 340,
      delay: anime.stagger(60),
      easing: "easeOutQuad",
    });
  }
}

export function badgeBounceIn(badgeEls: Element[] | NodeListOf<Element>): void {
  anime.set(badgeEls, { opacity: 0, scale: 0 });
  anime({
    targets: Array.from(badgeEls),
    opacity: [0, 1],
    scale: [0, 1],
    duration: 480,
    delay: anime.stagger(60),
    easing: "easeOutElastic(1, .6)",
  });
}

export function barsAnimateIn(barEls: HTMLElement[] | NodeListOf<HTMLElement>): void {
  const targets = Array.from(barEls);
  anime.set(targets, { width: "0%" });
  anime({
    targets,
    width: (el: Element) => (el as HTMLElement).dataset.targetWidth ?? "0%",
    duration: 620,
    delay: anime.stagger(30),
    easing: "easeOutExpo",
  });
}

export function modalIn(overlayEl: HTMLElement, panelEl: HTMLElement): void {
  anime.set(overlayEl, { opacity: 0 });
  anime.set(panelEl, { opacity: 0, scale: 0.92, translateY: 16 });
  anime({ targets: overlayEl, opacity: 1, duration: 200, easing: "easeOutQuad" });
  anime({ targets: panelEl, opacity: 1, scale: 1, translateY: 0, duration: 320, easing: "easeOutQuad" });
}

export function modalOut(overlayEl: HTMLElement, panelEl: HTMLElement): Promise<void> {
  anime({ targets: overlayEl, opacity: 0, duration: 180, easing: "easeInQuad" });
  return anime({ targets: panelEl, opacity: 0, scale: 0.94, translateY: 10, duration: 200, easing: "easeInQuad" })
    .finished as unknown as Promise<void>;
}

export function sectionSwap(el: HTMLElement): void {
  anime({
    targets: el,
    translateY: [-6, 0],
    opacity: [0.4, 1],
    duration: 240,
    easing: "easeOutQuad",
  });
}

export function toastSlideIn(el: HTMLElement): Promise<void> {
  anime.set(el, { opacity: 0, translateX: 40 });
  return anime({ targets: el, opacity: 1, translateX: 0, duration: 320, easing: "easeOutQuad" })
    .finished as unknown as Promise<void>;
}

export function toastSlideOut(el: HTMLElement): Promise<void> {
  return anime({ targets: el, opacity: 0, translateX: 40, duration: 220, easing: "easeInQuad" })
    .finished as unknown as Promise<void>;
}

export function toastReflow(entries: { el: HTMLElement; deltaY: number }[]): void {
  for (const { el, deltaY } of entries) {
    anime.set(el, { translateY: deltaY });
    anime({ targets: el, translateY: 0, duration: 260, easing: "easeOutQuad" });
  }
}
