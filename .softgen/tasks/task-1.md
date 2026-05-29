---
title: Databázové schéma a Supabase setup
status: todo
priority: urgent
type: feature
tags: [backend, database]
created_by: agent
created_at: 2026-05-29T12:23:26Z
position: 1
---

## Notes
Vytvoření databázového schématu pro rezervační systém rybníku. Tabulky pro lovná místa, pozice, rezervace a jejich stavy.

## Checklist
- [ ] Vytvořit SQL migrace pro tabulky (fishing_spots, spot_positions, reservations)
- [ ] Nastavit Row Level Security policies
- [ ] Vytvořit Supabase client utility v lib/supabase.ts
- [ ] Vytvořit TypeScript typy pro databázové entity

## Acceptance
- Databázové schéma je plně funkční
- RLS policies zajišťují bezpečný přístup k datům
- TypeScript typy reflektují databázovou strukturu