/**
 * Stand-in for the lazily imported Firebase chunk.
 *
 * store.js resolves its network module at runtime from
 * `new URL('guide-feedback-net.js', document.currentScript.src)`. Pointing that
 * src at this directory makes the real dynamic import land here, so the tests
 * exercise store.js's actual delivery loop — including the await boundary where
 * the lost-update bug lived — rather than a reimplementation of it.
 *
 * Behaviour is driven by globalThis.__net so a test can make a write hang,
 * fail, or succeed without re-mocking the module.
 */

export async function write(answer) {
  const net = globalThis.__net;
  net.sent.push({ block: answer.block, verdict: answer.verdict, note: answer.note, rev: answer.rev });

  if (net.hold) {
    // Lets a test run assertions, or fire another submit, while this write is
    // still in the air — the exact window the lost-update bug needed.
    await net.hold;
  }
  if (net.failWith) {
    const error = new Error('stub failure');
    error.code = net.failWith;
    throw error;
  }
}

const TERMINAL = ['permission-denied', 'invalid-argument'];

export function isRetryable(error) {
  return !TERMINAL.includes(error?.code);
}

export function describe(error) {
  return error?.code ?? error?.name ?? 'unknown';
}
