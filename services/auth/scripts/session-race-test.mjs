
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/api';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const SESSION_ID = process.env.SESSION_ID;

if (!ACCESS_TOKEN || !REFRESH_TOKEN || !SESSION_ID) {
  throw new Error(
    'ACCESS_TOKEN, REFRESH_TOKEN and SESSION_ID are required.',
  );
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ACCESS_TOKEN}`,
};

async function request(name, url, options = {}) {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, options);
    const text = await response.text();

    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return {
      name,
      status: response.status,
      ok: response.ok,
      durationMs: Math.round(performance.now() - startedAt),
      body,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error.message,
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}

function getPayload(body) {
  return body?.data ?? body;
}

async function main() {
  console.log('\nStarting session concurrency test...\n');

  // Both requests are started without waiting for either one.
  const [refreshResult, revokeResult] = await Promise.all([
    request(
      'REFRESH',
      `${BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: REFRESH_TOKEN,
        }),
      },
    ),

    request(
      'REVOKE',
      `${BASE_URL}/auth/sessions/${SESSION_ID}`,
      {
        method: 'DELETE',
        headers,
      },
    ),
  ]);

  console.log('--- PARALLEL REQUEST RESULTS ---');

  console.dir(refreshResult, { depth: 5 });
  console.dir(revokeResult, { depth: 5 });

  const refreshPayload = getPayload(refreshResult.body);

  const newRefreshToken =
    refreshPayload?.refreshToken ??
    refreshPayload?.refresh_token;

  console.log('\n--- FINAL SESSION STATE ---');

  const sessionsResult = await request(
    'GET_SESSIONS',
    `${BASE_URL}/auth/sessions`,
    {
      method: 'GET',
      headers,
    },
  );

  console.dir(sessionsResult, { depth: 5 });

  const sessionsPayload = getPayload(sessionsResult.body);

  const sessions = Array.isArray(sessionsPayload)
    ? sessionsPayload
    : sessionsPayload?.sessions;

  const testedSession = Array.isArray(sessions)
    ? sessions.find((session) => session.id === SESSION_ID)
    : undefined;

  if (testedSession) {
    console.log('Tested session:', {
      id: testedSession.id,
      active: testedSession.active,
      revoked_at: testedSession.revoked_at,
    });
  } else {
    console.log(
      'Could not automatically locate the session. Inspect GET_SESSIONS response above.',
    );
  }

  console.log('\n--- NEW REFRESH TOKEN VALIDATION ---');

  let newTokenRejected = null;

  if (newRefreshToken) {
    const probeResult = await request(
      'NEW_REFRESH_TOKEN_PROBE',
      `${BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: newRefreshToken,
        }),
      },
    );

    newTokenRejected = !probeResult.ok;

    console.log({
      status: probeResult.status,
      rejected: newTokenRejected,
      durationMs: probeResult.durationMs,
    });
  } else {
    console.log(
      'Refresh did not return a new token. This can happen when revoke wins the race.',
    );
  }

  console.log('\n--- TEST SUMMARY ---');

  const sessionInactive =
    testedSession ? testedSession.active === false : null;

  console.log({
    refreshStatus: refreshResult.status,
    revokeStatus: revokeResult.status,
    sessionInactive,
    newTokenRejected,
  });

  const refreshRejectedAsExpected =
    refreshResult.status === 401;

  const passed =
    revokeResult.ok &&
    sessionInactive === true &&
    (
      refreshRejectedAsExpected ||
      (refreshResult.ok && newTokenRejected === true)
    );

  console.log({
    revokeSucceeded: revokeResult.ok,
    sessionInactive,
    refreshRejectedAsExpected,
    newTokenRejected,
    passed,
  });

  console.log(
    passed ? '\nPASS: Session is revoked.' : '\nCHECK: Review the results above.',
  );

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exitCode = 1;
});
