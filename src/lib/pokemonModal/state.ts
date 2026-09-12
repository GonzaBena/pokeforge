import type { DataTableHandle } from '../dataTable'
import type { RenderContext } from './types'

interface ModalState {
  currentId: number | null
  currentSlotIndex: number | null
  lastContext: RenderContext | null
  showHexagonChart: boolean
  moveTableHandle: DataTableHandle | null
}

export const modalState: ModalState = {
  currentId: null,
  currentSlotIndex: null,
  lastContext: null,
  showHexagonChart: false,
  moveTableHandle: null,
}
