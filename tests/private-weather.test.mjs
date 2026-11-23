import test from 'node:test';
import assert from 'node:assert/strict';
import { createSafeStorage } from '../storage-resilience.mjs';
import { createPrivateWeather, summarizeWeather, WEATHER_KEY } from '../private-weather-model.mjs';

function fixture() {
  const data = new Map();
  let writes = 0;
  const native = { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>{writes++; data.set(k,v);}, removeItem:k=>data.delete(k) };
  let date = new Date(2026,10,23,12);
  const model = createPrivateWeather({ storage:createSafeStorage(native), now:()=>date });
  return { model, data, native, writes:()=>writes, setDate:value=>{date=value;} };
}

test('disabled by default without creating history; opt-in deduplicates room/day and excludes payloads', () => {
  const f=fixture();
  assert.equal(f.model.snapshot().enabled,false);
  assert.equal(f.model.record('m'),false);
  assert.equal(f.writes(),0);
  f.model.setEnabled(true);
  assert.equal(f.model.record('m', {text:'never store this'}),true);
  assert.equal(f.model.record('m'),false);
  assert.equal(f.model.record('invalid'),false);
  const state=JSON.parse(f.data.get(WEATHER_KEY));
  assert.deepEqual(state,{version:1,enabled:true,entries:[{day:'2026-11-23',room:'m'}]});
});

test('summaries use inclusive local calendar windows, not repeat visits or scores', () => {
  const f=fixture();f.model.setEnabled(true);
  for(const day of [24,25,31]) { f.setDate(new Date(2026,9,day,12));f.model.record('e'); }
  for(const day of [16,17,23]) { f.setDate(new Date(2026,10,day,12));f.model.record('m'); }
  const state=f.model.snapshot();
  assert(!state.entries.some(e=>e.day==='2026-10-24'));
  assert.equal(summarizeWeather(state,7,new Date(2026,10,23,12)).recordedDays,2);
  assert.equal(summarizeWeather(state,30,new Date(2026,10,23,12)).recordedDays,5);
  assert.equal(summarizeWeather(state,7,new Date(2026,10,23,12)).rooms.find(r=>r.room==='m').days,2);
});

test('saved data is sanitized, bounded and fail-closed for unknown schemas', () => {
  const f=fixture();
  f.data.set(WEATHER_KEY,JSON.stringify({version:1,enabled:'yes',secret:'discard',entries:[
    {day:'2026-11-23',room:'h',text:'discard',at:123}, {day:'2026-11-23',room:'h'},
    {day:'2026-11-24',room:'e'}, {day:'2026-02-30',room:'e'}, {day:'2026-11-20',room:'x'}
  ]}));
  assert.deepEqual(f.model.snapshot().entries,[{day:'2026-11-23',room:'h'}]);
  assert.equal(f.model.snapshot().enabled,false);
  assert(!f.data.get(WEATHER_KEY).includes('discard'));
  for(const raw of ['bad JSON','null','{"version":2,"enabled":true}']) {
    f.data.set(WEATHER_KEY,raw);assert.equal(f.model.record('h'),false);
  }
});

test('pause retains records, another instance respects revocation, clear touches only weather data', () => {
  const f=fixture();f.model.setEnabled(true);f.model.record('m');
  const other=createPrivateWeather({storage:createSafeStorage(f.native),now:()=>new Date(2026,10,23,12)});
  f.data.set('empath_daily_checkins_v1','keep');
  other.setEnabled(false);
  assert.equal(f.model.record('e'),false);
  assert.equal(f.model.snapshot().entries.length,1);
  assert.equal(f.model.clear(),true);
  assert.equal(other.record('h'),false);
  assert.equal(f.data.get('empath_daily_checkins_v1'),'keep');
  assert.equal(f.data.has(WEATHER_KEY),false);
});

test('storage failures stay in-page and failed deletion is reported without claiming success', () => {
  const f=fixture();f.model.setEnabled(true);f.model.record('m');
  f.native.setItem=()=>{throw Error('blocked');};
  f.native.removeItem=()=>{throw Error('blocked');};
  f.model.setEnabled(false);
  assert.equal(f.model.snapshot().temporary,true);
  assert.equal(f.model.record('e'),false);
  assert.equal(f.model.clear(),false);
  assert.equal(f.model.snapshot().deletionFailed,true);
  assert.equal(f.model.snapshot().enabled,false);
  assert.equal(f.model.snapshot().entries.length,0);
  assert.equal(JSON.parse(f.data.get(WEATHER_KEY)).entries.length,1);
});

test('month rollover and DST use calendar days', () => {
  const previous=process.env.TZ;process.env.TZ='America/New_York';
  try {
    const entries=[{day:'2026-10-28',room:'m'},{day:'2026-10-29',room:'m'},{day:'2026-11-04',room:'h'}];
    const result=summarizeWeather({version:1,enabled:true,entries},7,new Date(2026,10,4,12));
    assert.equal(result.recordedDays,2);
  } finally { if(previous===undefined) delete process.env.TZ; else process.env.TZ=previous; }
});
