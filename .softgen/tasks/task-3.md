---
title: Rezervační formulář a logika
status: todo
priority: high
type: feature
tags: [frontend, logic]
created_by: agent
created_at: 2026-05-29T12:23:26Z
position: 3
---

## Notes
Chytrý rezervační formulář implementující logiku přiřazování míst podle počtu rybářů (1/2/3). Formulář navrhuje optimální dostupná místa.

## Checklist
- [ ] Vytvořit ReservationForm komponentu s výběrem počtu rybářů a data
- [ ] Implementovat logiku pro 1 rybáře (nabídka míst s volnou pozicí)
- [ ] Implementovat logiku pro 2 rybáře (priorita celých volných míst)
- [ ] Implementovat logiku pro 3 rybáře (hledání sousedních míst)
- [ ] Zobrazit dostupné varianty s vizualizací na mapě
- [ ] Odeslat rezervaci do Supabase

## Acceptance
- Formulář správně vypočítává dostupná místa pro všechny scénáře
- Uživatel vidí doporučené varianty s vysvětlením
- Rezervace se úspěšně ukládá do databáze