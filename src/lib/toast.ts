import { toastSlideIn, toastSlideOut, toastReflow } from "./animations";
import { refreshIcons } from "./icons";

export type ToastVariant = "success" | "error" | "info";

interface ToastOptions {
  duration?: number;
}

const DEFAULT_DURATION = 3200;
const CONTAINER_ID = "toast-container";

function getContainer(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.className = "toast-container";
    document.body.appendChild(el);
  }
  return el;
}

function iconFor(variant: ToastVariant): string {
  if (variant === "success") return "circle-check";
  if (variant === "error") return "circle-x";
  return "info";
}

async function dismiss(el: HTMLElement): Promise<void> {
  const container = el.parentElement;
  if (!container) return;

  const siblings = [...container.children].filter((c) => c !== el) as HTMLElement[];
  const before = siblings.map((s) => s.getBoundingClientRect().top);

  // Races the exit animation against a hard timeout so a toast always gets
  // removed even if anime.js's finished promise never settles (e.g. a
  // backgrounded/throttled tab pausing requestAnimationFrame).
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 500));
  await Promise.race([toastSlideOut(el), timeout]);
  el.remove();

  const after = siblings.map((s) => s.getBoundingClientRect().top);
  toastReflow(siblings.map((el, i) => ({ el, deltaY: before[i] - after[i] })));
}

function show(variant: ToastVariant, message: string, options: ToastOptions = {}): void {
  const container = getContainer();
  const el = document.createElement("div");
  el.className = `toast toast--${variant}`;
  el.innerHTML = `
    <i data-lucide="${iconFor(variant)}" class="toast__icon" aria-hidden="true"></i>
    <span class="toast__message"></span>
  `;
  el.querySelector(".toast__message")!.textContent = message;
  el.addEventListener("click", () => dismiss(el));

  container.appendChild(el);
  refreshIcons();
  toastSlideIn(el);

  window.setTimeout(() => dismiss(el), options.duration ?? DEFAULT_DURATION);
}

export const toast = {
  success: (message: string, options?: ToastOptions) => show("success", message, options),
  error: (message: string, options?: ToastOptions) => show("error", message, options),
  info: (message: string, options?: ToastOptions) => show("info", message, options),
};
