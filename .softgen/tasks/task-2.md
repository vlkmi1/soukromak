---
title: Interaktivní mapa rybníku
status: todo
priority: high
type: feature
tags: [frontend, ui]
created_by: agent
created_at: 2026-05-29T12:23:26Z
position: 2
---

## Notes
Vytvoření hlavní komponenty s interaktivní mapou rybníku zobrazující 13 lovných míst. Každé místo ukazuje obsazenost a lze na něj kliknout pro rezervaci.

## Checklist
- [ ] Vygenerovat obrázek rybníku přes generate_image
- [ ] Vytvořit PondMap komponentu s SVG overlay pro lovná místa
- [ ] Implementovat interaktivní body s tooltip a click handler
- [ ] Vizualizovat stavy míst (volné/částečně obsazené/obsazené)
- [ ] Propojit s rezervační logikou

## Acceptance
- Mapa rybníku je plně interaktivní
- Uživatel vidí okamžitě dostupnost všech míst
- Kliknutí na místo otevře rezervační formulář