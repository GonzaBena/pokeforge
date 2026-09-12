import { setTeamSlotItem, swapTeamSlotMoves, swapTeamSlots } from "../storage";
import { toast } from "../toast";
import type { DraggedItemState, DraggedMoveState, TouchDragItemState, TouchDragMoveState, TouchDragSlotState, TeamContext } from "./types";

export function setupDragAndDrop(slotsEl: HTMLElement, context: TeamContext): () => void {
  let draggedItem: DraggedItemState | null = null;
  let draggedMove: DraggedMoveState | null = null;
  let draggedSlot: number | null = null;

  let touchDragState: TouchDragMoveState | null = null;
  let touchItemDragState: TouchDragItemState | null = null;
  let touchSlotDragState: TouchDragSlotState | null = null;

  function setItemDragJustEnded() {
    slotsEl.dataset.itemDragJustEnded = "true";
    setTimeout(() => {
      delete slotsEl.dataset.itemDragJustEnded;
    }, 100);
  }

  // --- HTML5 Desktop Drag & Drop ---

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;

    // 1. Item pill dragstart
    const itemPill = target.closest<HTMLElement>(".team-slot__item-pill[draggable='true']");
    if (itemPill) {
      const sIdx = Number(itemPill.dataset.slotIndex);
      const slot = context.getTeam().slots[sIdx];
      if (slot && slot.item) {
        draggedItem = { slotIndex: sIdx, itemId: slot.item, droppedOnSlot: false };
        draggedMove = null;
        draggedSlot = null;

        if (e.dataTransfer) {
          e.dataTransfer.setData("text/plain", `item:${sIdx}:${slot.item}`);
          e.dataTransfer.effectAllowed = "move";
        }

        requestAnimationFrame(() => {
          itemPill.classList.add("is-dragging");
        });
        return;
      }
    }

    // 2. Move dragstart
    const moveCard = target.closest<HTMLElement>(".move-slot-card[draggable='true']");
    if (moveCard) {
      if (target.closest("[data-clear-move]")) {
        e.preventDefault();
        return;
      }
      const sIdx = Number(moveCard.dataset.slotIndex);
      const mIdx = Number(moveCard.dataset.moveIndex);
      draggedMove = { slotIndex: sIdx, moveIndex: mIdx };
      draggedSlot = null;
      draggedItem = null;

      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", `move:${sIdx}:${mIdx}`);
        e.dataTransfer.effectAllowed = "move";
      }

      requestAnimationFrame(() => {
        moveCard.classList.add("is-dragging");
      });
      return;
    }

    // 3. Pokemon slot column dragstart
    const slotCol = target.closest<HTMLElement>(".team-slot-column[draggable='true']");
    if (slotCol) {
      if (
        target.closest("[data-remove-slot]") ||
        target.closest("[data-move-slot]") ||
        target.closest(".team-slot-moves") ||
        target.closest(".team-slot__item-pill") ||
        target.closest(".team-slot__item-btn")
      ) {
        e.preventDefault();
        return;
      }

      const sIdx = Number(slotCol.dataset.slotColumn);
      draggedSlot = sIdx;
      draggedMove = null;
      draggedItem = null;

      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", `slot:${sIdx}`);
        e.dataTransfer.effectAllowed = "move";
      }

      requestAnimationFrame(() => {
        slotCol.classList.add("is-slot-dragging");
      });
    }
  };

  const handleDragEnd = () => {
    slotsEl.querySelectorAll<HTMLElement>("[data-move-slot]").forEach((el) => {
      el.classList.remove("is-dragging", "is-dragover");
    });
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column]").forEach((el) => {
      el.classList.remove("is-slot-dragging", "is-slot-dragover", "is-item-dragover");
    });
    slotsEl.querySelectorAll<HTMLElement>(".team-slot__item-pill").forEach((el) => {
      el.classList.remove("is-dragging");
    });

    if (draggedItem && !draggedItem.droppedOnSlot) {
      const sIdx = draggedItem.slotIndex;
      const nextTeam = setTeamSlotItem(sIdx, null);
      context.setTeam(nextTeam);
      context.renderSingleSlot(sIdx);
      context.renderStrengthsPanel();
      context.renderTypeMatrix();
      const locale = context.getLocale();
      toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
      setItemDragJustEnded();
    }

    draggedItem = null;
    draggedMove = null;
    draggedSlot = null;
  };

  const handleDragOver = (e: DragEvent) => {
    const target = e.target as HTMLElement;

    if (draggedItem) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
        if (el !== targetCol) el.classList.remove("is-item-dragover");
      });
      if (targetCol) {
        targetCol.classList.add("is-item-dragover");
      }
      return;
    }

    if (draggedMove) {
      const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
      if (!targetSlot) return;

      const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
      if (targetSlotIdx !== draggedMove.slotIndex) return;

      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        if (el !== targetSlot) el.classList.remove("is-dragover");
      });
      targetSlot.classList.add("is-dragover");
      return;
    }

    if (draggedSlot !== null) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      if (!targetCol) return;

      const targetSlotIdx = Number(targetCol.dataset.slotColumn);
      if (targetSlotIdx === draggedSlot) return;

      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
        if (el !== targetCol) el.classList.remove("is-slot-dragover");
      });
      targetCol.classList.add("is-slot-dragover");
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (draggedItem) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!targetCol?.contains(related)) {
        targetCol?.classList.remove("is-item-dragover");
      }
    } else if (draggedMove) {
      const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
      targetSlot?.classList.remove("is-dragover");
    } else if (draggedSlot !== null) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!targetCol?.contains(related)) {
        targetCol?.classList.remove("is-slot-dragover");
      }
    }
  };

  const handleDrop = (e: DragEvent) => {
    const target = e.target as HTMLElement;

    if (draggedItem) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
        el.classList.remove("is-item-dragover");
      });

      if (targetCol) {
        const targetSlotIdx = Number(targetCol.dataset.slotColumn);
        draggedItem.droppedOnSlot = true;

        if (targetSlotIdx !== draggedItem.slotIndex) {
          e.preventDefault();
          const targetSlot = context.getTeam().slots[targetSlotIdx];
          if (targetSlot && targetSlot.pokemonId !== null) {
            const targetPrevItem = targetSlot.item ?? null;
            let nextTeam = setTeamSlotItem(targetSlotIdx, draggedItem.itemId);
            nextTeam = setTeamSlotItem(draggedItem.slotIndex, targetPrevItem);
            context.setTeam(nextTeam);
            context.renderSingleSlot(draggedItem.slotIndex);
            context.renderSingleSlot(targetSlotIdx);
            context.renderStrengthsPanel();
            context.renderTypeMatrix();
          }
        }
      } else {
        e.preventDefault();
        draggedItem.droppedOnSlot = false;
        const sIdx = draggedItem.slotIndex;
        const nextTeam = setTeamSlotItem(sIdx, null);
        context.setTeam(nextTeam);
        context.renderSingleSlot(sIdx);
        context.renderStrengthsPanel();
        context.renderTypeMatrix();
        const locale = context.getLocale();
        toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
      }

      const itemPill = slotsEl.querySelector<HTMLElement>(`[data-item-pill][data-slot-index="${draggedItem.slotIndex}"]`);
      itemPill?.classList.remove("is-dragging");
      setItemDragJustEnded();
      draggedItem = null;
      return;
    }

    if (draggedMove) {
      const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
      if (!targetSlot) return;

      const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
      const targetMoveIdx = Number(targetSlot.dataset.moveIndex);

      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        el.classList.remove("is-dragover");
      });

      if (targetSlotIdx === draggedMove.slotIndex && targetMoveIdx !== draggedMove.moveIndex) {
        e.preventDefault();
        const nextTeam = swapTeamSlotMoves(targetSlotIdx, draggedMove.moveIndex, targetMoveIdx);
        context.setTeam(nextTeam);
        context.renderSingleSlot(targetSlotIdx);
        context.renderStrengthsPanel();
      }

      draggedMove = null;
      return;
    }

    if (draggedSlot !== null) {
      const targetCol = target.closest<HTMLElement>("[data-slot-column]");
      if (!targetCol) return;

      const targetSlotIdx = Number(targetCol.dataset.slotColumn);

      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
        el.classList.remove("is-slot-dragover");
      });

      if (targetSlotIdx !== draggedSlot) {
        e.preventDefault();
        const nextTeam = swapTeamSlots(draggedSlot, targetSlotIdx);
        context.setTeam(nextTeam);
        context.renderAllSlots();
        context.renderStrengthsPanel();
      }

      draggedSlot = null;
    }
  };

  const handleDocumentDragOver = (e: DragEvent) => {
    if (draggedItem) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    }
  };

  const handleDocumentDrop = (e: DragEvent) => {
    if (draggedItem) {
      const target = e.target as HTMLElement;
      if (!slotsEl.contains(target)) {
        e.preventDefault();
        const sIdx = draggedItem.slotIndex;
        const nextTeam = setTeamSlotItem(sIdx, null);
        context.setTeam(nextTeam);
        context.renderSingleSlot(sIdx);
        context.renderStrengthsPanel();
        context.renderTypeMatrix();
        const locale = context.getLocale();
        toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
        setItemDragJustEnded();
      }
      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
        el.classList.remove("is-item-dragover");
      });
      const pill = slotsEl.querySelector<HTMLElement>(`[data-item-pill][data-slot-index="${draggedItem.slotIndex}"]`);
      pill?.classList.remove("is-dragging");
      draggedItem = null;
    }
  };

  // --- Mobile Touch Drag & Drop ---

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;

    // 1. Item pill drag handle
    const itemPill = target.closest<HTMLElement>(".team-slot__item-pill[draggable='true']");
    if (itemPill) {
      const sIdx = Number(itemPill.dataset.slotIndex);
      const slot = context.getTeam().slots[sIdx];
      if (slot && slot.item) {
        const touch = e.touches[0];
        touchItemDragState = {
          slotIndex: sIdx,
          itemId: slot.item,
          pillEl: itemPill,
          startX: touch.clientX,
          startY: touch.clientY,
          isDragging: false,
        };
        return;
      }
    }

    // 2. Move drag handle
    const moveHandle = target.closest<HTMLElement>("[data-drag-handle]");
    if (moveHandle) {
      const card = moveHandle.closest<HTMLElement>(".move-slot-card");
      if (!card) return;

      const sIdx = Number(card.dataset.slotIndex);
      const mIdx = Number(card.dataset.moveIndex);
      touchDragState = { slotIndex: sIdx, moveIndex: mIdx, card };
      card.classList.add("is-dragging");
      return;
    }

    // 3. Whole filled slot card drag
    const filledSlot = target.closest<HTMLElement>(".team-slot.filled");
    if (filledSlot) {
      if (
        target.closest("[data-remove-slot]") ||
        target.closest("[data-move-slot]") ||
        target.closest(".team-slot-moves") ||
        target.closest(".team-slot__item-pill") ||
        target.closest(".team-slot__item-btn")
      ) {
        return;
      }
      const columnEl = filledSlot.closest<HTMLElement>("[data-slot-column]");
      if (!columnEl) return;

      const sIdx = Number(filledSlot.dataset.slotIndex);
      const touch = e.touches[0];
      touchSlotDragState = {
        slotIndex: sIdx,
        columnEl,
        startX: touch.clientX,
        startY: touch.clientY,
        isDragging: false,
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchItemDragState) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchItemDragState.startX;
      const dy = touch.clientY - touchItemDragState.startY;

      if (!touchItemDragState.isDragging) {
        if (Math.hypot(dx, dy) > 8) {
          touchItemDragState.isDragging = true;
          touchItemDragState.pillEl.classList.add("is-dragging");
        }
      }

      if (touchItemDragState.isDragging) {
        if (e.cancelable) e.preventDefault();
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

        slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
          if (el !== targetCol) el.classList.remove("is-item-dragover");
        });

        if (targetCol) {
          targetCol.classList.add("is-item-dragover");
        }
      }
      return;
    }

    if (touchDragState) {
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSlot = targetEl?.closest<HTMLElement>("[data-move-slot]");

      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        if (el !== targetSlot) el.classList.remove("is-dragover");
      });

      if (targetSlot) {
        const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
        if (targetSlotIdx === touchDragState.slotIndex) {
          targetSlot.classList.add("is-dragover");
          if (e.cancelable) e.preventDefault();
        }
      }
      return;
    }

    if (touchSlotDragState) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchSlotDragState.startX;
      const dy = touch.clientY - touchSlotDragState.startY;

      if (!touchSlotDragState.isDragging) {
        if (Math.hypot(dx, dy) > 10) {
          touchSlotDragState.isDragging = true;
          touchSlotDragState.columnEl.classList.add("is-slot-dragging");
        }
      }

      if (touchSlotDragState.isDragging) {
        if (e.cancelable) e.preventDefault();
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

        slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
          if (el !== targetCol) el.classList.remove("is-slot-dragover");
        });

        if (targetCol) {
          const targetSlotIdx = Number(targetCol.dataset.slotColumn);
          if (targetSlotIdx !== touchSlotDragState.slotIndex) {
            targetCol.classList.add("is-slot-dragover");
          }
        }
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchItemDragState) {
      touchItemDragState.pillEl.classList.remove("is-dragging");
      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
        el.classList.remove("is-item-dragover");
      });

      if (touchItemDragState.isDragging) {
        setItemDragJustEnded();

        const touch = e.changedTouches[0];
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

        if (targetCol) {
          const targetSlotIdx = Number(targetCol.dataset.slotColumn);
          if (targetSlotIdx !== touchItemDragState.slotIndex) {
            const targetSlot = context.getTeam().slots[targetSlotIdx];
            if (targetSlot && targetSlot.pokemonId !== null) {
              const targetPrevItem = targetSlot.item ?? null;
              let nextTeam = setTeamSlotItem(targetSlotIdx, touchItemDragState.itemId);
              nextTeam = setTeamSlotItem(touchItemDragState.slotIndex, targetPrevItem);
              context.setTeam(nextTeam);
              context.renderSingleSlot(touchItemDragState.slotIndex);
              context.renderSingleSlot(targetSlotIdx);
              context.renderStrengthsPanel();
              context.renderTypeMatrix();
            }
          }
        } else {
          // Dragged outside -> remove item!
          const nextTeam = setTeamSlotItem(touchItemDragState.slotIndex, null);
          context.setTeam(nextTeam);
          context.renderSingleSlot(touchItemDragState.slotIndex);
          context.renderStrengthsPanel();
          context.renderTypeMatrix();
          const locale = context.getLocale();
          toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
        }
      }

      touchItemDragState = null;
      return;
    }

    if (touchDragState) {
      touchDragState.card.classList.remove("is-dragging");

      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSlot = targetEl?.closest<HTMLElement>("[data-move-slot]");

      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        el.classList.remove("is-dragover");
      });

      if (targetSlot) {
        const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
        const targetMoveIdx = Number(targetSlot.dataset.moveIndex);
        if (targetSlotIdx === touchDragState.slotIndex && targetMoveIdx !== touchDragState.moveIndex) {
          const nextTeam = swapTeamSlotMoves(targetSlotIdx, touchDragState.moveIndex, targetMoveIdx);
          context.setTeam(nextTeam);
          context.renderSingleSlot(targetSlotIdx);
          context.renderStrengthsPanel();
        }
      }

      touchDragState = null;
      return;
    }

    if (touchSlotDragState) {
      touchSlotDragState.columnEl.classList.remove("is-slot-dragging");

      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
        el.classList.remove("is-slot-dragover");
      });

      if (touchSlotDragState.isDragging && targetCol) {
        const targetSlotIdx = Number(targetCol.dataset.slotColumn);
        if (targetSlotIdx !== touchSlotDragState.slotIndex) {
          const nextTeam = swapTeamSlots(touchSlotDragState.slotIndex, targetSlotIdx);
          context.setTeam(nextTeam);
          context.renderAllSlots();
          context.renderStrengthsPanel();
        }
      }

      touchSlotDragState = null;
    }
  };

  const handleTouchCancel = () => {
    if (touchItemDragState) {
      touchItemDragState.pillEl.classList.remove("is-dragging");
      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
        el.classList.remove("is-item-dragover");
      });
      touchItemDragState = null;
    }

    if (touchDragState) {
      touchDragState.card.classList.remove("is-dragging");
      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        el.classList.remove("is-dragover");
      });
      touchDragState = null;
    }

    if (touchSlotDragState) {
      touchSlotDragState.columnEl.classList.remove("is-slot-dragging");
      slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
        el.classList.remove("is-slot-dragover");
      });
      touchSlotDragState = null;
    }
  };

  slotsEl.addEventListener("dragstart", handleDragStart);
  slotsEl.addEventListener("dragend", handleDragEnd);
  slotsEl.addEventListener("dragover", handleDragOver);
  slotsEl.addEventListener("dragleave", handleDragLeave);
  slotsEl.addEventListener("drop", handleDrop);

  document.addEventListener("dragover", handleDocumentDragOver);
  document.addEventListener("drop", handleDocumentDrop);

  slotsEl.addEventListener("touchstart", handleTouchStart, { passive: true });
  slotsEl.addEventListener("touchmove", handleTouchMove, { passive: false });
  slotsEl.addEventListener("touchend", handleTouchEnd);
  slotsEl.addEventListener("touchcancel", handleTouchCancel);

  return () => {
    slotsEl.removeEventListener("dragstart", handleDragStart);
    slotsEl.removeEventListener("dragend", handleDragEnd);
    slotsEl.removeEventListener("dragover", handleDragOver);
    slotsEl.removeEventListener("dragleave", handleDragLeave);
    slotsEl.removeEventListener("drop", handleDrop);

    document.removeEventListener("dragover", handleDocumentDragOver);
    document.removeEventListener("drop", handleDocumentDrop);

    slotsEl.removeEventListener("touchstart", handleTouchStart);
    slotsEl.removeEventListener("touchmove", handleTouchMove);
    slotsEl.removeEventListener("touchend", handleTouchEnd);
    slotsEl.removeEventListener("touchcancel", handleTouchCancel);
  };
}
