# Polyhive Weather Edge

Progetto Expo Go completo per scanner Polymarket Weather con logica “resolution-first”.

## Avvio

```bash
npm install
npx expo start
```

## Modalità live

Di default parte in demo, così l'interfaccia e il motore funzionano subito.

Per tentare discovery live Polymarket:

```ts
// src/config.ts
export const USE_LIVE_POLYMARKET = true;
```

## Cosa include

- Discovery mercati weather
- Parser base regole/risoluzione
- Station risk engine
- Forecast freshness engine
- Spike/anomaly risk detector
- Liquidity/spread gate
- Fair probability engine
- Edge ranking engine
- UI premium Expo Go

Questo è uno scanner informativo/decisionale. Non garantisce profitti e non esegue ordini.
