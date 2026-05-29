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
Implementace rezervačního formuláře s chytrou logikou přiřazování míst podle počtu rybářů (1-3).

## Checklist
- [x] Vytvořit ReservationForm s datepickerem a výběrem počtu rybářů
- [x] Implementovat logiku pro 1 rybáře (preferuje celé volné místo)
- [x] Implementovat logiku pro 2 rybáře (najde jedno celé volné místo)
- [x] Implementovat logiku pro 3 rybáře (najde sousední místa)
- [x] Propojit formulář se Supabase pro ukládání rezervací
- [x] Přidat validaci a feedback pro uživatele

## Acceptance
- Formulář správně vybírá optimální místa podle počtu rybářů
- Uživatel vidí doporučené varianty s vysvětlením
- Rezervace se úspěšně ukládá do databáze