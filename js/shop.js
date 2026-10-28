// Purchases (RevenueCat), optional rewarded ads and an ad after every 2nd finished run (Google AdMob) inside the PHONE APP only.
// The website build has neither: `enabled` is false there, so no ad or shop button is ever drawn.
// Ads never appear during a run (David's rule). Optional "Watch an ad" rewards sit on the rescue/result screens, and one short ad shows between runs after every 2nd finished run (never in AFK mode; Remove Ads turns it off);
// Google consent and the iPhone tracking prompt are shown only when the first ad is needed; ads still work if the player declines.
// While the real ids below are empty, Google's public TEST ads are used and the store says "not available" (nothing real is charged or shown).
import { STORE_LIVE } from './config.js';

const C = window.Capacitor, native = !!(C && C.isNativePlatform && C.isNativePlatform());
const FAKE = !STORE_LIVE && /[?&]shop=1/.test(location.search);   // tester switch on the website build only: pretend ads and purchases so the screens can be checked
export const enabled = native || FAKE;

// ---- ids (David fills these in; keep TEST true until the real AdMob app and RevenueCat keys exist) ----
const TEST = true;
const AD_UNITS = { ios: 'ca-app-pub-5865120493583018/8476844012', android: 'ca-app-pub-5865120493583018/2103007359' };                                                       // real rewarded-ad unit ids (ca-app-pub-.../...)
const TEST_UNITS = { ios: 'ca-app-pub-3940256099942544/1712485313', android: 'ca-app-pub-3940256099942544/5224354917' };
const INT_UNITS = { ios: 'ca-app-pub-5865120493583018/7050539712', android: 'ca-app-pub-5865120493583018/9676703058' };                                                       // real INTERSTITIAL unit ids
const TEST_INT = { ios: 'ca-app-pub-3940256099942544/4411468910', android: 'ca-app-pub-3940256099942544/1033173712' };
const RC_KEYS = { ios: '', android: '' };                                                         // RevenueCat PUBLIC app keys (appl_... / goog_...): safe to ship
const PRODUCTS = { removeAds: 'com.kelbra.hauntfall.removeads', builders: 'com.kelbra.hauntfall.builderspack' };
export const PRICE_FALLBACK = { removeAds: '$1.99', builders: '$0.99' };   // shown only until the store sends the real price

const plat = native ? C.getPlatform() : 'web';
const plug = (n) => { try { return (C.Plugins && C.Plugins[n]) || (C.registerPlugin && C.registerPlugin(n)) || null; } catch (e) { return null; } };   // a missing plugin must never stop the first screen
const AdMob = native ? plug('AdMob') : null;
const RC = native ? plug('Purchases') : null;
const unit = () => (TEST ? TEST_UNITS[plat] : AD_UNITS[plat]);
const prices = {}, cache = {};
let rcReady = null, adInit = null, loaded = false, loading = false;

function ownedFrom(res) {
  const ci = (res && (res.customerInfo || res)) || {}, ids = ci.allPurchasedProductIdentifiers || [];
  return { removeAds: ids.indexOf(PRODUCTS.removeAds) >= 0, builders: ids.indexOf(PRODUCTS.builders) >= 0 };
}
const merge = (S, o) => { S.ent = S.ent || {}; for (const k of Object.keys(o)) if (o[k]) S.ent[k] = true; return S.ent; };   // a purchase is never taken back by a failed lookup

// call once at start; onChange(S) runs when what the player owns changes
export function init(S, onChange) {
  if (!enabled) return;
  S.ent = S.ent || {};
  if (!native || !RC || !RC_KEYS[plat]) return;
  rcReady = Promise.resolve().then(() => RC.configure({ apiKey: RC_KEYS[plat] }));
  rcReady.then(() => RC.getCustomerInfo()).then((r) => { const had = JSON.stringify(S.ent); merge(S, ownedFrom(r)); if (JSON.stringify(S.ent) !== had && onChange) onChange(S); }).catch(() => {});
  rcReady.then(() => RC.getProducts({ productIdentifiers: Object.values(PRODUCTS), type: 'NON_SUBSCRIPTION' })).then((r) => {
    for (const p of (r && r.products) || []) { for (const k of Object.keys(PRODUCTS)) if (PRODUCTS[k] === p.identifier) { cache[k] = p; prices[k] = p.priceString; } }
  }).catch(() => {});
}
export const price = (k) => prices[k] || PRICE_FALLBACK[k];
export const storeReady = () => FAKE || (native && !!RC && !!RC_KEYS[plat]);

