# Rezervační systém Rybník Ostrata

## Vize
Webová aplikace pro rezervaci lovných míst na rybníku. Umožňuje rybářům intuitivně vybrat místo přímo na interaktivní mapě rybníku a provádět rezervace online. Správci spravují rezervace přes admin rozhraní.

## Design
Design vychází z webu rybnikostrata.cz:
- `--primary: 142 76% 36% (zelená přírody)`
- `--secondary: 200 18% 46% (šedá kámen)`
- `--accent: 207 90% 54% (vodní modrá)`
- `--background: 0 0% 100% (bílá)`
- `--foreground: 222 47% 11% (tmavě modrá)`
- `--muted: 210 40% 96% (světle šedá)`
- `--card: 0 0% 100% (bílá)`
- `--border: 214 32% 91% (světlá hranice)`

Fonty: **Inter** (body), **Inter** (nadpisy, weight 700)
Styl: Čistý, přírodní, profesionální – rybářská tradice s moderní funkčností

## Features
- Interaktivní mapa rybníku s 13 lovnými místy
- Každé místo má 2 pozice pro rybáře
- Chytrá logika přiřazování míst podle počtu rybářů (1/2/3)
- Rezervační formulář s výběrem data
- Admin panel pro správu rezervací (nové, potvrzené, zaplacené, stornované)
- Supabase backend pro perzistenci dat