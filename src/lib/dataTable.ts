import { createTable, getCoreRowModel, getSortedRowModel } from "@tanstack/table-core";
import type { ColumnDef, SortingState, TableOptionsResolved } from "@tanstack/table-core";

export function renderDataTable<T>(container: HTMLElement, columns: ColumnDef<T, unknown>[], data: T[], emptyMessage: string): void {
  let sorting: SortingState = [];

  // table-core's features (pinning, visibility, etc.) each expect their own
  // state slice to exist even when unused — createTable alone won't fill
  // those in, so getHeaderGroups() throws reading e.g. columnPinning.left.
  // table.initialState carries every feature's default, so it's merged in
  // via a follow-up setOptions before the first draw (the pattern table-core
  // itself uses internally when wiring up a table outside a framework adapter).
  const options: TableOptionsResolved<T> = {
    data,
    columns,
    state: {},
    onStateChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    renderFallbackValue: null,
  };

  const table = createTable(options);
  table.setOptions((prev) => ({
    ...prev,
    state: { ...table.initialState, sorting },
    onSortingChange: (updater) => {
      sorting = typeof updater === "function" ? updater(sorting) : updater;
      table.setOptions((p) => ({ ...p, state: { ...p.state, sorting } }));
      draw();
    },
  }));

  function draw(): void {
    const rows = table.getRowModel().rows;

    const theadHtml = table
      .getHeaderGroups()
      .map(
        (hg) =>
          `<tr>${hg.headers
            .map((h) => {
              const label = typeof h.column.columnDef.header === "string" ? h.column.columnDef.header : "";
              const sorted = h.column.getIsSorted();
              const arrow = sorted === "asc" ? " ▲" : sorted === "desc" ? " ▼" : "";
              return `<th data-sort-col="${h.column.id}" class="${h.column.getCanSort() ? "sortable" : ""}">${label}${arrow}</th>`;
            })
            .join("")}</tr>`,
      )
      .join("");

    const tbodyHtml = rows.length
      ? rows
          .map(
            (row) =>
              `<tr>${row
                .getVisibleCells()
                .map((cell) => {
                  const def = cell.column.columnDef;
                  const content = typeof def.cell === "function" ? String(def.cell(cell.getContext())) : String(cell.getValue() ?? "");
                  return `<td>${content}</td>`;
                })
                .join("")}</tr>`,
          )
          .join("")
      : `<tr><td class="detail-empty" colspan="${columns.length}">${emptyMessage}</td></tr>`;

    // table-layout:fixed (set in CSS) treats these <col> widths as ratios of
    // the table's own 100% width, not literal pixel targets — good enough to
    // keep narrow columns (e.g. a "Nivel" number) from stealing space from
    // wide text columns without needing per-table CSS overrides.
    const colgroupHtml = `<colgroup>${table
      .getFlatHeaders()
      .map((h) => `<col style="width:${h.column.getSize()}px" />`)
      .join("")}</colgroup>`;

    container.innerHTML = `<div class="data-table-wrap"><table class="data-table">${colgroupHtml}<thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></div>`;

    container.querySelectorAll<HTMLElement>("[data-sort-col]").forEach((th) => {
      if (!th.classList.contains("sortable")) return;
      th.addEventListener("click", () => {
        table.getColumn(th.dataset.sortCol!)?.toggleSorting(undefined, false);
      });
    });
  }

  draw();
}
