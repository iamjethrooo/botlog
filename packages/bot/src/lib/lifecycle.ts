import * as timers from 'timers';

let stopping = false;
const timeouts = new Set<NodeJS.Timeout>();
const intervals = new Set<NodeJS.Timeout>();
const work = new Set<Promise<unknown>>();
const collectors = new Set<{ stop(reason?: string): void }>();
export const isStopping = () => stopping;

export function clearTimeout(timer?: NodeJS.Timeout) {
  if (timer) { timeouts.delete(timer); intervals.delete(timer); timers.clearTimeout(timer); }
}
export function clearInterval(timer?: NodeJS.Timeout) {
  if (timer) { intervals.delete(timer); timeouts.delete(timer); timers.clearInterval(timer); }
}

export function trackWork<T>(promise: Promise<T>): Promise<T> {
  work.add(promise);
  void promise.finally(() => work.delete(promise)).catch(() => {});
  return promise;
}

export function setTimeout(callback: (...args: any[]) => unknown, delay?: number, ...args: any[]) {
  if (stopping) throw new Error('Bot is stopping');
  const timer = timers.setTimeout(() => {
    timeouts.delete(timer);
    if (!stopping) void trackWork(Promise.resolve().then(() => callback(...args)))
      .catch(error => console.error('Timed work failed', error));
  }, delay);
  timeouts.add(timer);
  return timer;
}

export function setInterval(callback: (...args: any[]) => unknown, delay?: number, ...args: any[]) {
  if (stopping) throw new Error('Bot is stopping');
  const timer = timers.setInterval(() => {
    if (!stopping) void trackWork(Promise.resolve().then(() => callback(...args)))
      .catch(error => console.error('Interval work failed', error));
  }, delay);
  intervals.add(timer);
  return timer;
}

export function trackCollector<T extends { stop(reason?: string): void; once: Function }>(collector: T): T {
  collectors.add(collector);
  collector.once('end', () => collectors.delete(collector));
  if (stopping) collector.stop('shutdown');
  return collector;
}

export async function drainWork(timeout = 20000): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (work.size && Date.now() < deadline) {
    await new Promise(resolve => timers.setTimeout(resolve, 25));
  }
  return work.size === 0;
}

export function beginShutdown() {
  stopping = true;
  for (const timer of timeouts) timers.clearTimeout(timer);
  for (const timer of intervals) timers.clearInterval(timer);
  timeouts.clear(); intervals.clear();
  for (const collector of collectors) collector.stop('shutdown');
  collectors.clear();
}
