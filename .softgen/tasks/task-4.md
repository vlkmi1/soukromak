---
title: Admin panel pro správu rezervací
status: todo
priority: medium
type: feature
tags: [admin, backend]
created_by: agent
created_at: 2026-05-29T12:23:26Z
position: 4
---

## Notes
Admin rozhraní pro správu rezervací se stavy: nové, potvrzené, zaplacené, stornované. Tabulka s filtrováním a akcemi.

## Checklist
- [ ] Vytvořit /admin stránku s autentizací
- [ ] Vytvořit ReservationsTable komponentu
- [ ] Implementovat filtry podle stavu a data
- [ ] Přidat akce pro změnu stavu rezervace
- [ ] Zobrazit detaily rezervace (jméno, kontakt, místa, datum)

## Acceptance
- Admin vidí všechny rezervace v přehledné tabulce
- Může měnit stavy rezervací
- Filtry fungují správně