export function buy(S, k) {
  if (FAKE) { S.ent = S.ent || {}; S.ent[k] = true; return Promise.resolve(true); }
  if (!storeReady()) return Promise.resolve(false);
  return rcReady.then(() => (cache[k] ? cache[k] : RC.getProducts({ productIdentifiers: [PRODUCTS[k]], type: 'NON_SUBSCRIPTION' }).then((r) => (cache[k] = r.products && r.products[0]))))
    .then((p) => { if (!p) throw new Error('no product'); return RC.purchaseStoreProduct({ product: p }); })
    .then((r) => { merge(S, ownedFrom(r)); return !!(S.ent && S.ent[k]); }).catch(() => false);
}
export function restore(S) {
  if (FAKE) return Promise.resolve(true);
  if (!storeReady()) return Promise.resolve(false);
  return rcReady.then(() => RC.restorePurchases()).then((r) => { merge(S, ownedFrom(r)); return true; }).catch(() => false);
}

// ---- rewarded ads ----
function load() {
  if (!AdMob || !unit() || loading) return Promise.resolve(false);
  loading = true;
  return AdMob.prepareRewardVideoAd({ adId: unit(), isTesting: TEST }).then(() => { loaded = true; loading = false; return true; }).catch(() => { loaded = false; loading = false; return false; });
}
function initAds() {
  if (adInit) return adInit;
  let p = Promise.resolve().then(() => AdMob.initialize({ initializeForTesting: TEST }));
  p = p.then(() => (AdMob.requestConsentInfo ? AdMob.requestConsentInfo() : null)).then((info) => { if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') return AdMob.showConsentForm(); }).catch(() => {});
  p = p.then(() => (plat === 'ios' && AdMob.requestTrackingAuthorization ? AdMob.requestTrackingAuthorization() : null)).catch(() => {});
  return (adInit = p);
}
// Resolves true when the player has earned the reward. Owners of Remove Ads get every reward free, with no ad.
export function watch(S) {
  if (S.ent && S.ent.removeAds) return Promise.resolve(true);
  if (FAKE) return new Promise((r) => setTimeout(() => r(true), 700));
  if (!native || !AdMob || !unit()) return Promise.resolve(false);
  return initAds().then(() => (loaded ? true : load())).then((ok) => {
    if (!ok) return false;
    loaded = false;
    return AdMob.showRewardVideoAd().then((r) => { load(); return !!(r && (r.amount || r.type || r.rewarded !== false)); }).catch(() => { load(); return false; });
  }).catch(() => false);
}
export const adsAvailable = () => FAKE || (native && !!AdMob && !!unit());

// ---- the ad between runs (after every 2nd finished run; the first two runs are always ad-free) ----
const intUnit = () => (TEST ? TEST_INT[plat] : INT_UNITS[plat]);
let intLoaded = false, intLoading = false;
function loadInt() {
  if (!AdMob || !intUnit() || intLoading) return Promise.resolve(false);
  intLoading = true;
  return AdMob.prepareInterstitial({ adId: intUnit(), isTesting: TEST }).then(() => { intLoaded = true; intLoading = false; return true; }).catch(() => { intLoaded = false; intLoading = false; return false; });
}
// call when a normal run has finished; returns true when an ad should be shown before the next screen
export function runDone(S) { if (!enabled) return false; S.adRuns = (S.adRuns || 0) + 1; return S.adRuns >= 3 && S.adRuns % 2 === 0 && !(S.ent && S.ent.removeAds); }
export function showBetween(S) {
  if (!enabled || (S.ent && S.ent.removeAds)) return Promise.resolve(false);
  if (FAKE) return new Promise((r) => setTimeout(() => r(true), 700));
  if (!native || !AdMob || !intUnit()) return Promise.resolve(false);
  return initAds().then(() => (intLoaded ? true : loadInt())).then((ok) => { if (!ok) return false; intLoaded = false; return AdMob.showInterstitial().then(() => { loadInt(); return true; }).catch(() => { loadInt(); return false; }); }).catch(() => false);
}
