// Days 43–56 — Phase 2 Week 7 (Systems II & design) and Phase 3 Week 8 (Linear
// algebra & calculus). Follows docs/authoring-guide.md; exemplar = Day 22.
export const DAYS_043_056 = [
  {
    id: 'd043', day: 43, week: 7, phase: 2, kind: 'lesson',
    title: 'Networking — Packets to HTTPS',
    analogy: 'The postal system',
    objectives: [
      'Explain what IP, TCP, UDP, DNS, and TLS each contribute to one HTTPS request',
      'Trace a full request with curl -v and name every phase in the output',
      'Distinguish latency from bandwidth and say which one dominates API performance',
      'Describe the TLS handshake and what a certificate actually proves',
      'Read a request waterfall and identify the slowest phase',
    ],
    prereqs: [
      { day: 41, label: 'HTTP & your first API' },
      { day: 39, label: 'OS essentials — processes & file descriptors' },
      { day: 6, label: 'The terminal & Linux' },
    ],
    eli5: `Mailing a birthday card involves a whole invisible system: you write an address (DNS turns "grandma's house" into street coordinates), the postal service breaks bulk mail into individual trucks and routes each one independently (IP moves packets hop by hop, and any packet can take a different road), and certified mail adds tracking plus a signature on delivery so lost items get re-sent (TCP numbers every packet and re-transmits the missing ones). If the card is private, you use a tamper-evident envelope that only grandma can open, sealed with a wax stamp a notary vouches for (TLS encryption plus a certificate signed by an authority both of you trust).

One HTTPS request is exactly this stack of services layered on top of each other: DNS finds the address, TCP sets up a reliable two-way channel over unreliable IP, TLS wraps it in the sealed envelope, and only then does your actual HTTP letter — "GET /users/42" — travel inside. Each layer only does its one job and trusts the layer below.`,
    why: `Every AI product you ship is a network service calling other network services: your API calls a model provider, a vector DB, and a cache — each hop adds DNS + TCP + TLS + server time. When a customer says "your assistant takes 4 seconds to answer," you must decompose that into network phases before touching code; the fix for 800 ms of TLS handshakes (connection reuse) is completely different from the fix for slow generation. FDEs also live inside customer networks: firewalls, private DNS, and TLS interception are the top three reasons a demo that worked in your office dies on-site.`,
    tech: `### The layer cake, minimally

**IP** delivers packets — small chunks of bytes — from one address to another, best-effort: packets can arrive late, duplicated, reordered, or not at all. **UDP** is a thin veneer over IP (adds ports, keeps the unreliability) — used where speed beats completeness: DNS queries, video, some LLM streaming internals. **TCP** builds reliability on top: a three-way handshake (SYN → SYN-ACK → ACK) establishes a connection, then sequence numbers, acknowledgements, and retransmission guarantee ordered, complete delivery. A **port** identifies which process on the machine gets the bytes; a socket is one endpoint of a (IP, port) conversation — the same file-descriptor machinery you met on Day 39.

**DNS** resolves names to IPs before anything else can happen: your resolver asks a chain of servers (root → TLD → authoritative) and caches the answer with a TTL. A cold DNS lookup can cost tens of milliseconds; caching is why the second request is faster.

### TLS — the sealed envelope

TLS runs after TCP connects. The client and server negotiate cipher suites, the server presents a **certificate** — a public key plus identity, signed by a certificate authority your OS already trusts — and the two sides derive a shared symmetric key for the session. The certificate proves you are talking to the real api.anthropic.com, not a man-in-the-middle; encryption keeps the contents private. The handshake costs a round trip or two, which is why clients reuse connections (keep-alive) instead of paying it per request.

### HTTP/1.1 vs HTTP/2, and latency vs bandwidth

HTTP/1.1 handles one request at a time per connection, so browsers open several. HTTP/2 multiplexes many streams over one connection and compresses headers. **Latency** is the time for one byte to make the round trip (speed-of-light plus queueing — you cannot buy your way out of physics); **bandwidth** is bytes per second once flowing. API traffic is small messages, so latency times round-trip count dominates — which is why chattier protocols and un-reused connections hurt far more than payload size, and why every serious HTTP client pools connections.`,
    viz: null,
    guided: [
      {
        title: 'Anatomy of one HTTPS request with curl -v',
        minutes: 20,
        body: `1. Run \`curl -v https://example.com\` and read the output top to bottom — do not skim.
2. Label each block in a scratch file: DNS resolution (the \`Trying <ip>\` line), TCP connect, TLS handshake (\`TLS handshake\`, certificate lines: issuer, subject, expiry), the HTTP request you sent (lines starting \`>\`), the response (lines starting \`<\`).
3. Find the certificate's issuer and expiry date. Who vouched for this server?
4. Run it again with timing: paste the \`--write-out\` command from the starter. Record the five phase timings.
5. Run the timing command twice in a row. Which phases got cheaper the second time, and why? (Hint: DNS cache, connection reuse does NOT happen across curl invocations — so what stayed expensive?)`,
        code: `# Verbose anatomy: every phase narrated
curl -v https://example.com -o /dev/null

# Phase timings (seconds). namelookup=DNS, connect=TCP,
# appconnect=TLS done, starttransfer=first byte (server think time included)
curl -s -o /dev/null -w "DNS       %{time_namelookup}\\nTCP       %{time_connect}\\nTLS       %{time_appconnect}\\nfirstbyte %{time_starttransfer}\\ntotal     %{time_total}\\n" https://example.com

# Compare an http:// URL — which phase disappears?
curl -s -o /dev/null -w "TCP %{time_connect}  total %{time_total}\\n" http://example.com`,
      },
      {
        title: 'Speak raw HTTP through a socket',
        minutes: 15,
        body: `HTTP is just text over a TCP socket. Prove it.

1. Run the starter script: it opens a TCP socket to example.com port 80, writes a hand-typed HTTP/1.1 request, and prints the raw response.
2. Identify the status line, three headers, the blank line separating headers from body, and the body.
3. Break it on purpose: remove the \`Host\` header and re-run. What status comes back, and why does a shared server need Host? (One IP hosts many sites.)
4. Change the path to \`/nonexistent\`. Confirm the 404 arrives as ordinary text — errors are responses too.
5. Try port 443 with this same script. It fails or returns garbage — explain in one sentence why (no TLS layer).`,
        code: `import socket

HOST = "example.com"

sock = socket.create_connection((HOST, 80), timeout=5)
request = (
    "GET / HTTP/1.1\\r\\n"
    "Host: example.com\\r\\n"
    "User-Agent: day43-lab\\r\\n"
    "Connection: close\\r\\n"
    "\\r\\n"                      # blank line = end of headers
)
sock.sendall(request.encode("ascii"))

chunks = []
while True:
    data = sock.recv(4096)
    if not data:
        break
    chunks.append(data)
sock.close()

raw = b"".join(chunks).decode("utf-8", errors="replace")
head, _, body = raw.partition("\\r\\n\\r\\n")
print("=== RESPONSE HEAD ===")
print(head)
print("=== FIRST 300 CHARS OF BODY ===")
print(body[:300])`,
      },
    ],
    practice: [
      {
        title: 'The latency audit',
        minutes: 20,
        body: `Pick three real endpoints: a nearby site, an intercontinental one, and an API (e.g. a public JSON API). Using the curl timing template from guided work, collect DNS / TCP / TLS / first-byte / total for each, three runs apiece.

Your goal: (1) a small table of medians; (2) one sentence per endpoint naming the dominant phase; (3) answer: for the API, what fraction of total time is connection setup (TCP+TLS) — and therefore what would connection reuse save a client making 100 sequential calls?

Hints (only if stuck): setup cost is roughly (connect + appconnect − namelookup); a pooled client pays it once, not 100 times.`,
      },
    ],
    project: {
      title: 'Request waterfall field notes',
      brief: `Create \`networking_notes.md\` in your practice repo: an annotated trace of ONE full HTTPS request to a real API. Include the labeled curl -v output (trimmed), a phase-timing table from three runs, a hand-drawn-in-ASCII waterfall (DNS → TCP → TLS → request → server → response), and a "so what" section: three concrete rules you will apply when building LLM clients (connection reuse, timeout placement, why streaming changes perceived latency). Commit it — you will reuse these rules verbatim when you build the robust LLM client wrapper on Day 107.`,
      rubric: [
        'curl -v output annotated with all five phases correctly labeled',
        'Timing table with three runs and medians for DNS/TCP/TLS/first-byte/total',
        'ASCII waterfall orders the phases correctly and marks the dominant one',
        'Three client-design rules stated, each tied to a measured number',
        'Committed to the practice repo with a descriptive message',
      ],
    },
    mistakes: [
      'Thinking HTTPS is a different protocol from HTTP. It is HTTP inside a TLS tunnel over TCP — same verbs, same headers, encrypted transport.',
      'Blaming "slow internet" (bandwidth) for slow APIs. Small JSON messages are latency-bound: round trips times distance, not megabits per second.',
      'Assuming DNS happens on every request. Resolvers cache aggressively per TTL — but the FIRST request after a deploy or in a fresh container pays full price.',
      'Believing TLS certificates encrypt traffic. The certificate authenticates identity; encryption uses a symmetric session key derived during the handshake.',
      'Forgetting that TCP guarantees delivery, not timeliness. A "reliable" connection can stall for seconds on retransmission — which is why your clients need timeouts (Day 107 makes this law).',
      'Ignoring the Host header. One IP serves many domains; without Host (or SNI in TLS), the server cannot know which site you want.',
    ],
    quiz: [
      {
        q: 'A client makes 50 sequential HTTPS calls to the same API without connection reuse. What cost does it pay 50 times that a pooled client pays once?',
        o: [
          'DNS resolution only',
          'TCP + TLS handshakes',
          'HTTP header parsing',
          'Bandwidth charges',
        ],
        x: 1,
        w: 'Each fresh connection repeats the TCP three-way handshake and the TLS negotiation — often 1–3 round trips. Keep-alive/pooling pays this once. DNS is usually cached after the first lookup either way.',
        revisit: 43,
      },
      {
        q: 'Your API response is 2 KB of JSON but takes 900 ms from another continent. The dominant cause is most likely…',
        o: [
          'Insufficient bandwidth',
          'JSON parsing overhead',
          'Round-trip latency multiplied across connection setup and the request',
          'The payload being too large',
        ],
        x: 2,
        w: 'Two kilobytes transfers in a blink on any modern link. Long-distance round trips (DNS, TCP, TLS, then the request itself) stack up; latency, not bandwidth, dominates small API calls.',
        revisit: 43,
      },
      {
        q: 'What does a TLS certificate actually prove?',
        o: [
          'That the connection is fast',
          'That a trusted authority vouches this public key belongs to this domain',
          'That the server has no vulnerabilities',
          'That the response body is unmodified HTML',
        ],
        x: 1,
        w: 'A certificate binds a domain identity to a public key, signed by a CA your system trusts. It authenticates WHO you are talking to; session encryption is derived separately during the handshake.',
        revisit: 43,
      },
    ],
    resources: [
      { label: "Beej's Guide to Network Programming — chapters 1–3", url: 'https://beej.us/guide/bgnet/', type: 'book', time: '30 min' },
      { label: 'MDN: HTTP — overview & messages', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'docs', time: '25 min' },
      { label: 'Everything curl — the free curl book', url: 'https://everything.curl.dev/', type: 'book', time: '20 min' },
      { label: 'ByteByteGo — networking explainers', url: 'https://blog.bytebytego.com/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards from Week 6', minutes: 10 },
      { activity: 'ELI5 + tech read: the layer cake and TLS', minutes: 20 },
      { activity: 'Guided: curl -v anatomy + raw socket HTTP', minutes: 35 },
      { activity: 'Practice: the latency audit', minutes: 20 },
      { activity: 'Project: request waterfall field notes', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'curl -v trace fully labeled: DNS, TCP, TLS, request, response',
      'Raw-socket script run, Host-header experiment explained',
      'Latency audit table complete with dominant phase named per endpoint',
      'Field notes committed with three client-design rules',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'On Day 41 you used HTTP through httpx and FastAPI as a black box; today you opened it — sockets, ports, and file descriptors are the Day 39 machinery underneath. The terminal fluency from Day 6 made curl feel natural.',
      forward: 'Day 44 adds locks to this postal system (TLS was privacy; auth is identity and permission). On Day 107 your LLM client wrapper applies today\'s rules — pooling, timeouts, streaming — and on Day 155 you\'ll decompose model latency (TTFT vs tokens/sec) with exactly this waterfall thinking.',
    },
    flashcards: [
      { f: 'What does TCP add on top of IP?', b: 'Reliability: handshake, sequence numbers, ACKs, retransmission — ordered, complete delivery over unreliable packets.' },
      { f: 'Latency vs bandwidth — which dominates small API calls?', b: 'Latency. Round trips × distance; a 2 KB payload never saturates bandwidth.' },
      { f: 'What does a TLS certificate prove?', b: 'A CA-signed binding of domain identity to a public key — authenticates WHO you talk to.' },
      { f: 'Why reuse connections (keep-alive)?', b: 'TCP + TLS handshakes cost 1–3 round trips each; pooling pays them once, not per request.' },
      { f: 'DNS in one sentence?', b: 'Name → IP resolution via root/TLD/authoritative servers, cached with TTLs.' },
      { f: 'Why does HTTP/1.1 need the Host header?', b: 'One IP serves many domains; Host tells the server which site the request targets.' },
    ],
    deepDive: [
      { label: 'HTTP/3 and QUIC — TCP reimagined over UDP', note: 'QUIC merges transport and TLS handshakes and fixes head-of-line blocking. Skim the idea; the mental model (fewer round trips) is what matters.' },
    ],
  },
  {
    id: 'd044', day: 44, week: 7, phase: 2, kind: 'lesson',
    title: 'Security, AuthN & AuthZ',
    analogy: 'Locks, badges and guest lists',
    objectives: [
      'Distinguish hashing from encryption and explain why passwords are hashed, never encrypted',
      'Explain salted password hashing and why bcrypt/argon2 beat SHA-256 for passwords',
      'Compare sessions and JWTs, including the JWT revocation pitfall',
      'Walk through an OAuth2/OIDC authorization-code flow and name each actor',
      'Apply least privilege and RBAC to an API design',
    ],
    prereqs: [
      { day: 43, label: 'Networking & TLS' },
      { day: 41, label: 'HTTP & your first API' },
      { day: 38, label: 'Database internals — where credentials live' },
    ],
    eli5: `An office building runs three separate security systems, and mixing them up is how break-ins happen. The lock on the front door is **encryption**: anyone with the key can lock and unlock — it is reversible by design. The visitor logbook is **hashing**: the guard writes a smudge-proof fingerprint of your ID into the book; nobody can reconstruct your ID from the fingerprint, but tomorrow they can check "same person?" by fingerprinting you again. The badge on your lanyard is **authentication** — it proves who you are. The guest list on each meeting-room door is **authorization** — being in the building (authenticated) does not mean every door opens for you.

Web security is these systems composed: TLS locks the trucks between buildings (Day 43), password hashes are the fingerprint logbook, sessions and JWTs are the badge, and role checks are the per-door guest list. Most real breaches are not lock-picking — they are a badge that never expires, a guest list nobody prunes, or a logbook that stored the actual IDs instead of fingerprints.`,
    why: `AI applications concentrate risk: they hold API keys worth real money per token, they proxy user data into third-party models, and agents can act with the permissions you give them. "Least privilege" stops being a slogan the day your demo agent has a database tool and a customer asks what stops it from reading other tenants' rows. Every enterprise deal you touch as an FDE begins with a security questionnaire — SSO (OAuth2/OIDC), secrets handling, RBAC — and engineers who can answer precisely close deals faster. On Day 132 prompt injection joins this threat model; today's foundations are what injection attacks try to bypass.`,
    tech: `### Hashing vs encryption

Encryption is reversible with a key (TLS, encrypted disks). Hashing is deliberately one-way: fixed-size digest, tiny input change → completely different output, no way back. Passwords must be **hashed**, because then a database leak leaks fingerprints, not keys. But fast hashes (SHA-256) are wrong for passwords — attackers try billions of guesses per second offline. Password hashes must be **slow and salted**: a salt is a random per-user value stored beside the hash, defeating precomputed rainbow tables and making identical passwords hash differently; bcrypt/argon2 add a tunable work factor so each guess costs real compute. Verification recomputes the hash from the attempt + stored salt and compares.

### Sessions vs JWTs

A **session** stores state server-side: login creates a random session ID, kept in an httpOnly cookie; every request looks it up. Revocation is trivial — delete the row. A **JWT** moves the state into a signed token: header.payload.signature, base64url-encoded, signed (HMAC or asymmetric). Any service holding the key can verify it without a database hit — great for stateless, distributed APIs (Day 46). The pitfalls: payloads are readable (encoded ≠ encrypted — never put secrets in claims), tokens cannot be revoked before expiry without reintroducing server state (a denylist), so keep lifetimes short and use refresh tokens, and the alg header must be pinned server-side (the classic \`alg: none\` attack).

### OAuth2/OIDC in one walk

"Log in with Google" without giving the app your Google password: the **client** (app) redirects you to the **authorization server** (Google), you authenticate THERE and consent, it redirects back with a one-time code, and the app's backend exchanges code + client secret for an access token (authorization) — OIDC adds an ID token (authentication) on top. The browser never carries the real credentials; tokens are scoped and expiring.

### AuthZ, keys, and hygiene

API keys are bearer credentials for machines: hash them at rest like passwords, prefix them for identification, rotate and scope them. **RBAC** maps users → roles → permissions; check permissions on every request server-side (never trust the client's word). Secrets live in env vars or secret managers, never in git (Day 16's config habits). The OWASP Top Ten is the standing checklist — broken access control has been the number-one web risk for years, and it is an authorization bug, not a cryptography bug.`,
    viz: 'auth-flow',
    guided: [
      {
        title: 'Salted, slow password hashing — and why fast is fatal',
        minutes: 20,
        body: `1. Run part 1 of the starter: hash the same password twice with SHA-256. Identical outputs — why is that a problem for a leaked database? (Same password → same hash → crack once, unlock everyone.)
2. Part 2 salts each hash with random bytes. Confirm the same password now produces different digests, and that verification still works because the salt is stored alongside.
3. Part 3 uses pbkdf2 with 600k iterations. Time one verification. Multiply: at this cost per guess, how long do 1 billion guesses take on this machine vs plain SHA-256?
4. Write the two-line summary in your notes: salt defeats precomputation; work factor defeats brute force.`,
        code: `import hashlib, os, time

pw = b"correct horse battery staple"

# --- 1. naive fast hash: deterministic = crackable in bulk
print(hashlib.sha256(pw).hexdigest()[:32])
print(hashlib.sha256(pw).hexdigest()[:32], "<- identical: bad")

# --- 2. add a per-user salt
def hash_pw(password: bytes, salt: bytes) -> str:
    return hashlib.sha256(salt + password).hexdigest()

s1, s2 = os.urandom(16), os.urandom(16)
print(hash_pw(pw, s1)[:32])
print(hash_pw(pw, s2)[:32], "<- same password, different digests")

# --- 3. add a work factor: pbkdf2 (stdlib stand-in for bcrypt/argon2)
def slow_hash(password: bytes, salt: bytes, iters: int = 600_000) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password, salt, iters)

salt = os.urandom(16)
t0 = time.perf_counter()
digest = slow_hash(pw, salt)
per_guess = time.perf_counter() - t0
print(f"one verification: {per_guess*1000:.0f} ms")
print(f"1e9 guesses would take ~{per_guess * 1e9 / 86400 / 365:.1f} YEARS here")

# verify flow: recompute with the STORED salt, compare digests
assert slow_hash(pw, salt) == digest
assert slow_hash(b"wrong password", salt) != digest
print("verify OK")`,
      },
      {
        title: 'Build and break a JWT by hand',
        minutes: 20,
        body: `JWTs are just base64url + a signature. Building one demystifies every pitfall.

1. Run the starter: it mints a token with an HMAC-SHA256 signature, then verifies it.
2. Decode the payload WITHOUT the key (part 2). Lesson one: anyone can read claims — encoded is not encrypted.
3. Tamper with the payload (change role to admin) and re-verify. The signature check fails — that is the entire security model.
4. Re-sign the tampered payload WITH the key and watch it verify. Lesson two: whoever holds the signing key mints identity; key management IS auth security.
5. Check the exp claim logic: set exp in the past and confirm your verify function rejects it. Lesson three: expiry is the only built-in revocation.`,
        code: `import base64, hashlib, hmac, json, time

SECRET = b"server-side-signing-key"   # in prod: from a secret manager

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def sign(header: dict, payload: dict, key: bytes) -> str:
    h = b64url(json.dumps(header).encode())
    p = b64url(json.dumps(payload).encode())
    sig = hmac.new(key, f"{h}.{p}".encode(), hashlib.sha256).digest()
    return f"{h}.{p}.{b64url(sig)}"

def verify(token: str, key: bytes) -> dict | None:
    h, p, s = token.split(".")
    expected = hmac.new(key, f"{h}.{p}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(b64url(expected), s):
        return None                          # signature mismatch
    pad = "=" * (-len(p) % 4)
    payload = json.loads(base64.urlsafe_b64decode(p + pad))
    if payload.get("exp", 0) < time.time():
        return None                          # expired
    return payload

token = sign({"alg": "HS256", "typ": "JWT"},
             {"sub": "user42", "role": "viewer", "exp": time.time() + 900},
             SECRET)
print(token[:60], "...")
print("verified:", verify(token, SECRET))

# 2. read the payload with NO key — claims are public!
h, p, s = token.split(".")
print("readable:", base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)))

# 3. tamper: forge role=admin, keep old signature -> must fail
forged_p = b64url(json.dumps({"sub": "user42", "role": "admin",
                              "exp": time.time() + 900}).encode())
print("tampered verifies?", verify(f"{h}.{forged_p}.{s}", SECRET))  # None`,
      },
    ],
    practice: [
      {
        title: 'The auth design review',
        minutes: 20,
        body: `A junior teammate proposes this for your Day 42 notes service: passwords stored as SHA-256 (no salt), a JWT with a 30-day expiry containing the user's email and plaintext API quota, admin checks done in the frontend ("we hide the delete button"), and the signing key committed in config.py "so tests pass."

Your goal: write a review with (1) every flaw found (there are at least five), (2) the concrete fix for each, (3) the one-line principle behind each fix (salting, short expiry, server-side authZ, secrets management, least privilege).

Hints: what happens on database leak? On stolen token? On a curl request that skips the frontend? On a public repo?`,
      },
    ],
    project: {
      title: 'Auth decision memo + password module',
      brief: `Two deliverables in your practice repo. (1) \`auth_memo.md\`: for the notes service you will harden tomorrow, decide sessions vs JWT vs API keys for its two clients (a web UI and a CLI script), justify in a paragraph each, and draw the OAuth2 authorization-code flow as a numbered ASCII sequence with all four actors. (2) \`auth_lib.py\` + tests: \`hash_password\`, \`verify_password\` (salted pbkdf2, constant-time compare), and \`new_api_key\` (returns the key once, stores only its hash). Tomorrow (Day 45) this module gets wired into the real service — write it like production code.`,
      rubric: [
        'Memo chooses an auth mechanism per client with a stated threat it defends against',
        'OAuth2 flow diagram names client, resource owner, authorization server, resource server in the right order',
        'hash_password embeds a random salt; verify_password uses hmac.compare_digest',
        'API keys are stored hashed; the plaintext is only ever returned at creation',
        'pytest suite covers wrong password, tampered hash, and duplicate-password-different-hash',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Encrypting passwords instead of hashing them. Encryption is reversible — a stolen key un-scrambles every password. Hashing has no way back; leaks expose fingerprints, not credentials.',
      'Using fast hashes (SHA-256/MD5) for passwords. They are built for speed; attackers get billions of guesses per second. Use bcrypt/argon2/pbkdf2 with a real work factor.',
      'Treating a JWT as encrypted. The payload is base64url — anyone can read it. The signature prevents tampering, not reading. Never put secrets in claims.',
      'Long-lived JWTs "for convenience." A stolen 30-day token is a 30-day breach with no revocation. Short access tokens + refresh tokens is the standard shape.',
      'Enforcing authorization in the client. Hiding the admin button stops nobody with curl. Every permission check must happen server-side, on every request.',
      'Committing secrets to git "temporarily." Git history is forever; scanners find keys in minutes. Env vars or a secret manager from day one (Day 16 already gave you the config pattern).',
    ],
    quiz: [
      {
        q: 'Why must password hashes be salted?',
        o: [
          'Salt makes the hash longer and harder to store',
          'Salt makes identical passwords hash differently, defeating precomputed tables and bulk cracking',
          'Salt encrypts the password so it can be recovered later',
          'Salt speeds up verification for legitimate users',
        ],
        x: 1,
        w: 'A random per-user salt means attackers cannot use precomputed (rainbow) tables and must attack each user separately — and identical passwords no longer reveal themselves by identical hashes.',
        revisit: 44,
      },
      {
        q: 'Your service must invalidate a specific user\'s access RIGHT NOW. Which design makes this trivially easy?',
        o: [
          'Stateless JWTs with 30-day expiry',
          'Server-side sessions — delete the session record',
          'JWTs with the role claim set to "revoked"',
          'Longer signing keys',
        ],
        x: 1,
        w: 'Sessions keep state server-side, so revocation is deleting a row. A signed JWT stays valid until expiry unless you add a denylist — which reintroduces the server state JWTs tried to avoid.',
        revisit: 44,
      },
      {
        q: 'In the OAuth2 authorization-code flow, why does the app exchange the code for a token on its BACKEND rather than in the browser?',
        o: [
          'Browsers cannot make POST requests',
          'The exchange requires the client secret, which must never reach the browser',
          'It is faster server-to-server',
          'The code is too long for a URL',
        ],
        x: 1,
        w: 'The code alone is useless without the client secret; keeping the exchange server-side means tokens and secrets never transit the user\'s browser, so an intercepted redirect leaks only a one-time code.',
        revisit: 44,
      },
    ],
    resources: [
      { label: 'OWASP Top Ten — web application risks', url: 'https://owasp.org/www-project-top-ten/', type: 'docs', time: '25 min' },
      { label: 'OWASP Cheat Sheet Series — Password Storage & Session Management', url: 'https://cheatsheetseries.owasp.org/', type: 'docs', time: '20 min' },
      { label: 'FastAPI Security tutorial — OAuth2 with JWT', url: 'https://fastapi.tiangolo.com/tutorial/security/', type: 'docs', time: '30 min' },
      { label: 'MDN: HTTP authentication', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (incl. Day 43 TLS)', minutes: 10 },
      { activity: 'ELI5 + tech read: locks vs badges vs guest lists', minutes: 20 },
      { activity: 'Guided: salted hashing + JWT by hand', minutes: 40 },
      { activity: 'Practice: the auth design review', minutes: 20 },
      { activity: 'Project: auth memo + password module', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Both guided labs run; tamper test demonstrably fails verification',
      'Design review finds ≥ 5 flaws with fixes and principles',
      'auth_lib.py committed with passing tests',
      'OAuth2 flow drawn from memory with all four actors',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'TLS from Day 43 secures the wire; today secures identity and permission on top of it. The env-var config discipline from Day 16 is exactly where signing keys and secrets belong, and Day 38 told you where credential tables live.',
      forward: 'Tomorrow (Day 45) you wire auth_lib into the real service. On Day 132 prompt injection attacks the NEW identity problem — an LLM that can be talked into misusing its permissions — and the least-privilege habit you built today is the main defense. Day 159 extends this into production compliance, and Day 169 covers enterprise SSO in the field.',
    },
    flashcards: [
      { f: 'Hashing vs encryption — one line each?', b: 'Hashing: one-way fingerprint, no key, no way back. Encryption: reversible with a key.' },
      { f: 'Why bcrypt/argon2 over SHA-256 for passwords?', b: 'Tunable slowness. Fast hashes allow billions of offline guesses/sec; work factors make each guess expensive.' },
      { f: 'What does a salt defeat?', b: 'Precomputed rainbow tables and crack-once-unlock-many: same password → different hashes per user.' },
      { f: 'JWT payload — secret?', b: 'No. Base64url-encoded, readable by anyone. The signature prevents tampering, not reading.' },
      { f: 'The JWT revocation pitfall?', b: 'Signed tokens stay valid until expiry; instant revocation needs server state (denylist) or short lifetimes + refresh tokens.' },
      { f: 'AuthN vs AuthZ?', b: 'Authentication = who you are (badge). Authorization = what you may do (guest list). Check authZ server-side, every request.' },
    ],
    deepDive: [
      { label: 'The alg:none and key-confusion JWT attacks', note: 'Historic libraries trusted the token\'s own alg header — attackers set "none" or swapped RS256/HS256 to forge tokens. Rule: the server pins the algorithm, never the token.' },
    ],
  },
  {
    id: 'd045', day: 45, week: 7, phase: 2, kind: 'lesson',
    title: 'Web Service Architecture',
    analogy: "The restaurant's back of house",
    objectives: [
      'Restructure a FastAPI app into routes, services, and repositories with clean boundaries',
      'Explain dependency injection and use FastAPI Depends for auth and DB access',
      'Add middleware for request IDs and timing, and consistent problem-detail errors',
      'Implement simple rate limiting and explain where it belongs in the stack',
      'Apply 12-factor config so the same code runs in dev and prod',
    ],
    prereqs: [
      { day: 42, label: 'The API + DB mini-service' },
      { day: 44, label: 'AuthN & AuthZ' },
      { day: 16, label: 'Logging, config & CLI ergonomics' },
    ],
    eli5: `Walk into a good restaurant's back of house and you will not find one heroic cook doing everything. The waiter (routes) takes orders and speaks "menu" to customers — they never touch a pan. The kitchen (service layer) knows the recipes — the business logic — but never talks to diners. The pantry crew (repository layer) fetches ingredients from storage and is the only team that knows which shelf holds what. Between the door and the waiter stand the host and bouncer (middleware): greeting everyone the same way, checking reservations, throwing out troublemakers — before any order is taken.

When a restaurant mixes these jobs — the waiter cooking, the chef running to the cellar — small changes cause chaos: change the menu wording and somehow the soup breaks. Layered services exist for the same reason: each layer speaks only to its neighbors, so you can swap the pantry (SQLite → Postgres), rewrite a recipe (business rule), or retrain the waiters (API version) without the other layers noticing. Today you rebuild your Day 42 service this way and give it a bouncer.`,
    why: `Every LLM backend you will build — the capstone included — is a FastAPI-shaped service: routes receiving chat requests, a service layer orchestrating retrieval and model calls, repositories wrapping the vector store and DB. Teams reject FDE prototype code that tangles these layers because they cannot extend it. Middleware is where production non-negotiables live: request IDs that let you find one user's failing request in a million log lines (the tracing habit Day 142 formalizes), rate limits that stop one customer's retry storm from bankrupting your token budget. This architecture is the difference between a demo and something a customer can run.`,
    tech: `### Layers with one-way dependencies

**Routes** (controllers) parse and validate HTTP, call a service, shape the response — no business logic, no SQL. **Services** hold the domain rules ("a note belongs to its owner; titles are unique per user") and are plain Python, testable without HTTP. **Repositories** encapsulate storage — the only layer that writes SQL — exposing intent-revealing methods (\`get_by_owner\`, \`add\`). Dependencies point one way: routes → services → repos. The payoff is substitution: an in-memory repo makes service tests instant; swapping SQLite for Postgres touches one layer.

### Dependency injection, FastAPI-style

Instead of layers constructing their own dependencies (hard-coding what they need), dependencies are handed in from outside. FastAPI's \`Depends\` does the wiring per request: a \`get_db\` dependency yields a connection; \`get_current_user\` reads the Authorization header, verifies the API key against its hash (yesterday's auth_lib), and returns the user — every protected route just declares it wants a user. Overriding dependencies in tests (\`app.dependency_overrides\`) replaces real auth or storage with fakes — no monkeypatching.

### Middleware and honest errors

Middleware wraps every request: assign a request ID, start a timer, call the next handler, log method/path/status/duration with the ID. Errors deserve the same consistency — one exception handler mapping domain errors to a problem-details JSON shape (\`type\`, \`title\`, \`status\`, \`detail\`) so clients never parse three different error formats. Validation stays at the edge in pydantic models: reject bad input with 422 before it reaches the kitchen.

### Rate limiting, versioning, 12-factor

A token bucket per client is the standard limiter: a bucket holds N tokens, refills at R per second; each request takes one, empty bucket → 429 with \`Retry-After\`. In real deployments the counter lives in Redis so all instances share it (Day 46 explains why the instance itself must stay stateless). Version your API path (\`/v1/notes\`) from the first release — you cannot add versioning gracefully after clients exist. Config follows 12-factor: everything that varies by environment (DB path, signing key, rate limits) comes from env vars; the same image runs in dev and prod with different environments (this becomes literal with Docker on Day 148).`,
    viz: null,
    guided: [
      {
        title: 'Carve the monolith into layers',
        minutes: 25,
        body: `Take your Day 42 notes service (or the reference shape in the starter) and restructure it.

1. Create the package layout: \`app/routes/notes.py\`, \`app/services/notes.py\`, \`app/repos/notes.py\`, \`app/deps.py\`, \`app/main.py\`.
2. Move ALL SQL into the repo class. Its methods speak domain language (\`list_for_owner\`, \`add\`, \`delete\`), not SQL.
3. Move rules into the service: owner checks, title validation. The service raises domain exceptions (\`NotFound\`, \`Forbidden\`) — it has no idea HTTP exists.
4. Routes become thin: parse → call service → return. Wire the repo and current user via \`Depends\`.
5. Prove the payoff: write one service test using an in-memory fake repo — no HTTP, no database, runs in milliseconds.`,
        code: `# app/repos/notes.py — the ONLY file that knows SQL
import sqlite3

class NotesRepo:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def list_for_owner(self, owner_id: int) -> list[dict]:
        rows = self.conn.execute(
            "SELECT id, title, body FROM notes WHERE owner_id = ?",
            (owner_id,)).fetchall()
        return [dict(r) for r in rows]

    def add(self, owner_id: int, title: str, body: str) -> int:
        cur = self.conn.execute(
            "INSERT INTO notes (owner_id, title, body) VALUES (?, ?, ?)",
            (owner_id, title, body))
        self.conn.commit()
        return cur.lastrowid

# app/services/notes.py — rules only, no HTTP, no SQL
class NotFound(Exception): pass
class Forbidden(Exception): pass

class NotesService:
    def __init__(self, repo):
        self.repo = repo

    def create(self, user: dict, title: str, body: str) -> int:
        if not title.strip():
            raise ValueError("title must not be empty")
        return self.repo.add(user["id"], title.strip(), body)

# tests/test_service.py — the layering payoff: no DB needed
class FakeRepo:
    def __init__(self): self.rows = []
    def add(self, owner_id, title, body):
        self.rows.append((owner_id, title, body)); return len(self.rows)

def test_create_strips_title():
    svc = NotesService(FakeRepo())
    assert svc.create({"id": 1}, "  hi  ", "b") == 1`,
      },
      {
        title: 'Middleware: request IDs, timing, honest errors',
        minutes: 15,
        body: `1. Add the middleware from the starter to your app: every request gets a short request ID, is timed, and logged as one structured line.
2. Add the exception handlers: domain \`NotFound\` → 404 problem-details, \`Forbidden\` → 403, \`ValueError\` → 422. Confirm all errors now share one JSON shape.
3. Hit a route with the docs UI, find your request ID in the logs, and confirm the same ID came back in the \`X-Request-ID\` response header — this is how you will correlate a user's bug report to a log line.
4. Trigger each error deliberately and screenshot-or-paste the consistent bodies into your notes.`,
        code: `import logging, time, uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("app")
app = FastAPI()

@app.middleware("http")
async def observe(request: Request, call_next):
    rid = uuid.uuid4().hex[:8]
    request.state.request_id = rid
    t0 = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - t0) * 1000
    log.info("rid=%s %s %s -> %s %.1fms", rid,
             request.method, request.url.path, response.status_code, ms)
    response.headers["X-Request-ID"] = rid
    return response

def problem(status: int, title: str, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={
        "type": "about:blank", "title": title,
        "status": status, "detail": detail})

@app.exception_handler(ValueError)
async def bad_input(request, exc):
    return problem(422, "Invalid input", str(exc))`,
      },
    ],
    practice: [
      {
        title: 'Build a token-bucket rate limiter',
        minutes: 20,
        body: `Implement rate limiting for your service with no library: a token bucket per API key (capacity 10, refill 1 token/second), enforced in middleware or a dependency, returning 429 with a \`Retry-After\` header when empty.

Constraints: pure stdlib; buckets in a module-level dict (note in a comment why this breaks with multiple instances — Day 46 explains, Day 47 fixes it with Redis); a unit test that fires 11 instant requests and asserts the 11th gets 429; a second test that sleeps past a refill and asserts recovery.

Hints (only if stuck): store (tokens, last_refill_time) per key; on each request, first credit elapsed_time × rate up to capacity, then try to spend 1.`,
      },
    ],
    project: {
      title: 'Harden the Day 42 service',
      brief: `Ship v1 of the notes service with today's architecture: layered packages (routes/services/repos), API-key auth using Day 44's auth_lib wired through \`Depends\` (keys stored hashed; a \`POST /v1/keys\` bootstrap route returns a key once), request-ID + timing middleware, problem-details errors, your token-bucket limiter, \`/v1\` path versioning, and all config (DB path, rate limit, admin bootstrap secret) from env vars with sane defaults. Tests: service-layer tests on a fake repo plus TestClient tests proving 401 without a key, 429 over the limit, and consistent error bodies. This service is your template for every API in the program — the capstone (Day 119) starts from this shape.`,
      rubric: [
        'SQL exists only in the repo layer; grep proves it',
        'Protected routes return 401 without a valid key and 200 with one',
        'Rate limiter returns 429 with Retry-After on the 11th instant request',
        'All error responses share the problem-details JSON shape',
        'Service tests run with a fake repo and no HTTP; full suite passes',
        'No secret or environment-specific value is hard-coded (checked against 12-factor)',
      ],
    },
    mistakes: [
      'Putting business logic in routes "because it is short." It never stays short, and logic in routes can only be tested through HTTP. Routes translate; services decide.',
      'Letting SQL leak into services. The repo boundary is what makes storage swappable and service tests fast; one stray query breaks both.',
      'Skipping dependency injection and importing globals directly. Hard-wired dependencies make tests require real databases and real keys; Depends + overrides keep tests honest and fast.',
      'Inventing a new error JSON per endpoint. Clients end up parsing four shapes; one problem-details handler ends it.',
      'Rate limiting inside handlers after work is done. Limit at the edge (middleware/dependency) BEFORE expensive work — the point is protecting the kitchen, not scolding afterwards.',
      'Deferring versioning "until v2." Once clients exist, unversioned paths are permanent contracts. /v1 costs nothing today and saves a migration later.',
    ],
    quiz: [
      {
        q: 'In a layered service, which statement about dependencies is correct?',
        o: [
          'Repositories may call services when convenient',
          'Routes → services → repositories, one direction only',
          'All layers may query the database if they need data',
          'Services should build HTTP responses to save a step',
        ],
        x: 1,
        w: 'Dependencies point one way: routes call services, services call repos. Reverse or skip the arrows and you lose substitutability — the very reason for layering.',
        revisit: 45,
      },
      {
        q: 'What is the main testing benefit of injecting the repository into the service rather than constructing it inside?',
        o: [
          'It makes the code shorter',
          'You can pass a fake repo, so service tests need no database and run instantly',
          'It prevents SQL injection',
          'It encrypts test data',
        ],
        x: 1,
        w: 'Injection means the service does not care which repo it gets — an in-memory fake in tests, SQLite in dev, Postgres in prod. Tests become fast and dependency-free.',
        revisit: 45,
      },
      {
        q: 'A token bucket has capacity 10 and refills 1 token/sec. A client idle for an hour then bursts 15 instant requests. What happens?',
        o: [
          'All 15 succeed because the bucket kept refilling for an hour',
          '10 succeed, 5 are rejected with 429 — the bucket caps at capacity',
          'All are rejected until a fresh minute starts',
          'Exactly 1 succeeds per second',
        ],
        x: 1,
        w: 'Refill is capped at capacity, so an idle hour still leaves at most 10 tokens. Bursts up to capacity are allowed; beyond that, 429 until refill catches up. That burst-tolerance is why token buckets beat fixed windows.',
        revisit: 45,
      },
    ],
    resources: [
      { label: 'FastAPI — Bigger Applications (APIRouter structure)', url: 'https://fastapi.tiangolo.com/tutorial/bigger-applications/', type: 'docs', time: '25 min' },
      { label: 'The Twelve-Factor App', url: 'https://12factor.net/', type: 'docs', time: '25 min' },
      { label: 'FastAPI — Security & Depends', url: 'https://fastapi.tiangolo.com/tutorial/security/', type: 'docs', time: '20 min' },
      { label: 'System Design Primer — application layer', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (auth + networking)', minutes: 10 },
      { activity: 'ELI5 + tech read: back-of-house layering', minutes: 15 },
      { activity: 'Guided: carve the monolith + middleware', minutes: 40 },
      { activity: 'Practice: token-bucket rate limiter', minutes: 20 },
      { activity: 'Project: harden the Day 42 service', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Layered restructure done; service test passes with fake repo',
      'Request IDs visible in logs and response headers',
      'Rate limiter passes both unit tests (11th request 429; refill recovers)',
      'Hardened service committed: auth, versioning, env config, tests green',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 42\'s service grown up: Day 44\'s auth_lib guards the door, Day 16\'s logging and env-config habits fill the middleware and settings, and the repo layer isolates the SQL you learned on Days 36–38.',
      forward: 'Day 46 explains why your limiter\'s in-memory dict breaks the moment you run two instances — statelessness — and Day 47 moves that state to a shared cache. The capstone service (Day 119 onward) starts from today\'s template, and Day 142\'s tracing upgrades your request IDs into full spans.',
    },
    flashcards: [
      { f: 'The three layers and their jobs?', b: 'Routes translate HTTP; services hold business rules; repos own storage/SQL. Dependencies point one way.' },
      { f: 'Why dependency injection?', b: 'Dependencies are handed in, so tests substitute fakes — no real DB or auth needed. FastAPI: Depends + overrides.' },
      { f: 'What belongs in middleware?', b: 'Cross-cutting per-request work: request IDs, timing, logging, auth checks, rate limits — before handlers run.' },
      { f: 'Problem details?', b: 'One consistent error JSON shape (type, title, status, detail) for every failure, via shared exception handlers.' },
      { f: 'Token bucket in one line?', b: 'Bucket of N tokens refilling at R/sec; each request spends one; empty → 429. Allows bursts up to N.' },
      { f: '12-factor config rule?', b: 'Everything environment-specific comes from env vars; same code runs everywhere, config varies.' },
    ],
    deepDive: [
      { label: 'RFC 9457 — Problem Details for HTTP APIs', note: 'The standard behind the error shape you built: media type application/problem+json and the meaning of each field.' },
    ],
  },
  {
    id: 'd046', day: 46, week: 7, phase: 2, kind: 'lesson',
    title: 'Distributed Systems Fundamentals',
    analogy: 'Many kitchens, one restaurant',
    objectives: [
      'Explain why systems distribute (scale, fault tolerance) and what it costs (consistency, complexity)',
      'Distinguish horizontal from vertical scaling and explain why stateless services enable the former',
      'Compare replication and partitioning and say what problem each solves',
      'State the CAP intuition honestly and apply it to a concrete failure',
      'Make any retried operation safe with idempotency keys',
    ],
    prereqs: [
      { day: 45, label: 'Web service architecture & statelessness pressure' },
      { day: 40, label: 'Concurrency & race conditions' },
      { day: 38, label: 'Transactions & ACID' },
    ],
    eli5: `A beloved single-kitchen restaurant hits its limit: one kitchen can only cook so fast, and when the stove breaks, dinner is over for everyone. So the owner opens three kitchens behind one host stand. The host (load balancer) sends each arriving order to whichever kitchen is free. For this to work, no kitchen can keep anything special in its own head — if kitchen A remembers "table 9 wants no onions" and the next course routes to kitchen B, the dish comes out wrong. Every kitchen must read the shared order board (stateless workers, shared state).

Now the recipes: photocopy the master cookbook into every kitchen (replication) and any kitchen can cook anything — but when a recipe changes, for a few minutes some copies are stale (eventual consistency). Or split the menu — kitchen A does starters, B mains, C desserts (partitioning) — no copies to sync, but lose kitchen B and nobody eats a main. And when a waiter is unsure whether kitchen heard "one birthday cake," they repeat the order with the same ticket number, and the kitchen ignores duplicates (idempotency) — otherwise uncertainty produces two cakes.`,
    why: `Every serious AI deployment is distributed on day one: multiple API replicas behind a load balancer, a replicated database, a model provider that is ITSELF a giant distributed system handing you timeouts and 429s. Idempotency is the difference between "retried the charge" and "charged twice" — and LLM clients retry constantly (you will bake retries into your wrapper on Day 107, and agent tool safety on Day 125 leans on idempotent tools). CAP and replication-lag reasoning show up in system design interviews (Day 160) and in real customer conversations: "why did my colleague see the old document?" is an eventual-consistency question.`,
    tech: `### Why distribute, and the two scaling directions

One machine has hard ceilings (CPU, RAM, one power cord) and is a single point of failure. **Vertical scaling** buys a bigger machine — simple, but exponential cost and the ceiling remains. **Horizontal scaling** adds machines — near-linear cost, fault tolerant — but now you have a distributed system: partial failures, lost messages, and no shared clock. A **load balancer** spreads requests across replicas (round-robin or least-connections) and health-checks them, ejecting dead instances; clients see one address.

Horizontal scaling only works if any replica can serve any request — services must be **stateless**: no sessions in process memory, no counters in module dicts (your Day 45 rate limiter!), no files on local disk. State moves to shared stores: the database, a cache (Day 47), object storage.

### Replication vs partitioning

**Replication** copies the same data to several nodes — for read scaling and surviving node loss. Leader-follower is the common shape: writes go to the leader, followers replay them with **replication lag**, so a read from a follower can be stale — *eventual consistency*: stop writing and all replicas converge, but "read your own write" needs care. **Partitioning (sharding)** splits data across nodes — user IDs 1–1M here, 1M–2M there — for write scaling and datasets too big for one machine. Costs: cross-partition queries and hot partitions. Real systems combine both: partitions, each replicated.

### CAP, honestly

When a network **partition** happens (nodes cannot talk — and this WILL happen), you must choose: serve possibly-stale answers (**availability**) or refuse/wait until you are sure (**consistency**). That is the whole theorem — a forced trade during partitions, not a menu of "pick two" databases. Normal operation trades latency vs consistency instead: waiting for all replicas to confirm is slower but safer than confirming after one.

### Idempotency — the retry vaccine

A timeout is ambiguous: the operation may have succeeded after you gave up. Since retries are mandatory in distributed systems, operations must be safe to repeat. An operation is **idempotent** if doing it twice equals doing it once: setting \`status = "paid"\` is; \`balance += 10\` is not. The pattern: the client generates an **idempotency key** per logical operation and sends it on every retry; the server records completed keys and returns the stored result for duplicates instead of re-executing. HTTP hints: GET/PUT/DELETE are specified idempotent; POST is not — which is why payment APIs require idempotency keys on POST.`,
    viz: 'dist-sys',
    guided: [
      {
        title: 'Simulate the duplicate-cake disaster, then fix it',
        minutes: 25,
        body: `1. Run part 1 of the starter: a client calls \`charge()\` over a flaky network that times out 30% of the time AFTER the server already processed. The client retries on timeout. Run 3 times and record how much was over-charged.
2. Read the log: every double-charge is a timeout where the work HAD succeeded. The client cannot know — that is the ambiguity, not a bug in the client.
3. Part 2 adds an idempotency key: the server remembers processed keys and replays the stored result for duplicates. Re-run — balance is now exact every time, despite identical network chaos.
4. In one sentence in your notes: why must the SERVER dedupe rather than the client "retry more carefully"? (The client can never distinguish lost-request from lost-response.)`,
        code: `import random, uuid

random.seed()  # run several times: chaos differs

# --- 1. naive retry over a flaky network -----------------
class Bank:
    def __init__(self): self.balance = 0
    def charge(self, amount):
        self.balance += amount          # work happens...
        if random.random() < 0.3:
            raise TimeoutError          # ...but the ACK is lost

def client_naive(bank, amount, max_tries=4):
    for attempt in range(max_tries):
        try:
            bank.charge(amount); return
        except TimeoutError:
            print(f"  timeout on attempt {attempt+1} -> retrying")

bank = Bank()
for _ in range(5): client_naive(bank, 10)
print(f"charged {bank.balance} (should be 50) "
      f"-> over by {bank.balance - 50}\\n")

# --- 2. idempotency keys: server dedupes ------------------
class SafeBank:
    def __init__(self): self.balance = 0; self.seen = {}
    def charge(self, amount, key):
        if key in self.seen:            # duplicate: replay result
            result = self.seen[key]
        else:
            self.balance += amount
            result = self.seen[key] = "ok"
        if random.random() < 0.3:
            raise TimeoutError          # ACK still flaky!
        return result

def client_safe(bank, amount, max_tries=4):
    key = str(uuid.uuid4())             # ONE key per logical op
    for _ in range(max_tries):
        try:
            return bank.charge(amount, key)
        except TimeoutError:
            pass

safe = SafeBank()
for _ in range(5): client_safe(safe, 10)
print(f"charged {safe.balance} (should be 50) -> exact")`,
      },
      {
        title: 'Replication lag you can watch',
        minutes: 15,
        body: `1. Run the starter: a leader takes writes; two followers apply them with random delay. The client writes a profile update, then immediately reads from a random replica (that is what a load balancer does).
2. Count the stale reads across 20 rounds. This is eventual consistency happening on your screen.
3. Fix "read your own writes" the standard way: after a write, route THAT user's reads to the leader for a few seconds. Implement the two-line change (route by \`recently_wrote\`) and confirm stale reads for the writer drop to zero.
4. Note the trade you just made: the leader now carries extra read load — consistency purchased with capacity.`,
        code: `import random

class Leader:
    def __init__(self): self.data = {}; self.log = []
    def write(self, k, v):
        self.data[k] = v; self.log.append((k, v))

class Follower:
    def __init__(self, leader): self.leader = leader; self.data = {}; self.pos = 0
    def maybe_catch_up(self):
        # applies 0-2 pending log entries per tick: replication lag
        for _ in range(random.randint(0, 2)):
            if self.pos < len(self.leader.log):
                k, v = self.leader.log[self.pos]
                self.data[k] = v; self.pos += 1
    def read(self, k): return self.data.get(k)

leader = Leader()
followers = [Follower(leader), Follower(leader)]
stale = 0
for round_no in range(20):
    leader.write("bio", f"version-{round_no}")
    for f in followers: f.maybe_catch_up()
    replica = random.choice(followers)       # LB picks any replica
    seen = replica.read("bio")
    if seen != f"version-{round_no}":
        stale += 1
        print(f"round {round_no:2d}: STALE read -> {seen}")
print(f"\\n{stale}/20 reads were stale (eventual consistency)")`,
      },
    ],
    practice: [
      {
        title: 'The stateless audit + CAP call',
        minutes: 20,
        body: `Part 1: audit your Day 45 service for horizontal-scale blockers. Find every piece of in-process state (the rate-limiter dict is one — find at least two more candidates: anything cached in module scope, anything written to local disk, any assumption that "the" process sees all requests). For each: where should that state live so two replicas behave as one?

Part 2: your notes service goes multi-region and a partition cuts the regions apart. A user edits a note in region A; their teammate reads it in region B during the partition. Write the CP answer and the AP answer as one honest sentence each, then choose for THIS product and defend in two sentences.

Hints: CP = teammate waits or errors; AP = teammate reads stale. Which failure does a notes app tolerate better?`,
      },
    ],
    project: {
      title: 'Idempotent + stateless upgrade',
      brief: `Two upgrades to your notes service, committed. (1) Idempotency: \`POST /v1/notes\` accepts an \`Idempotency-Key\` header; the server stores completed keys with their response (SQLite table: key, response_json, created_at) and replays the stored response on duplicates. Test: two identical keyed POSTs create ONE note and return identical bodies. (2) Statelessness memo: \`scaling_notes.md\` documenting your stateless audit — every piece of in-process state found, where it must move (shared DB/cache), plus a 6-line ASCII diagram of the target: load balancer → 2 replicas → shared SQLite/cache. End with three sentences on what today's replication-lag demo means for a RAG index that is updated while users query it (Day 118 revisits this as freshness).`,
      rubric: [
        'Duplicate keyed POST provably creates one row and replays the stored response',
        'Missing Idempotency-Key still works (documented as at-most-once NOT guaranteed)',
        'Audit names ≥ 3 pieces of in-process state with a new home for each',
        'CAP paragraph states the forced trade during partitions correctly (not "pick 2 of 3 always")',
        'ASCII target diagram shows LB, replicas, and shared state',
        'Tests pass; committed with a descriptive message',
      ],
    },
    mistakes: [
      'Reading CAP as "pick two, always." The trade is forced only during partitions; in normal operation the real dial is latency vs consistency.',
      'Believing retries are safe because "the request failed." A timeout means UNKNOWN — the work may have completed. Only idempotency makes retries safe.',
      'Making services stateless in theory while a module-level dict quietly holds sessions or counters. Two replicas = two disagreeing dicts. Audit for hidden state.',
      'Treating replication as a backup strategy. Followers replicate deletes and corruption within seconds. Replication is availability; backups are time travel.',
      'Sharding before measuring. Partitioning complicates every query and transaction; a bigger instance, an index (Day 38), or a cache (Day 47) usually buys years first.',
      'Assuming "eventually consistent" means seconds of drift at most. Lag is unbounded under load or partition — design for the stale read, not the happy case.',
    ],
    quiz: [
      {
        q: 'A payment POST times out and the client retries with the same idempotency key. The server had already processed it. What should the server do?',
        o: [
          'Process it again — the client asked twice',
          'Return an error saying "duplicate detected"',
          'Return the stored result of the first execution without re-executing',
          'Queue it for manual review',
        ],
        x: 2,
        w: 'The whole point of the key: duplicates replay the recorded outcome, so the retry is indistinguishable from a slow first success. Erroring would force the client to guess whether the charge happened.',
        revisit: 46,
      },
      {
        q: 'Your service keeps its rate-limit counters in a module-level dict. You scale to 3 replicas behind a load balancer. What happens?',
        o: [
          'Rate limiting keeps working unchanged',
          'Each replica counts separately, so clients get roughly 3× the intended limit',
          'The load balancer merges the dicts',
          'Requests start failing with 500s',
        ],
        x: 1,
        w: 'Each process has its own dict and sees only its share of traffic. Shared state must live in a shared store (e.g. Redis, Day 47) for replicas to act as one — the statelessness rule in action.',
        revisit: 45,
      },
      {
        q: 'Right after updating their profile, a user reloads and sees the OLD version. The likeliest cause in a leader-follower setup?',
        o: [
          'The write was lost',
          'The reload was served by a lagging follower before it replayed the write',
          'The cache certificate expired',
          'CAP forbids reading your own writes',
        ],
        x: 1,
        w: 'Classic replication lag: the write committed on the leader, but the read hit a follower that had not caught up. Fix: route a writer\'s reads to the leader briefly ("read your own writes").',
        revisit: 46,
      },
    ],
    resources: [
      { label: 'System Design Primer — scalability, CAP, replication', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '35 min' },
      { label: 'MIT 6.824 — Distributed Systems (lecture 1)', url: 'https://pdos.csail.mit.edu/6.824/', type: 'course', time: '30 min' },
      { label: 'DDIA references — Designing Data-Intensive Applications ch. 5', url: 'https://github.com/ept/ddia-references', type: 'repo', time: '15 min' },
      { label: 'ByteByteGo — load balancing & idempotency explainers', url: 'https://blog.bytebytego.com/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 43–45)', minutes: 10 },
      { activity: 'ELI5 + tech read + dist-sys visualizer', minutes: 20 },
      { activity: 'Guided: duplicate-cake fix + replication lag', minutes: 40 },
      { activity: 'Practice: stateless audit + CAP call', minutes: 20 },
      { activity: 'Project: idempotency + scaling memo', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Naive-retry over-charge observed and explained; keyed version exact',
      'Replication-lag sim run; read-your-writes fix implemented',
      'Idempotency-Key endpoint passes the duplicate test',
      'scaling_notes.md committed with audit, CAP paragraph, diagram',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The race conditions of Day 40 return at machine scale — retries and replicas instead of threads. Day 38\'s transactions gave you single-node atomicity; today you saw why it does not stretch across the network, and why Day 45\'s in-memory rate limiter cannot survive a second replica.',
      forward: 'Day 47 gives shared state a fast home (Redis) and decouples work with queues. Day 48\'s design method uses today\'s vocabulary in every deep dive, and the Day 49 URL shortener is your first build with these trade-offs. Day 107\'s LLM client retries lean on idempotency; Day 158 turns partial failure into incident practice.',
    },
    flashcards: [
      { f: 'Why must horizontally scaled services be stateless?', b: 'Any replica must serve any request; in-process state makes replicas disagree. State moves to shared stores.' },
      { f: 'Replication vs partitioning?', b: 'Replication copies data (read scale, fault tolerance, adds lag). Partitioning splits data (write scale, size) but complicates queries.' },
      { f: 'CAP in one honest sentence?', b: 'During a network partition you must choose availability (stale answers) or consistency (wait/refuse) — the trade is forced only then.' },
      { f: 'Idempotent operation?', b: 'Doing it twice = doing it once. set x=5 yes; x+=1 no. Prerequisite for safe retries.' },
      { f: 'Why are timeouts ambiguous?', b: 'The work may have succeeded and only the response was lost — client cannot tell. Hence idempotency keys.' },
      { f: 'Read-your-own-writes fix?', b: 'Route the writer\'s reads to the leader (or wait for replica catch-up) briefly after a write.' },
    ],
    deepDive: [
      { label: 'MIT 6.824 lecture 2 — RPC and threads', url: 'https://pdos.csail.mit.edu/6.824/', note: 'The lab-grade version of today\'s toy simulations, in Go. Watch lecture 1–2 if you want the full course flavor.' },
    ],
  },
  {
    id: 'd047', day: 47, week: 7, phase: 2, kind: 'lesson',
    title: 'Caching & Queues',
    analogy: 'The pantry and the ticket rail',
    objectives: [
      'Name the cache layers a request can hit (client, CDN, app, DB) and what each is good for',
      'Implement the cache-aside pattern with TTLs and write-time invalidation',
      'Explain why cache invalidation is hard and choose between TTL, explicit invalidation, and versioned keys',
      'Decouple slow work with a queue and workers, and explain backpressure',
      'Debunk exactly-once delivery and state the real contract: at-least-once + idempotent consumers',
    ],
    prereqs: [
      { day: 46, label: 'Distributed systems — shared state & idempotency' },
      { day: 45, label: 'Web service architecture & the rate-limiter dict' },
      { day: 40, label: 'Concurrency — producers, consumers, races' },
    ],
    eli5: `A busy kitchen survives on two tricks. The first is the **pantry**: instead of driving to the wholesale market for every onion (the database query), the cook grabs one from the pantry shelf (the cache). It is dramatically faster — but the pantry can lie. If the market changed suppliers this morning, the pantry onion is yesterday's truth. So the kitchen makes rules: throw pantry items out after a day (TTL), or, when the market calls with a change, walk over and clear that shelf (invalidation). Deciding which rule, for which shelf, is genuinely the hard part — feed a customer stale data and they notice.

The second trick is the **ticket rail**: when forty orders land at once, the waiter does not stand at the pass waiting for each dish. They clip tickets to the rail (enqueue) and go back to taking orders; cooks pull tickets when free (workers). If the rail fills up, the restaurant stops seating new tables for a moment (backpressure) instead of letting the kitchen drown. And because a ticket can fall and get re-clipped, cooks check the ticket number before firing a dish twice — the idempotency habit from yesterday, now applied to queues.`,
    why: `LLM calls are the slowest, most expensive thing your services will ever do — seconds of latency, real dollars per request. Caching identical requests and queueing slow jobs are the two highest-leverage moves in AI cost engineering: Day 156 will cut your capstone's bill with exact and semantic caching, and every production ingest pipeline (Day 119's document indexing) runs as queued background work, not inside a request handler. Interviewers probe both: "where would you add a cache, and how does it go stale?" and "what happens when the queue backs up?" are standard system-design deep dives (Day 48 and Day 160).`,
    tech: `### Cache layers, one request's journey

A response can be served from the browser's cache (client), an edge CDN, your application's cache, or the database's own buffer pool — each layer closer to the user is faster and staler. App-level caching is where you make decisions: a small in-process dict is fine for one replica, but Day 46 taught you why shared state needs a shared home — which is what **Redis** is: an in-memory key-value server (microsecond reads, TTLs built in, atomic counters) that all replicas share. Your Day 45 rate limiter finally has somewhere correct to live.

### Cache-aside, TTL, and the invalidation problem

The workhorse pattern is **cache-aside**: on read, try the cache; on miss, load from the DB and write the value into the cache with a TTL; on data change, either **delete** the affected key (next read repopulates) or let the TTL expire it. TTL is simple and self-healing but serves stale data up to its full length; explicit invalidation is fresh but you must find every key a write affects — miss one and you serve lies indefinitely. A third option sidesteps deletion: **versioned keys** (include an updated-at or version in the key), where new writes naturally produce new keys and old entries age out. Metrics matter: a cache is judged by hit rate and by what its staleness costs the business — cache aggressively what is expensive and tolerant (rendered docs, model responses for identical prompts), carefully what is cheap or intolerant (balances, permissions — Day 44's guest lists should not be stale).

### Queues, workers, backpressure

A **message queue** decouples producers from consumers: the API handler enqueues a job description and returns immediately; worker processes pull jobs at their own pace. This absorbs bursts, isolates failures (a crashing worker does not 500 the API), and lets you scale workers independently. A **bounded** queue is a feature, not a limitation: when it fills, producers block or shed load — **backpressure** — which is how the system says "slow down" instead of running out of memory.

### The exactly-once myth

Delivery guarantees come in three flavors: at-most-once (fire and forget — jobs can vanish), at-least-once (redeliver until acknowledged — jobs can repeat), and exactly-once, which for delivery across an unreliable network is a myth: the ack can always be lost after processing, forcing redelivery (Day 46's ambiguous timeout, again). Real systems are at-least-once with **idempotent consumers** — the effect happens exactly once even when delivery does not. Same vaccine, new patient.`,
    viz: 'cache-flow',
    guided: [
      {
        title: 'Cache-aside from scratch — speed, staleness, invalidation',
        minutes: 25,
        body: `1. Run part 1 of the starter: a fake "database" query takes 200 ms. The cache-aside wrapper serves repeats from a dict with a TTL. Record the timings: first call vs the next ten.
2. Compute the hit rate and average latency for the 11-call sequence. This ratio is the whole business case for caching.
3. Part 2 demonstrates the lie: update the database directly, read again within TTL — you get the OLD value. Say out loud why: the cache has no idea the DB changed.
4. Fix it two ways: (a) call \`invalidate(key)\` inside the update function; (b) drop invalidation and shorten the TTL to 2 s. Note the trade-off in your notes — freshness by bookkeeping vs freshness by patience.
5. Kill the process and restart. The cache is empty (cold start) — every entry is a miss until it re-warms. This is why deploys briefly spike DB load.`,
        code: `import time

DB = {"note:1": "v1 of the note"}

def db_read(key):
    time.sleep(0.2)                    # the expensive trip to the market
    return DB[key]

cache = {}                             # key -> (value, expires_at)
TTL = 30.0

def get(key):
    hit = cache.get(key)
    if hit and hit[1] > time.time():
        return hit[0], "HIT"
    value = db_read(key)               # miss: go to the DB...
    cache[key] = (value, time.time() + TTL)   # ...and fill the cache
    return value, "MISS"

def invalidate(key):
    cache.pop(key, None)

# --- 1. the speedup
for i in range(11):
    t0 = time.perf_counter()
    value, status = get("note:1")
    ms = (time.perf_counter() - t0) * 1000
    print(f"call {i:2d}: {status:4s} {ms:6.1f} ms")

# --- 2. the lie: DB changes, cache does not notice
DB["note:1"] = "v2 EDITED"
print("after edit, cache serves:", get("note:1")[0])   # still v1!

# --- 3a. explicit invalidation fixes it
invalidate("note:1")
print("after invalidate:", get("note:1")[0])            # v2`,
      },
      {
        title: 'A queue, two workers, and backpressure you can feel',
        minutes: 15,
        body: `1. Run the starter: a producer enqueues 20 jobs fast; two worker threads each take ~0.3 s per job. Watch jobs interleave across workers — this is horizontal scaling of work.
2. The queue is bounded at 5. Watch the producer log: once the queue fills, \`put()\` blocks until a worker frees a slot. That pause IS backpressure — the system self-throttles instead of buffering unboundedly.
3. Set the bound to 1000 and re-run: the producer finishes instantly, and all the waiting moves into the queue. Question for your notes: which behavior do you want when the producer is an HTTP handler with a customer waiting?
4. Simulate a crash: make a worker raise on job 7 without acking. Re-queue it in the except block and confirm another worker picks it up — at-least-once in eight lines.`,
        code: `import queue, threading, time

jobs = queue.Queue(maxsize=5)          # bounded: the ticket rail has finite clips

def worker(name):
    while True:
        job = jobs.get()
        if job is None:
            break
        time.sleep(0.3)                # slow work (imagine: an LLM call)
        print(f"  {name} finished job {job}")
        jobs.task_done()

threads = [threading.Thread(target=worker, args=(f"w{i}",)) for i in (1, 2)]
for t in threads: t.start()

t0 = time.perf_counter()
for i in range(20):
    jobs.put(i)                        # blocks when the rail is full!
    print(f"produced {i:2d} at {time.perf_counter()-t0:5.2f}s "
          f"(queue size {jobs.qsize()})")

jobs.join()
for _ in threads: jobs.put(None)
for t in threads: t.join()
print(f"all done in {time.perf_counter()-t0:.1f}s")`,
      },
    ],
    practice: [
      {
        title: 'Design the cache policy',
        minutes: 20,
        body: `For your notes service, decide a caching policy for four data shapes: (a) \`GET /v1/notes\` list per user; (b) a single note body; (c) the API-key → user lookup that runs on EVERY request; (d) the rate-limit counters.

Your goal, per item: cache or not; where (in-process vs shared Redis-style); TTL length; invalidation strategy (TTL-only, explicit delete on write, or versioned key); and one sentence on what staleness costs if you get it wrong.

Hints (only if stuck): (c) is hot, small, and must reflect key revocation fast — short TTL or explicit invalidation on revoke; (d) is not a cache at all — it is shared STATE and must not be evictable the same way; losing it resets limits.`,
      },
    ],
    project: {
      title: 'Cache + worker upgrade for the notes service',
      brief: `Two upgrades, committed with tests. (1) Cache-aside on \`GET /v1/notes/{id}\`: an in-process TTL cache module (dict-based, like the guided lab — note in a docstring why multi-replica needs Redis, per Day 46), with explicit invalidation in the update and delete paths. Tests: a repeated read hits the cache (count db calls with a spy repo); an update then read returns the NEW body. (2) A background export worker: \`POST /v1/notes/{id}/export\` enqueues a job (bounded \`queue.Queue\`, worker thread writes a text file to an exports dir) and returns 202 with a job id; jobs table or dict tracks status; the worker is idempotent — re-delivering the same job id does not produce a duplicate file. Finish \`caching_notes.md\` with your practice-policy table plus three sentences on semantic caching for LLM responses (preview of Day 156).`,
      rubric: [
        'Spy-repo test proves the second read skips the database',
        'Update path invalidates: read-after-write returns fresh data',
        'Export endpoint returns 202 immediately; work happens on the worker thread',
        'Re-enqueueing a completed job id is a no-op (idempotent consumer)',
        'Policy table covers all four data shapes with TTL + invalidation choices justified',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Caching without an invalidation story. "We will add a TTL later" means serving stale data in prod. Decide staleness tolerance per key BEFORE caching, not after the bug report.',
      'Confusing a cache with a store. Caches are evictable by design — anything you cannot afford to lose (rate counters, sessions, job state) needs a store with persistence guarantees, even if the same tool (Redis) can play both roles.',
      'Caching inside a single process and calling it shared. Two replicas, two dicts, two truths — Day 46 again. Shared cache or per-replica staleness, choose knowingly.',
      'Unbounded queues "so producers never block." The queue becomes a memory leak with a delay; the system fails later and worse. Bound it and let backpressure do its job.',
      'Believing a framework that advertises exactly-once delivery. Read the fine print: it is at-least-once delivery plus deduplication (idempotency) at the consumer. You still have to build the consumer side.',
      'Running slow work in the request handler "because it is only 2 seconds." At 50 concurrent users that is a pile-up of blocked connections. Enqueue, return 202, let workers grind.',
    ],
    quiz: [
      {
        q: 'In cache-aside, what happens on a cache miss?',
        o: [
          'The request fails and the client retries',
          'The application loads from the database, writes the value into the cache, and returns it',
          'The database pushes the value to the cache automatically',
          'The cache asks a peer cache before giving up',
        ],
        x: 1,
        w: 'Cache-aside puts the application in charge: try cache, on miss read the DB, populate the cache (with a TTL), return. The DB never knows the cache exists.',
        revisit: 47,
      },
      {
        q: 'Why is exactly-once DELIVERY considered a myth over a network?',
        o: [
          'Networks are too slow for it',
          'The acknowledgement can be lost after processing, so the sender must redeliver — the consumer may see the message twice',
          'Queues cannot store messages durably',
          'It is patented',
        ],
        x: 1,
        w: 'The Day 46 ambiguity again: if the ack is lost, the sender cannot know the message was processed and must redeliver. The achievable contract is at-least-once delivery + idempotent processing = exactly-once EFFECT.',
        revisit: 46,
      },
      {
        q: 'Your bounded job queue is full and the producer blocks. What is this behavior called, and is it a bug?',
        o: [
          'Deadlock — a bug, increase the queue size to infinity',
          'Backpressure — a feature: the system self-throttles instead of buffering until it runs out of memory',
          'Starvation — a bug in the scheduler',
          'Thrashing — restart the workers',
        ],
        x: 1,
        w: 'A full bounded queue pushing back on producers is backpressure — the mechanism that keeps overload visible and survivable. An unbounded queue just hides the same overload until memory dies.',
        revisit: 47,
      },
    ],
    resources: [
      { label: 'System Design Primer — caching & asynchronism sections', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '30 min' },
      { label: 'ByteByteGo — caching strategies & message queue explainers', url: 'https://blog.bytebytego.com/', type: 'article', time: '20 min' },
      { label: 'DDIA references — ch. 8 (trouble with distributed systems) & ch. 11 (stream processing)', url: 'https://github.com/ept/ddia-references', type: 'repo', time: '15 min' },
      { label: 'CMU 15-445 — buffer pools: the database\'s own cache', url: 'https://15445.courses.cs.cmu.edu/', type: 'course', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 43–46)', minutes: 10 },
      { activity: 'ELI5 + tech read + cache-flow visualizer', minutes: 20 },
      { activity: 'Guided: cache-aside lab + queue & backpressure', minutes: 40 },
      { activity: 'Practice: design the cache policy', minutes: 20 },
      { activity: 'Project: cache + worker upgrade', minutes: 25 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Cache-aside lab run: hit-rate speedup measured, staleness demonstrated and fixed both ways',
      'Backpressure observed with the bounded queue; crash-requeue experiment done',
      'Cache policy table complete for all four data shapes',
      'Notes service upgrade committed with passing spy-repo and idempotent-worker tests',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 46 is everywhere today: the cache is shared state done deliberately, at-least-once redelivery is the ambiguous timeout, and idempotent consumers are idempotency keys wearing a hard hat. The producer/consumer threads are Day 40\'s concurrency, now with a purpose.',
      forward: 'Tomorrow\'s design method (Day 48) treats "add a cache" and "add a queue" as standard moves you can now justify, and Day 49\'s URL shortener uses cache-aside for hot links. Day 122 caches conversation context, and Day 156 brings the big payoff: exact + semantic caching to cut LLM cost, with prompt-prefix caching as the provider-side version.',
    },
    flashcards: [
      { f: 'Cache-aside in three steps?', b: 'Read: try cache → on miss read DB → populate cache with TTL. Writes delete/refresh the key.' },
      { f: 'TTL vs explicit invalidation?', b: 'TTL: simple, self-healing, stale up to TTL. Explicit: fresh, but you must find every affected key.' },
      { f: 'What is backpressure?', b: 'A full bounded queue blocks/rejects producers so overload stays visible — instead of buffering until memory dies.' },
      { f: 'Why is exactly-once delivery a myth?', b: 'Lost acks force redelivery. Real contract: at-least-once delivery + idempotent consumer = exactly-once effect.' },
      { f: 'Cache vs store?', b: 'Cache = evictable copy for speed. Store = source of truth. Rate counters and job state are state, not cache.' },
      { f: 'Why queue slow work instead of doing it in the handler?', b: 'Return 202 fast, absorb bursts, isolate failures, scale workers independently.' },
    ],
    deepDive: [
      { label: 'Thundering herd & cache stampedes', note: 'When a hot key expires, hundreds of requests miss simultaneously and hammer the DB. Mitigations: per-key locks, probabilistic early refresh, jittered TTLs. You will meet this in production someday — recognize it.' },
    ],
  },
  {
    id: 'd048', day: 48, week: 7, phase: 2, kind: 'lesson',
    title: 'System Design Method',
    analogy: "The architect's rehearsal",
    objectives: [
      'Run the 7-step design method: requirements → capacity → API → data model → high-level design → deep dives → trade-offs',
      'Estimate QPS, storage, and bandwidth from user counts using round numbers',
      'Design a pastebin end-to-end and defend each choice against an alternative',
      'Turn every component choice into an explicit trade-off sentence',
      'Recognize the standard moves: LB + stateless replicas, cache, queue, replicate, partition',
    ],
    prereqs: [
      { day: 46, label: 'Distributed systems vocabulary' },
      { day: 47, label: 'Caching & queues — the standard moves' },
      { day: 38, label: 'Indexes & database internals' },
    ],
    eli5: `Watch an architect handle a client who says "design me a house." The amateur starts sketching bedrooms immediately. The professional asks questions first: How many people? Do you cook? What is the budget? (requirements). Then they do envelope math on a napkin — four people, three bedrooms, roughly 200 square meters, which rules out this plot and that budget (capacity estimation). Only then do they draw: first the doors and windows the family will actually touch (the API), then the room list (the data model), then the floor plan showing how rooms connect (high-level design). Finally they zoom into the two rooms that are genuinely hard — the kitchen plumbing, the load-bearing wall (deep dives) — and present honestly: "a bigger kitchen means a smaller garage; here is why I chose the kitchen" (trade-offs).

System design interviews — and real architecture work — reward exactly this rehearsed order. The order is the skill: requirements before boxes, numbers before choices, hard parts last so you spend depth where it matters. Skip a step and you are the amateur sketching bedrooms for a family you never met.`,
    why: `The AI-system-design round is now standard in AI engineer and FDE interviews (Day 160 is a full day on it), and it is this method applied to LLM systems: "design a support copilot" is requirements → capacity (tokens, not just QPS) → API → data model (vectors + rows) → design → deep dives on retrieval and cost. In the field, the same method is how you turn a customer's "we want an assistant" into a proposal (Day 165) — asking the requirements questions IS the discovery meeting. Engineers who estimate out loud with round numbers earn trust in rooms where hand-waving loses deals.`,
    tech: `### The seven steps, and what each produces

**1. Requirements (3–5 min).** Functional: what must it do (paste text, get a link, links expire)? Non-functional: scale (how many users?), latency targets, availability, consistency needs, cost ceiling. Ask; never assume. Write down what is explicitly OUT of scope.

**2. Capacity envelope.** Round numbers only. Useful constants: a day is ~86,400 s ≈ 10⁵ s; so 1M writes/day ≈ 10 writes/s average — then multiply by 2–3 for peak. Estimate QPS (reads and writes separately — the read:write ratio drives the design), storage (items/day × size × retention), and bandwidth. The point is not precision; it is discovering which problems you actually have. 12 writes/s means a single Postgres is fine; 12,000 means partitioning talk.

**3. API.** A handful of endpoints with verbs, paths, and payloads — the contract everything else serves. Day 41's HTTP semantics and Day 45's versioning apply.

**4. Data model.** Tables/keys, the fields that matter, and which lookups must be fast — which is an index conversation (Day 38).

**5. High-level design.** The boxes-and-arrows: client → load balancer → stateless API replicas → database, with a cache and a queue where steps 1–2 justified them. Draw the read path and the write path separately.

**6. Deep dives (the differentiator).** Pick the 1–2 genuinely hard parts and go deep. For pastebin: ID generation (random 8-char base62 — check-and-retry on collision vs a counter — predictable, needs coordination) and expiry (lazy delete on read + a nightly sweep beats a per-paste timer). For other systems: the feed fanout, the hot partition, the cache invalidation.

**7. Trade-offs, out loud.** Every choice sacrificed something. "I chose eventual consistency on reads for availability; a user may see a paste ~1 s late, which is acceptable for this product" is a complete sentence of engineering. Interviewers and customers both listen for it.

### Worked capacity example — pastebin

10M pastes/month ≈ 10⁷ / (30 × 10⁵) ≈ 4 writes/s (say 10 at peak). Read:write of 10:1 → ~100 reads/s. Average paste 10 KB → 10⁷ × 10 KB = 100 GB/month, ~1.2 TB/year: one database with replication, no sharding needed — the numbers just told you. 100 reads/s of hot pastes → a cache-aside layer (Day 47) absorbs most of it, since pastes are immutable after creation (invalidation is trivial — the best kind of cache).`,
    viz: 'sys-design',
    guided: [
      {
        title: 'Design pastebin with the method — full walkthrough',
        minutes: 30,
        body: `Work through all seven steps on paper or in \`pastebin_design.md\`, timing each step. Do NOT read ahead to a solution — the rehearsal is the point.

1. **Requirements (5 min):** write 4 functional (create paste → short URL; read by URL; optional expiry; size limit 1 MB) and 4 non-functional (10M pastes/month; read-heavy; p99 read < 200 ms; pastes immutable).
2. **Capacity (5 min):** compute write QPS, read QPS at 10:1, storage/year at 10 KB average. Round aggressively; write the arithmetic down.
3. **API (3 min):** three endpoints with methods, paths, request/response shapes. Note which are idempotent (Day 46).
4. **Data model (4 min):** the pastes table: id (base62 key), content, created_at, expires_at. Which column needs an index and why?
5. **High-level (5 min):** ASCII diagram — client → LB → 2 API replicas → cache → DB (leader + follower). Draw read and write paths as separate arrows.
6. **Deep dive (5 min):** ID generation. Compare: (a) random 8-char base62 with collision check-and-retry; (b) auto-increment counter encoded base62. For each: predictability, coordination cost, collision math (62⁸ ≈ 2×10¹⁴ keys — at 10⁷ pastes, collision odds per insert?).
7. **Trade-offs (3 min):** write three sentences of the form "I chose X over Y, accepting Z."`,
      },
      {
        title: 'The estimation gym',
        minutes: 15,
        body: `Round-number drills — do them in your head first, then check with the starter script. Speed matters more than precision; get within 2× and move on.

1. 50M DAU, each making 20 requests/day. Average QPS? Peak (×3)?
2. Each request logs 500 bytes. Log volume per day? Per year?
3. A tweet is ~300 bytes of text + metadata. Storage for 500M tweets/day for 5 years?
4. Your LLM feature: 10k users/day, 5 conversations each, 8 calls per conversation, 2,000 tokens per call. Tokens/day? At $3 per million tokens, cost/day?
5. Write your own cheat-sheet constants at the bottom: seconds/day ≈ 10⁵, KB→GB is 10⁶, "million per day ≈ 12/s".`,
        code: `# estimation_check.py — verify your mental math
DAY = 86_400                     # ~1e5 seconds

# 1. QPS
qps = 50e6 * 20 / DAY
print(f"1. avg QPS ~ {qps:,.0f}   peak ~ {qps*3:,.0f}")

# 2. log volume
per_day = 50e6 * 20 * 500        # bytes
print(f"2. logs/day ~ {per_day/1e12:.1f} TB   /year ~ {per_day*365/1e15:.1f} PB")

# 3. tweets
tweets = 500e6 * 300 * 365 * 5
print(f"3. 5 years of tweets ~ {tweets/1e15:.1f} PB (text only!)")

# 4. LLM cost envelope
tokens = 10_000 * 5 * 8 * 2_000
cost = tokens / 1e6 * 3
print(f"4. tokens/day ~ {tokens/1e9:.1f}B -> ~USD {cost:,.0f}/day")

# The lesson of #4: token math IS capacity planning for AI systems.`,
      },
    ],
    practice: [
      {
        title: 'Solo design: an image-hosting service',
        minutes: 25,
        body: `Run the full method, alone and timed (25 min), on: "design an image-hosting service" (upload an image → get a link; 1M uploads/day; average 2 MB; read-heavy 20:1; images immutable).

Deliverable: \`image_host_design.md\` with all seven sections. Requirements you must discover yourself: where do big binary blobs live (hint: NOT in database rows — object storage + DB metadata is the standard split), and what serves the read traffic (hint: immutable + read-heavy is the perfect CDN/cache story).

Hints (only after finishing): storage is ~2 TB/day — this changes which component dominates the design; the deep dive worth doing is thumbnail generation, which is slow work arriving in bursts… which is exactly what Day 47's queues are for.`,
      },
    ],
    project: {
      title: 'Your design method template + cheat sheet',
      brief: `Create two durable artifacts in your practice repo. (1) \`design_method.md\`: the seven steps as a reusable template — each step gets its timebox, the questions to ask, and a "standard moves" list (LB + stateless replicas, cache-aside, queue + workers, replicate for reads, partition for writes, index for lookups) with a one-line "reach for this when…" per move. (2) \`estimation_cheatsheet.md\`: your constants (seconds/day, powers of ten, base62 keyspace, bytes per char/int/UUID), the QPS-from-DAU recipe, the storage recipe, and — because you are an AI engineer — the token-cost recipe from the estimation gym. Tomorrow you will run this exact template against the URL shortener, and on Day 160 against three AI systems; make it something future-you can execute under interview pressure.`,
      rubric: [
        'Template lists all seven steps with timeboxes and per-step prompt questions',
        'Standard-moves table maps each move to the symptom that justifies it',
        'Cheat sheet contains at least 8 constants/recipes including the token-cost recipe',
        'Pastebin walkthrough committed with capacity arithmetic shown, not just answers',
        'Image-host design committed with the object-storage split and a queue in the right place',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Drawing boxes before asking questions. Requirements change everything — a pastebin for 1k users and one for 100M users share a name, not a design. Interviewers dock the skipped step, not the wrong QPS.',
      'Estimating to three significant figures. 86,400 is 10⁵; 4.63 writes/s is "about 5." Precision theater wastes time and signals inexperience — round numbers, stated as round.',
      'Designing for read QPS when write QPS is the constraint (or vice versa). Always split the two; the ratio picks between replication (read-heavy) and partitioning (write-heavy).',
      'Adding components without a number that justifies them. "We will add Kafka" — for 4 writes/s? Every box must be paid for by a requirement or an estimate.',
      'Deep-diving the easy part. Ten minutes on the pastes table, zero on ID collisions or expiry. Spend depth where the difficulty is — that is the differentiating step.',
      'Presenting choices without their costs. "We use eventual consistency" is half a sentence. Finish it: "…accepting up to ~1 s stale reads, acceptable because pastes are immutable."',
    ],
    quiz: [
      {
        q: 'A service gets 2M writes/day. Roughly what average write QPS should you design around?',
        o: ['2,000/s', '~23/s — call it 25, and plan peak at 2–3×', '200/s', '0.2/s'],
        x: 1,
        w: 'A day is ~86,400 ≈ 10⁵ seconds, so 2×10⁶ / 10⁵ ≈ 23/s. Round it, then multiply by 2–3 for peak. This one constant (day ≈ 10⁵ s) does most estimation work.',
        revisit: 48,
      },
      {
        q: 'Your design is read-heavy 50:1 and items are immutable after creation. Which pair of moves does this profile practically beg for?',
        o: [
          'Sharding and two-phase commit',
          'Cache-aside + read replicas — and invalidation is trivial because items never change',
          'A message queue for reads',
          'Vertical scaling only',
        ],
        x: 1,
        w: 'Read-heavy → replicate reads and cache hot items; immutable → cached copies can never go stale, removing the hardest cache problem. Recognizing this profile instantly is what the standard moves are for.',
        revisit: 47,
      },
      {
        q: 'In the method, why do deep dives come AFTER the high-level design rather than first?',
        o: [
          'They are optional filler',
          'You need the whole system sketched to know which 1–2 parts are genuinely hard and worth the remaining depth',
          'Interviewers forbid discussing details early',
          'Deep dives only cover databases',
        ],
        x: 1,
        w: 'The high-level pass reveals where the difficulty concentrates (ID collisions, hot keys, fanout). Diving before that risks spending twenty minutes on a part that turns out trivial — the amateur sketching bedrooms.',
        revisit: 48,
      },
    ],
    resources: [
      { label: 'System Design Primer — the study guide & how-to-approach section', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '35 min' },
      { label: 'ByteByteGo — worked system design case studies', url: 'https://blog.bytebytego.com/', type: 'article', time: '20 min' },
      { label: 'Tech Interview Handbook — system design primer section', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 43–47)', minutes: 10 },
      { activity: 'ELI5 + tech read: the seven steps', minutes: 15 },
      { activity: 'Guided: pastebin walkthrough + estimation gym', minutes: 45 },
      { activity: 'Practice: solo image-host design (timed)', minutes: 25 },
      { activity: 'Project: method template + cheat sheet', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Pastebin design complete with all seven sections and shown arithmetic',
      'Estimation gym answers within 2× before checking',
      'Timed image-host design done solo in ≤ 25 min',
      'Template + cheat sheet committed for reuse tomorrow',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every step reuses this week: the API step is Day 41/45, the data-model step is Days 36–38, the standard moves are Day 46 (replicate, partition, stateless) and Day 47 (cache, queue). The method just sequences what you already know.',
      forward: 'Tomorrow you run this template for real: design THEN build the URL shortener. Day 160 is this method under AI constraints — token budgets join QPS in the capacity envelope, exactly like the estimation gym\'s question 4 — and Day 165 turns the same skeleton into customer-facing proposals.',
    },
    flashcards: [
      { f: 'The seven design steps, in order?', b: 'Requirements → capacity → API → data model → high-level design → deep dives → trade-offs.' },
      { f: 'Seconds in a day (estimation constant)?', b: '~86,400 ≈ 10⁵. So 1M/day ≈ 12/s average; multiply 2–3× for peak.' },
      { f: 'What does the read:write ratio decide?', b: 'Read-heavy → replicas + cache. Write-heavy → partitioning talk. Always estimate them separately.' },
      { f: 'What makes a deep dive "the right" one?', b: 'The 1–2 genuinely hard parts revealed by the high-level pass (ID collisions, hot keys, fanout) — not the easy tables.' },
      { f: 'A complete trade-off sentence?', b: '"I chose X over Y, accepting cost Z, because requirement R." All four parts, out loud.' },
      { f: 'Capacity envelope for AI systems adds…?', b: 'Token math: calls × tokens/call × price/token. Cost per day is a first-class design number.' },
    ],
    deepDive: [
      { label: 'Back-of-the-envelope numbers every engineer should know', note: 'Jeff Dean\'s classic latency table (L1 ~0.5 ns, RAM ~100 ns, SSD ~100 µs, same-DC round trip ~0.5 ms, cross-continent ~150 ms). Find a current version and staple it to your cheat sheet — Day 43\'s measurements gave you the network rows empirically.' },
      { label: 'CMU 15-445 / MIT 6.824 as the long game', url: 'https://15445.courses.cs.cmu.edu/', note: 'The two university courses behind this week. Not for now — bookmark for the months after Day 180.' },
    ],
  },
  {
    id: 'd049', day: 49, week: 7, phase: 2, kind: 'review',
    title: 'Week 7 Checkpoint: Design & Build a URL Shortener',
    analogy: 'First system design',
    objectives: [
      'Recall the week\'s core ideas from memory: TLS, auth, layering, statelessness, caching, the design method',
      'Produce a one-page design doc (capacity, API, schema, cache strategy) before writing code',
      'Build a working URL shortener: FastAPI + SQLite + cache-aside + tests',
      'Write the trade-offs section the way you would answer it in an interview',
    ],
    prereqs: [
      { day: 43, label: 'Networking & HTTPS' },
      { day: 45, label: 'Layered service architecture' },
      { day: 47, label: 'Cache-aside & invalidation' },
      { day: 48, label: 'The system design method' },
    ],
    eli5: `Today nothing new walks in the door — and that is the point. This week you collected six tools: the network layer cake (Day 43), locks and badges (44), the layered kitchen (45), many kitchens (46), the pantry and ticket rail (47), and the architect's rehearsal (48). A checkpoint day forges them into one object you can point at: a URL shortener you designed on paper first and then actually built.

Why review this way? Your brain treats retrieval as a signal of importance: every fact you successfully drag out of memory — without peeking — gets its forgetting curve reset and flattened. Re-reading feels productive but leaves no such trace; that is why today starts with closed-book recall drills before any building. And why a URL shortener? Because it is the "scales practice" of system design: small enough to finish in an afternoon, real enough to need everything — an API contract, a schema with the right index, a cache with an invalidation story, and honest trade-offs. Every senior engineer has designed one; today you join them.`,
    why: `Interviews love the URL shortener precisely because it exposes whether you reason or recite: base62 math, read-heavy caching, and redirect semantics (301 vs 302) are all decision points with defensible alternatives. Having BUILT one — not just watched a video about one — changes how you talk about it forever; "in my implementation, cache-aside cut redirect latency 40×" beats any memorized diagram. This is also your first complete run of the design-then-build loop that the capstone (Day 119) and every FDE prototype (Day 166) will follow: paper first, code second, trade-offs written down.`,
    tech: `### What to recall, and why recall beats re-reading

Spaced repetition works because memory strengthens on effortful retrieval, not on exposure. Today's drills target the week's load-bearing ideas at the edge of forgetting: the HTTPS phase sequence and what each phase costs (43), hashing vs encryption and the JWT revocation trap (44), one-way layer dependencies and why DI makes tests fast (45), statelessness / idempotency / CAP-under-partition (46), cache-aside and the exactly-once myth (47), and the seven design steps (48). Anything you cannot reproduce closed-book goes on today's revisit list — the quiz's revisit pointers send you to the exact day.

### The checkpoint build, shaped by the method

Run Day 48's template for real. Requirements: shorten a URL → 7-char code; redirect fast; codes never change once issued; assume read-heavy (100:1). Capacity: even 1M new links/day is ~12 writes/s — SQLite is fine here, and saying WHY it is fine is part of the deliverable. API: \`POST /v1/links\` (idempotent via Idempotency-Key — Day 46 pays off), \`GET /{code}\` → redirect, \`GET /v1/links/{code}/stats\`. Schema: links(code TEXT PRIMARY KEY, long_url, created_at, hits) — the primary key IS the index that makes redirects O(log n) (Day 38). Deep dives: code generation (random base62 check-and-retry vs counter — do the collision math for your scale) and the redirect status choice: 301 (permanent, browsers cache it — fastest, but you lose hit counts) vs 302/307 (every click reaches your server — countable, slower). That choice is a genuine product trade-off with no universally right answer: pick per requirement.

### Where the cache goes

Redirects are the hot path and links are immutable → cache-aside on code → long_url lookups is the textbook case: no invalidation problem exists (Day 47's hardest problem, deleted by a requirement). Stats increments stay in the database — counters are state, not cache.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book recall drills',
        minutes: 25,
        body: `Editor closed, notes closed. Write from memory, THEN diff against the week's notes and score yourself (per item: solid / shaky / gone).

1. **Day 43:** list the phases of one HTTPS request in order, with what each costs. Then: latency or bandwidth — which dominates small API calls, and why?
2. **Day 44:** hashing vs encryption in two lines; why salt; why bcrypt over SHA-256; the JWT revocation pitfall and its standard mitigation.
3. **Day 45:** draw the three layers with arrow directions; what belongs in middleware; the token-bucket rule in one line.
4. **Day 46:** define idempotent; why timeouts are ambiguous; CAP in one honest sentence.
5. **Day 47:** cache-aside's three steps; TTL vs explicit invalidation trade; why exactly-once delivery is a myth.
6. **Day 48:** the seven steps in order; the seconds-per-day constant; QPS for 5M requests/day (do it in your head).

Everything scored "shaky" or "gone" → add to today's revisit list and re-read only those sections.`,
      },
      {
        title: 'Design doc sprint (paper before code)',
        minutes: 20,
        body: `Using your Day 48 template, produce \`shortener_design.md\` in 20 timed minutes. No code yet.

1. Requirements: 4 functional, 4 non-functional (state your assumed scale and read:write ratio).
2. Capacity: write QPS, read QPS, storage/year at ~200 bytes/link. Conclude explicitly whether SQLite suffices and why.
3. API: the three endpoints with request/response shapes; mark which are idempotent and how.
4. Schema: the links table; name the index and what query it serves.
5. High-level ASCII diagram: client → API → cache → DB, read and write paths drawn separately.
6. Deep dive: base62 code generation — with 62⁷ ≈ 3.5×10¹² codes and your scale, estimate collision probability per insert and justify check-and-retry.
7. Trade-offs: three complete sentences, including your 301-vs-302 decision tied to the stats requirement.`,
      },
    ],
    practice: [
      {
        title: 'Interview answer rehearsal',
        minutes: 10,
        body: `Set a 7-minute timer. Out loud (really out loud), walk the shortener design as if an interviewer asked "design bit.ly" — following your doc but not reading it. Cover all seven steps; land the 301/302 trade-off and the "why SQLite is fine at this scale" argument.

Goal: no step skipped, no number invented mid-sentence, trade-offs stated in the X-over-Y-accepting-Z form. If you stall anywhere, that section of the design doc was not really yours yet — revise it after.`,
      },
    ],
    project: {
      title: 'Build the URL shortener',
      brief: `Implement \`shortener/\` in your practice repo using the Day 45 layered template: routes / service / repo, with Day 47's cache. Endpoints: \`POST /v1/links\` (validates the URL, honors Idempotency-Key, generates a 7-char base62 code with collision retry, returns the short link), \`GET /{code}\` (cache-aside lookup, increments hits, 307-redirects; 404 problem-details for unknown codes), \`GET /v1/links/{code}/stats\` (hit count + created_at). Config from env vars (DB path, cache TTL). Tests with TestClient: create-then-redirect round trip, duplicate Idempotency-Key returns the same code, unknown code → 404 shape, and a spy-repo test proving the second redirect skips the DB. Commit design doc + code together — the doc is part of the deliverable.`,
      rubric: [
        'Design doc complete BEFORE the build (commit order shows it)',
        'Create → redirect round trip passes; codes are 7-char base62 with collision retry',
        'Duplicate Idempotency-Key provably returns the same code with one DB row',
        'Spy-repo test proves cache-aside: second redirect skips the database',
        'Errors use the problem-details shape; config comes from env vars',
        'Trade-offs section includes the 301/302 decision with the stats consequence stated',
      ],
    },
    mistakes: [
      'Building first, back-filling the design doc after. The order is the exercise — designing on paper forces the decisions (index, cache, status code) you would otherwise stumble into.',
      'Reviewing by re-reading the week\'s notes. Retrieval strengthens memory; recognition just feels good. Closed book first, diff second, re-read only the gaps.',
      'Choosing 301 redirects and then wondering why hit counts stall. Browsers cache 301s and stop visiting you. If stats matter, that requirement decides 302/307 — requirements drive design, even here.',
      'Generating codes from a global counter without noticing the trade: sequential codes are guessable (enumerate everyone\'s links) and the counter is shared state (Day 46). Random base62 + retry avoids both at your scale.',
      'Caching the hit counter. Counters are mutable state, not cacheable copies — cache the immutable code→URL mapping, count in the store.',
      'Skipping the out-loud rehearsal because the doc exists. Interview fluency is a motor skill; the first time you SAY a design should not be in the interview.',
    ],
    quiz: [
      {
        q: 'A client makes 50 sequential HTTPS requests without connection reuse. Which cost repeats 50 times that pooling would pay once?',
        o: ['DNS resolution', 'TCP + TLS handshakes', 'JSON serialization', 'Server-side routing'],
        x: 1,
        w: 'Week recap from Day 43: each fresh connection re-pays the TCP three-way handshake and TLS negotiation. Connection reuse is why your future LLM client (Day 107) pools connections.',
        revisit: 43,
      },
      {
        q: 'Your shortener must show accurate click counts. Which redirect status should GET /{code} return, and why?',
        o: [
          '301 — permanent redirects are fastest',
          '302/307 — browsers keep coming back to your server, so every click is countable; 301 gets cached and clicks vanish',
          '200 with the URL in the body',
          '404 until the link is verified',
        ],
        x: 1,
        w: 'A 301 tells browsers "never ask again" — they cache the mapping and your hit counter starves. 302/307 trades a bit of latency for observable traffic. Requirements (stats) drive the choice.',
        revisit: 49,
      },
      {
        q: 'Two identical POST /v1/links requests arrive with the same Idempotency-Key (a client retried a timeout). The correct behavior is…',
        o: [
          'Create two links — the client asked twice',
          'Return 409 Conflict',
          'Create one link and return the same stored response for both requests',
          'Rate-limit the client',
        ],
        x: 2,
        w: 'Day 46\'s contract: the server dedupes by key and replays the recorded result, making the retry indistinguishable from a slow success. One row, identical bodies.',
        revisit: 46,
      },
    ],
    resources: [
      { label: 'System Design Primer — the Pastebin/URL-shortener solution (compare AFTER building)', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo', time: '20 min' },
      { label: 'FastAPI docs — TestClient & responses', url: 'https://fastapi.tiangolo.com/', type: 'docs', time: '15 min' },
      { label: 'SQLite docs — indexes & query planning', url: 'https://www.sqlite.org/docs.html', type: 'docs', time: '10 min' },
      { label: 'ByteByteGo — URL shortener case study', url: 'https://blog.bytebytego.com/', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Closed-book recall drills over Days 43–48', minutes: 25 },
      { activity: 'Design doc sprint (timed, paper first)', minutes: 20 },
      { activity: 'Build: URL shortener with tests', minutes: 50 },
      { activity: 'Interview answer rehearsal (out loud)', minutes: 10 },
      { activity: 'Cumulative quiz + flashcard deck drill', minutes: 15 },
    ],
    completion: [
      'Recall drills scored; revisit list written and weak sections re-studied',
      'Design doc committed before the first code commit',
      'All shortener tests pass, including idempotency and spy-repo cache proof',
      'Trade-offs section written in interview form; rehearsal completed out loud',
      'Cumulative quiz ≥ 2/3 (follow revisit pointers for misses)',
    ],
    connections: {
      back: 'This build is the whole week compressed: Day 48\'s method produced the doc, Day 45\'s layers shaped the code, Day 47\'s cache-aside sits on the hot path, Day 46\'s idempotency key guards creation, and Day 38\'s index intuition chose the primary key. Even Day 43 shows up in WHY the redirect hop is cheap.',
      forward: 'Phase 2 ends here. Monday (Day 50) pivots to the math phase — vectors and dot products — where the "arrows and shadows" you draw become, by Day 92, the embeddings your RAG systems search. The shortener itself returns as a reference architecture: Day 148 containerizes services shaped exactly like it.',
    },
    flashcards: [
      { f: 'Why does retrieval beat re-reading for review?', b: 'Effortful recall resets and flattens the forgetting curve; recognition leaves almost no trace.' },
      { f: '301 vs 302 for a shortener with stats?', b: '301 is cached by browsers (clicks vanish); 302/307 keeps traffic observable. Stats requirement → 302/307.' },
      { f: 'Base62, 7 chars — how many codes?', b: '62⁷ ≈ 3.5×10¹² — collisions are rare at small scale; check-and-retry handles them.' },
      { f: 'Why is SQLite fine for 1M links/day?', b: '~12 writes/s average is far below its limits; capacity math, not fashion, picks the database.' },
      { f: 'What was cacheable in the shortener, and what was not?', b: 'The immutable code→URL mapping (perfect cache-aside); NOT the mutable hit counter — that is state.' },
    ],
    deepDive: [
      { label: 'Compare your design to the canon', note: 'After building, read the System Design Primer\'s pastebin/shortener chapter and list two things it does differently (e.g. separate read/write services, NoSQL at larger scale) and the scale at which each would start to matter for you.' },
    ],
  },
  {
    id: 'd050', day: 50, week: 8, phase: 3, kind: 'lesson',
    title: 'Vectors & Dot Products',
    analogy: 'Arrows and shadows',
    objectives: [
      'Describe a vector both ways: a list of numbers and an arrow with length and direction',
      'Compute norms and interpret the dot product as alignment between directions',
      'Compute cosine similarity and explain why it ignores vector length',
      'Show numerically that random high-dimensional vectors are nearly orthogonal',
      'Rank toy "documents" by cosine similarity — a hand-built preview of embedding search',
    ],
    prereqs: [
      { day: 22, label: 'Big O — cost of comparing everything' },
      { day: 4, label: 'Collections & list operations' },
    ],
    eli5: `Picture an arrow on the ground pointing somewhere, and the sun directly overhead one side of it. The **dot product** of two arrows asks: if I shine light along arrow B, how long is the shadow arrow A casts on it — scaled by both lengths? Arrows pointing the same way cast long shadows on each other (big positive dot product). Perpendicular arrows cast no shadow at all (dot product zero — they share nothing). Arrows pointing opposite ways cast "negative shadow" (negative dot product).

Now the leap that powers modern AI: an arrow does not have to live in 2D. A list of 768 numbers is an arrow in 768-dimensional space, and the shadow trick still works, computed the same way: multiply matching coordinates, add them up. If you place words at arrow-tips so that similar meanings point in similar directions — which is exactly what an embedding model does — then "how similar are these two sentences?" becomes "how aligned are these two arrows?", one multiply-add away. **Cosine similarity** is the shadow question with lengths divided out: pure direction, ignoring how long the arrows are. Today you build that machinery with your own hands in NumPy; on Day 92 a neural network will build the arrows for you.`,
    why: `The dot product is arguably the single most-executed operation in AI: every neuron (Day 85), every attention score (Day 94), and every vector-database query (Day 115) is dot products at industrial scale. When you ship RAG systems, "the retriever returns junk" debugging starts with cosine similarities between query and chunk embeddings — numbers you must read fluently. And the high-dimensional intuition you build today (near-orthogonality of random vectors) is why embedding spaces can host millions of distinct meanings without collapsing — the geometric fact that makes semantic search work at all.`,
    tech: `### Vectors: two pictures, one object

A vector **v** in ℝⁿ is an ordered list of n numbers — and simultaneously an arrow from the origin to that point. Both pictures matter: the list is how NumPy stores it; the arrow is how you should think about it. Addition places arrows tip-to-tail; scalar multiplication stretches them. The **norm** ‖v‖ = sqrt(Σvᵢ²) is the arrow's length (Pythagoras, any dimension). Dividing a vector by its norm gives a **unit vector**: pure direction, length 1.

### The dot product, three ways

Algebraically: v·w = Σ vᵢwᵢ — multiply matching components, sum. Geometrically: v·w = ‖v‖‖w‖cos θ, where θ is the angle between the arrows — the shadow formula. Computationally: \`v @ w\` in NumPy, one fused pass, O(n). The three are the same number, and switching between views is the skill: a big dot product means "long arrows, similar direction"; zero means **orthogonal** (θ = 90°, no shared direction); negative means opposing.

### Cosine similarity — direction without length

cos θ = (v·w) / (‖v‖‖w‖), always in [−1, 1]. It answers "same direction?" while ignoring magnitude — which matters for text, where a long document and a tweet about the same topic should count as similar even though the long one's raw vector is "louder." Embedding pipelines routinely normalize vectors to unit length so that cosine similarity and dot product become the same operation (and even Euclidean distance becomes a monotone function of it — the three rankings agree on unit vectors).

### High dimensions are not like 3D

Two intuitions to install today, both verifiable by simulation. First, **random vectors are nearly orthogonal**: in ℝ³ two random directions might easily align; in ℝ⁷⁶⁸ their cosine similarity concentrates tightly around 0 (spread ~1/√n). This is why a 768-dim space can hold millions of concepts in almost-mutually-perpendicular directions. Second, similarity scores compress: in real embedding spaces, "unrelated" pairs often score ~0.1–0.3, not 0, and "similar" might be 0.6 — you read cosine similarities *comparatively* (which chunk scores highest), never against absolute thresholds carried between models. Both facts will save you real debugging time on Days 92 and 115.`,
    viz: 'vector-dot',
    guided: [
      {
        title: 'Arrows, shadows, and the three faces of the dot product',
        minutes: 25,
        body: `1. Run part 1: two 2D vectors, their norms, and the dot product computed BOTH ways — component sum and ‖v‖‖w‖cos θ. Confirm they match to floating-point precision.
2. Rotate w around the circle in 30° steps (part 2) and watch the dot product trace out alignment: maximal when parallel, zero at 90°, most negative when opposite. Say the shadow story out loud at each step.
3. Part 3: cosine similarity. Scale v by 100 and confirm the cosine does NOT change (direction is length-blind) while the raw dot product balloons ×100.
4. Predict, then check: cosine similarity between [1, 0, 1, 0] and [0, 1, 0, 1]? (They share no active components…) Then between [1, 2, 3] and [2, 4, 6]?`,
        code: `import numpy as np

v = np.array([3.0, 1.0])
w = np.array([2.0, 2.0])

# --- 1. one number, three faces
dot_alg = float(v @ w)                      # sum of componentwise products
cos_theta = dot_alg / (np.linalg.norm(v) * np.linalg.norm(w))
theta = np.degrees(np.arccos(cos_theta))
print(f"v·w = {dot_alg:.3f}   |v|={np.linalg.norm(v):.3f} "
      f"|w|={np.linalg.norm(w):.3f}  angle={theta:.1f} deg")
dot_geo = np.linalg.norm(v) * np.linalg.norm(w) * np.cos(np.radians(theta))
print(f"geometric formula gives {dot_geo:.3f}  (same number)")

# --- 2. sweep w around the circle: alignment as a dial
print("\\nangle   v·w     story")
for deg in range(0, 361, 30):
    rad = np.radians(deg)
    w_rot = 2.0 * np.array([np.cos(rad), np.sin(rad)])   # length 2, rotating
    d = float(v @ w_rot)
    story = "aligned" if d > 3 else ("opposed" if d < -3 else
            "~orthogonal" if abs(d) < 1e-9 or abs(d) < 1.2 else "between")
    print(f"{deg:5d}  {d:7.2f}   {story}")

# --- 3. cosine similarity ignores length
def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

print(f"\\ncos(v, w)      = {cosine(v, w):.4f}")
print(f"cos(100v, w)   = {cosine(100 * v, w):.4f}   <- unchanged")
print(f"raw dot 100v·w = {float(100 * v @ w):.1f}    <- 100x louder")`,
      },
      {
        title: 'High-dimensional intuition + tiny semantic search',
        minutes: 20,
        body: `1. Part 1 samples 1,000 pairs of random unit vectors in dimensions 3, 32, and 768 and prints the mean and spread of their cosine similarities. Watch the spread shrink like 1/√n — in 768-D, random directions are essentially perpendicular. Write the takeaway in your notes: high-dim space has room for "everything unrelated to everything."
2. Part 2 is a semantic search engine you can hold in your head: five "documents" with HAND-BUILT 4-dim vectors, where each dimension is an interpretable feature (animal-ness, food-ness, tech-ness, sports-ness). Read the vectors and check they match your intuition about each doc.
3. Run the query and confirm the ranking makes sense. Change the query vector to "sports tech" (e.g. [0, 0, 0.7, 0.7]) and re-rank.
4. The punchline to say out loud: Day 92 replaces the hand-built column meanings with 768 learned ones — the search code will not change.`,
        code: `import numpy as np

rng = np.random.default_rng(50)

def unit(x):
    return x / np.linalg.norm(x, axis=-1, keepdims=True)

# --- 1. random directions barely align in high dimension
for n in (3, 32, 768):
    a = unit(rng.normal(size=(1000, n)))
    b = unit(rng.normal(size=(1000, n)))
    cos = np.sum(a * b, axis=1)             # rowwise dot of unit vectors
    print(f"dim {n:4d}: mean cos {cos.mean():+.3f}  "
          f"spread {cos.std():.3f}  (~1/sqrt(n)={1/np.sqrt(n):.3f})")

# --- 2. hand-built embeddings: [animal, food, tech, sports]
docs = {
    "cats chase mice":        np.array([0.9, 0.1, 0.0, 0.1]),
    "best pizza in town":     np.array([0.0, 0.9, 0.0, 0.0]),
    "new GPU benchmarks":     np.array([0.0, 0.0, 0.9, 0.1]),
    "the match went to penalties": np.array([0.0, 0.1, 0.1, 0.9]),
    "dogs love tennis balls": np.array([0.8, 0.0, 0.0, 0.5]),
}

def search(query_vec, docs):
    q = query_vec / np.linalg.norm(query_vec)
    scored = [(float(q @ (v / np.linalg.norm(v))), text)
              for text, v in docs.items()]
    return sorted(scored, reverse=True)

print('\\nquery: "pets" -> [0.9, 0, 0, 0.2]')
for score, text in search(np.array([0.9, 0.0, 0.0, 0.2]), docs):
    print(f"  {score:.3f}  {text}")`,
      },
    ],
    practice: [
      {
        title: 'Build the similarity toolkit',
        minutes: 20,
        body: `Write \`simtools.py\` from scratch (no peeking at the guided code): \`norm(v)\`, \`cosine(a, b)\`, and \`top_k(query, matrix, k)\` where matrix is shape (num_docs, dim) and the function returns the indices and scores of the k most similar rows — computed with ONE matrix-vector product, no Python loop.

Constraints: handle the zero-vector edge case in cosine (return 0.0, do not divide by zero); \`top_k\` must use \`np.argsort\` (or argpartition) on a single \`matrix @ query\` of normalized rows; include three asserts: cosine of a vector with itself is 1.0, with its negative is −1.0, and scaling either argument changes nothing.

Hints (only if stuck): normalize the matrix rows once with keepdims=True; argsort ascending → take the last k reversed.`,
      },
    ],
    project: {
      title: 'Similarity lab notebook',
      brief: `Create \`vectors_lab.md\` + \`simtools.py\` in your practice repo. The notebook records four experiments with numbers and one-paragraph readings: (1) the rotating-dot-product sweep table and the shadow story in your own words; (2) the dimension-vs-spread table from the near-orthogonality sim, with the 1/√n observation; (3) your hand-built 4-dim search: the doc vectors, two queries, rankings, and one sentence on WHY each ranking came out as it did; (4) a "gotcha" experiment: two vectors with high cosine similarity but very different norms — explain when that distinction matters (hint: it is why some systems use dot product and others cosine). Close with three sentences titled "what Day 92 will change" (learned dimensions, 768 of them, same math). This file is the seed of your embedding intuition — Day 92 and Day 115 both reference it.`,
      rubric: [
        'simtools.py passes its asserts and top_k uses one matmul, zero Python loops',
        'Sweep table shows dot product peaking aligned, zero near 90°, negative opposed',
        'Near-orthogonality table covers dims 3/32/768 with the 1/√n note',
        'Both search rankings recorded with a causal explanation each',
        'Cosine-vs-dot-product gotcha explained correctly',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Treating vectors as "just lists." The geometry is the point: without the arrow picture, dot products are arbitrary arithmetic and cosine similarity is a magic spell. Always be able to say what the number MEANS.',
      'Confusing dot product with cosine similarity. Dot product scales with both lengths; cosine divides them out. On unit vectors they coincide — which is exactly why pipelines normalize.',
      'Expecting "unrelated" to mean cosine ≈ 0 in real embedding spaces. Real models put unrelated text at 0.1–0.3; read scores comparatively within one model, never as absolute thresholds across models.',
      'Assuming 3D intuition scales. In high dimensions random vectors are near-orthogonal and distances concentrate — some 3D instincts invert. Trust the simulations you ran today.',
      'Looping over rows to compute similarities. One matrix-vector product does all documents at once — this habit (vectorize!) is Day 64\'s whole lesson and the reason GPUs exist (Day 51).',
      'Forgetting the zero-vector edge case. An all-zeros vector has no direction; cosine with it is undefined. Production code returns 0 or raises — deciding is your job, dividing by zero is not.',
    ],
    quiz: [
      {
        q: 'Two vectors have dot product 0. Geometrically, this means…',
        o: [
          'They are identical',
          'They are orthogonal — neither casts any shadow on the other',
          'One of them must be the zero vector',
          'They point in opposite directions',
        ],
        x: 1,
        w: 'v·w = ‖v‖‖w‖cos θ = 0 with nonzero lengths forces cos θ = 0, i.e. θ = 90°. Opposite directions would give a negative product; identical directions the maximum positive one.',
        revisit: 50,
      },
      {
        q: 'Why do embedding pipelines usually normalize vectors to unit length?',
        o: [
          'To save memory',
          'So cosine similarity and dot product become the same operation, and rankings by either agree',
          'Because NumPy requires it',
          'To make all similarities positive',
        ],
        x: 1,
        w: 'On unit vectors, v·w = cos θ exactly — the cheap operation (dot product) becomes the meaningful one (direction alignment), and Euclidean distance ranks identically too.',
        revisit: 50,
      },
      {
        q: 'You sample two random unit vectors in ℝ⁷⁶⁸. Their cosine similarity is most likely…',
        o: [
          'Close to 1',
          'Close to 0 — random high-dimensional directions are nearly orthogonal',
          'Close to −1',
          'Uniformly distributed between −1 and 1',
        ],
        x: 1,
        w: 'Similarity concentrates around 0 with spread ~1/√n ≈ 0.036 in 768-D. This near-orthogonality is why embedding spaces can host huge vocabularies of distinct meanings.',
        revisit: 50,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Essence of Linear Algebra, chapters 1–3 (vectors, span, dot products)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '35 min' },
      { label: 'Immersive Linear Algebra — ch. 2–3 (vectors & the dot product, interactive)', url: 'http://immersivemath.com/ila/index.html', type: 'book', time: '25 min' },
      { label: 'NumPy — the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', type: 'docs', time: '20 min' },
      { label: 'Mathematics for Machine Learning — ch. 3 (analytic geometry)', url: 'https://mml-book.github.io/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards from Week 7', minutes: 10 },
      { activity: 'ELI5 + tech read + 3B1B chapters 1–3, vector-dot visualizer', minutes: 25 },
      { activity: 'Guided: three faces of the dot product + high-dim sim', minutes: 45 },
      { activity: 'Practice: build the similarity toolkit', minutes: 20 },
      { activity: 'Project: similarity lab notebook', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Both guided labs run; dot-product sweep story told at three angles',
      'simtools.py committed, asserts pass, top_k is loop-free',
      'Near-orthogonality table recorded for dims 3/32/768',
      'Lab notebook committed with all four experiments + the Day 92 paragraph',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 22\'s complexity lens applies immediately: scoring n documents against a query is O(n·d) — fine at toy scale, and the reason Day 115\'s approximate indexes will exist. The vectorized top_k continues the "replace loops with structure" instinct from Day 4.',
      forward: 'Day 51 stacks many dot products into matrices — a matrix-vector product is just every row shadow-testing the same vector at once, which is also what attention does with queries and keys on Day 94. Day 92 delivers the learned 768-dim vectors, Day 93 trains word vectors, and Day 115 scales today\'s top_k to millions of documents.',
    },
    flashcards: [
      { f: 'Dot product, algebraic and geometric?', b: 'Σ vᵢwᵢ = ‖v‖‖w‖cos θ. Componentwise multiply-sum = lengths × alignment.' },
      { f: 'Cosine similarity in one line?', b: '(v·w)/(‖v‖‖w‖): direction agreement in [−1,1], blind to vector length.' },
      { f: 'Dot product of orthogonal vectors?', b: 'Zero — 90° apart, no shadow, no shared direction.' },
      { f: 'Random unit vectors in ℝ⁷⁶⁸ — typical cosine?', b: '≈ 0 ± 1/√768 ≈ 0.036. High-dim random directions are nearly orthogonal.' },
      { f: 'Why normalize embeddings to unit length?', b: 'Dot product then equals cosine; distance/cosine/dot rankings all agree.' },
      { f: 'What is an embedding (preview)?', b: 'A learned vector whose direction encodes meaning — similarity becomes geometry (Day 92).' },
    ],
    deepDive: [
      { label: 'The curse (and blessing) of dimensionality', note: 'Distances concentrate in high dimensions: the gap between "nearest" and "farthest" shrinks relatively. It complicates naive nearest-neighbor but the near-orthogonality blessing gives models astronomical representational room. Day 79 (PCA) returns here.' },
    ],
  },
  {
    id: 'd051', day: 51, week: 8, phase: 3, kind: 'lesson',
    title: 'Matrices & Transformations',
    analogy: 'Machines that move space',
    objectives: [
      'Interpret a matrix as a transformation of space and read its columns as where the basis vectors land',
      'Apply rotation, scaling, and shear matrices to point clouds and predict the result before running',
      'Explain why composing transformations is matrix multiplication and why order matters',
      'Describe identity and inverse as "do nothing" and "undo," and name when no inverse exists',
      'Time vectorized matmul against Python loops and explain why GPUs are matmul machines',
    ],
    prereqs: [
      { day: 50, label: 'Vectors & dot products' },
      { day: 22, label: 'Big O — counting the multiplies' },
    ],
    eli5: `A matrix is not a spreadsheet of numbers — it is a **machine that moves space**. Feed it any arrow (vector), and it outputs a moved arrow. One machine rotates everything 90°; another stretches everything horizontally; another squashes the whole plane onto a line. And here is the beautiful secret that makes them readable: to know everything a machine does, you only need to watch what it does to two test arrows — "one step right" and "one step up." The machine's columns ARE those answers. Columns [0,1] and [−1,0]? Right went up, up went left: it is a rotation. You can read the machine's soul off its columns.

Chaining machines — rotate, THEN stretch — is itself a single machine, and computing it is what matrix multiplication *is*. That is why order matters: rotating then stretching is a different trip than stretching then rotating, just like putting on socks then shoes differs from shoes then socks. The identity matrix is the machine that touches nothing; an inverse is the machine that exactly undoes another — and machines that flatten space (squash 2D onto a line) cannot be undone, because flattening destroys information. Hold that thought: it returns tomorrow as "rank."`,
    why: `A neural network layer is literally a matrix machine: output = W @ x + b, where W is learned (Day 85). A transformer forward pass is a long chain of these machines — and attention (Day 94) computes its scores as one big matmul of queries against keys, exactly the "every row shadow-tests every column" picture you build today. Matmul is such an overwhelming fraction of AI compute that an entire hardware industry (GPUs, TPUs) exists to do it fast — which is why "can you vectorize this?" is a real performance question you will face in every pipeline you ship, and why today's loop-vs-matmul timing is a number worth remembering.`,
    tech: `### Reading a matrix as a transformation

A matrix A ∈ ℝ^(m×n) maps vectors from ℝⁿ to ℝᵐ: x ↦ Ax. The map is **linear**: grid lines stay parallel and evenly spaced, and the origin stays put. The decoding trick: **column i of A is where basis vector eᵢ lands.** Rotation by θ has columns [cos θ, sin θ] and [−sin θ, cos θ]; scaling has the factors on the diagonal; a shear has an off-diagonal entry pushing one axis sideways. Every Ax is then a recipe: "x₁ copies of column 1 plus x₂ copies of column 2" — a linear combination of columns. Equivalently, row by row, each output component is a dot product of a row with x: yesterday's shadows, stacked.

### Composition = multiplication, and order matters

Applying B then A to x gives A(Bx) = (AB)x — the product AB is the single machine equal to "B first, then A" (read right to left, like function composition). Matrix multiplication is defined exactly so this works: (AB)ᵢⱼ = row i of A · column j of B. It is associative — (AB)C = A(BC), which deep learning exploits constantly — but **not commutative**: AB ≠ BA in general. Rotate-then-stretch visibly differs from stretch-then-rotate; you will watch it happen.

### Identity, inverse, and machines that destroy

The identity I (ones on the diagonal) satisfies Ix = x. The inverse A⁻¹, when it exists, is the machine with A⁻¹A = I — the exact undo. A square matrix has no inverse when it **flattens** space into a lower dimension (its determinant is 0): two different inputs land on the same output, so "undo" has no unique answer. In ML you rarely compute explicit inverses (numerically fragile; you solve linear systems instead), but the concept anchors tomorrow's rank and SVD.

### Batches, layers, and why GPUs

Stack 1,000 input vectors as rows of X (shape 1000×n); then X @ W.T transforms the whole batch in one operation — the same loop-free trick as yesterday's top_k, now industrial. A dense layer is exactly this: Y = X @ W.T + b, with W's rows as learned "feature detector" directions, each output a dot-product alignment score. An (m×n)@(n×p) matmul costs m·n·p multiply-adds — arithmetic that is regular, dense, and embarrassingly parallel, which is precisely what GPU silicon is built to saturate. NumPy hands the work to optimized BLAS; your Python loop does one multiply at a time. You will time the difference today, and it is not subtle.`,
    viz: 'matrix-transform',
    guided: [
      {
        title: 'Machines that move a point cloud',
        minutes: 25,
        body: `1. Run part 1: a unit square (four corners + center) is pushed through four machines: rotation(45°), scale(2, 0.5), shear, and a "flattener." For each, the corners are printed before/after. BEFORE running each, read the matrix columns aloud and predict where [1,0] and [0,1] land — then check.
2. Part 2 composes: R @ S versus S @ R applied to the same square. Confirm the corner coordinates differ — order matters. Write one sentence: which corner proves it?
3. Part 3: undo. Apply \`np.linalg.inv(R @ S)\` to the transformed square and confirm you recover the original corners (to ~1e-15). Then try to invert the flattener and watch NumPy raise LinAlgError — flattening is irreversible: two corners already landed on the same line.
4. In your notes: the columns-tell-all rule in your own words, plus why the flattener's columns give it away (they are parallel — both point along one line).`,
        code: `import numpy as np

square = np.array([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]], float).T
# shape (2, 5): each COLUMN is a point, so A @ square moves all points at once

t = np.radians(45)
machines = {
    "rotate 45":  np.array([[np.cos(t), -np.sin(t)],
                            [np.sin(t),  np.cos(t)]]),
    "scale 2,.5": np.array([[2.0, 0.0],
                            [0.0, 0.5]]),
    "shear":      np.array([[1.0, 1.0],
                            [0.0, 1.0]]),
    "flattener":  np.array([[1.0, 2.0],
                            [0.5, 1.0]]),   # columns are parallel!
}

for name, A in machines.items():
    moved = A @ square
    print(f"\\n{name}: columns -> {A[:,0].round(2)} and {A[:,1].round(2)}")
    print("  before:", square.T.round(2).tolist())
    print("  after: ", moved.T.round(2).tolist())

# --- 2. order matters
R, S = machines["rotate 45"], machines["scale 2,.5"]
print("\\nR@S corner (1,1):", (R @ S @ square)[:, 2].round(3))
print("S@R corner (1,1):", (S @ R @ square)[:, 2].round(3))

# --- 3. undo, and the machine that cannot be undone
restored = np.linalg.inv(R @ S) @ (R @ S @ square)
print("\\nmax restore error:", np.abs(restored - square).max())
try:
    np.linalg.inv(machines["flattener"])
except np.linalg.LinAlgError as e:
    print("flattener inverse:", e)`,
      },
      {
        title: 'A layer is a matrix; a GPU is a matmul furnace',
        minutes: 20,
        body: `1. Part 1 builds a tiny "sentiment layer" by hand: W has two rows — a "positive direction" and a "negative direction" in the 4-dim doc space from Day 50. Push the whole 5-doc matrix through it with ONE matmul and read the two scores per doc. Each output is a dot-product alignment with one learned-direction-to-be — this is a dense layer before training.
2. Confirm the shapes narrate the story: (5,4) @ (4,2) → (5,2). Five docs, two features out.
3. Part 2 times a (500×500)@(500×500) matmul as triple Python loop vs np.matmul. Record the ratio (expect 3–4 orders of magnitude).
4. Count the multiplies: 500³ = 1.25×10⁸ — and note that NumPy did them in milliseconds on a CPU. A modern GPU does tens of TERAFLOPs: this operation is what AI hardware is for. Write the measured ratio in your notes; you will quote it on Day 64.`,
        code: `import numpy as np, time

# --- 1. docs from Day 50: [animal, food, tech, sports]
docs = np.array([
    [0.9, 0.1, 0.0, 0.1],   # cats chase mice
    [0.0, 0.9, 0.0, 0.0],   # best pizza in town
    [0.0, 0.0, 0.9, 0.1],   # new GPU benchmarks
    [0.0, 0.1, 0.1, 0.9],   # match went to penalties
    [0.8, 0.0, 0.0, 0.5],   # dogs love tennis balls
])
W = np.array([
    [0.7, 0.7, 0.0, 0.3],   # row 0: a "cozy topics" direction
    [0.0, 0.0, 0.9, 0.6],   # row 1: a "competitive tech" direction
])
scores = docs @ W.T          # (5,4)@(4,2) -> (5,2): all docs, both features
print("scores (cozy, competitive-tech):\\n", scores.round(2))

# --- 2. loops vs matmul
n = 500
A = np.random.default_rng(0).normal(size=(n, n))
B = np.random.default_rng(1).normal(size=(n, n))

t0 = time.perf_counter()
C_loop = np.zeros((n, n))
for i in range(n):
    for j in range(n):
        s = 0.0
        for k in range(n):
            s += A[i, k] * B[k, j]
        C_loop[i, j] = s
loop_s = time.perf_counter() - t0

t0 = time.perf_counter()
C_fast = A @ B
fast_s = time.perf_counter() - t0

print(f"\\nloops : {loop_s:8.2f} s")
print(f"matmul: {fast_s*1000:8.2f} ms   ratio ~ {loop_s/fast_s:,.0f}x")
print("same answer:", np.allclose(C_loop, C_fast))`,
      },
    ],
    practice: [
      {
        title: 'Design the machine',
        minutes: 20,
        body: `Reverse the skill: instead of reading matrices, write them. Build each 2×2 machine from the columns-tell-all rule, apply it to the unit square, and verify the printed corners match your intent: (1) rotate 90° counterclockwise; (2) reflect across the y-axis; (3) project everything onto the x-axis (a deliberate flattener); (4) rotate 30° then scale ×3 — as ONE matrix built by multiplication; (5) the machine that undoes (4).

Constraints: construct every matrix by reasoning about where [1,0] and [0,1] must land — no formula lookup; verify (5) with an allclose check against the original square; state which of the five machines has no inverse and how you know from its columns alone.

Hints (only if stuck): reflection sends [1,0]→[−1,0] and keeps [0,1]; projection sends both basis vectors onto the x-axis — parallel columns = flattened = no inverse.`,
      },
    ],
    project: {
      title: 'Transformation gallery + layer notes',
      brief: `Create \`matrix_lab.py\` + \`matrix_notes.md\` in your practice repo. The script: your five practice machines plus the guided demos, each printing before/after corner tables with a one-line docstring naming the transformation. The notes file: (1) the columns-tell-all rule with your own 2×2 worked example; (2) the composition section — R@S vs S@R corner evidence and the socks-then-shoes sentence; (3) the invertibility section — which machines undo, which flatten, and how columns betray a flattener; (4) the timing table (loops vs matmul, the measured ratio) under the heading "why GPUs exist"; (5) five sentences titled "a neural layer is a matrix" mapping Y = X @ W.T + b onto today's machines — to be quoted back at you on Day 85. Commit both.`,
      rubric: [
        'All five designed machines verified against predicted corners with allclose',
        'The undo machine restores the square to ~1e-12 error',
        'Composition order shown to matter with specific corner coordinates as evidence',
        'Flattener identified from parallel columns, with the no-inverse explanation',
        'Timing table records the measured loop/matmul ratio',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Memorizing matmul mechanics without the transformation picture. Row-times-column is HOW; "composition of space-moving machines" is WHY. The picture is what transfers to attention and layers.',
      'Assuming AB = BA. Matrix multiplication is not commutative — rotate-then-scale differs from scale-then-rotate, and you proved it with corner coordinates. It IS associative, which is a different (and useful) property.',
      'Reading AB as "A first, then B." Applied to a vector, (AB)x = A(Bx): B acts first. Read compositions right to left, like function application.',
      'Thinking every square matrix has an inverse. Flatteners (determinant 0, parallel/dependent columns) destroy information; no machine can restore what two inputs merged into one.',
      'Computing explicit inverses in numerical code. Solve the linear system instead (np.linalg.solve) — cheaper and more stable. The inverse is a concept for your head, not usually a matrix for your RAM.',
      'Writing loops where a matmul exists. The 1000×-plus ratio you measured is the argument; shaping problems AS matrix products is the core NumPy (Day 64) and PyTorch (Day 87) skill.',
    ],
    quiz: [
      {
        q: 'The columns of a 2×2 matrix are [0, 1] and [−1, 0]. What does this machine do?',
        o: [
          'Scales everything by −1',
          'Rotates the plane 90° counterclockwise — right lands up, up lands left',
          'Reflects across the x-axis',
          'Flattens the plane onto a line',
        ],
        x: 1,
        w: 'Columns tell all: e₁=[1,0] lands at [0,1] (up) and e₂=[0,1] lands at [−1,0] (left). That is a 90° CCW rotation; the columns stay perpendicular and unit-length, so nothing is scaled or flattened.',
        revisit: 51,
      },
      {
        q: 'Why does a matrix with determinant 0 have no inverse?',
        o: [
          'Its numbers are too small to divide by',
          'It flattens space into a lower dimension — distinct inputs share an output, so no unique undo exists',
          'It is not square',
          'Determinant 0 only happens for the zero matrix',
        ],
        x: 1,
        w: 'Det 0 means the columns are linearly dependent: the machine collapses a dimension. Information is destroyed, and "undo" would need one output to map back to many inputs — impossible for a function.',
        revisit: 51,
      },
      {
        q: 'X is a batch of 1,000 vectors (1000×768) and W.T is 768×512. What does X @ W.T compute, and why do we care that it is ONE operation?',
        o: [
          'The inverse of the batch',
          'All 1,000 vectors pushed through the same linear layer at once — dense, parallel arithmetic that BLAS/GPUs are built to saturate',
          'The cosine similarity of X with itself',
          'A 768×768 covariance matrix',
        ],
        x: 1,
        w: 'Each row of the (1000×512) result is one input transformed by the layer. Batching turns a thousand small jobs into one big regular matmul — exactly the workload GPUs accelerate, and why deep learning is feasible at all.',
        revisit: 51,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Essence of Linear Algebra, chapters 3–5 (transformations, composition)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '35 min' },
      { label: 'MIT OCW 18.06 — lecture 1–3 (the geometry of linear equations, multiplication)', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', type: 'course', time: '30 min' },
      { label: 'Immersive Linear Algebra — ch. 6 (the matrix, interactive)', url: 'http://immersivemath.com/ila/index.html', type: 'book', time: '20 min' },
      { label: 'Mathematics for Machine Learning — ch. 2 (linear algebra)', url: 'https://mml-book.github.io/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Day 50 + Week 7)', minutes: 10 },
      { activity: 'ELI5 + tech read + 3B1B ch. 3–5, matrix-transform visualizer', minutes: 25 },
      { activity: 'Guided: point-cloud machines + layer-and-timing lab', minutes: 45 },
      { activity: 'Practice: design the machine', minutes: 20 },
      { activity: 'Project: gallery + notes', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All guided machines predicted-then-verified via corner tables',
      'Five designed machines pass allclose checks; undo machine works',
      'Loop-vs-matmul ratio measured and recorded',
      '"A neural layer is a matrix" paragraph committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every entry of a matmul is a Day 50 dot product — a matrix-vector product is all rows shadow-testing one vector at once. The loop-vs-vectorized timing repeats Day 22\'s lesson (count the operations) at the hardware level.',
      forward: 'Tomorrow asks what a machine does to space beyond moving it: the directions it merely stretches (eigenvectors) and its rotate-stretch-rotate anatomy (SVD) — the key to LoRA on Day 128. On Day 85, Y = X@W.T + b becomes a trained layer; on Day 94, attention scores are Q @ K.T — a matmul you can already read.',
    },
    flashcards: [
      { f: 'How do you read what a matrix does?', b: 'Its columns are where the basis vectors land. Columns tell all.' },
      { f: 'What is matrix multiplication, conceptually?', b: 'Composition of transformations: (AB)x = A(Bx) — B acts first. Associative, NOT commutative.' },
      { f: 'When does a square matrix have no inverse?', b: 'When it flattens space (det 0, dependent columns) — information destroyed, no unique undo.' },
      { f: 'What is a dense/linear layer in matrix terms?', b: 'Y = X @ W.T + b: every input row transformed by the same machine; W\'s rows are learned directions.' },
      { f: 'Why are GPUs "matmul machines"?', b: 'Matmul is dense, regular, parallel arithmetic (m·n·p multiply-adds) — exactly what GPU silicon saturates.' },
      { f: 'Cost of (m×n)@(n×p)?', b: 'm·n·p multiply-adds — O(n³) for square matrices. Count it before you run it.' },
    ],
    deepDive: [
      { label: 'Determinant as area scaling', note: 'det(A) is the factor by which the machine scales areas (volumes in 3D); negative means orientation flips; 0 means flattened. 3B1B chapter 6 makes it visual in ten minutes.' },
    ],
  },
  {
    id: 'd052', day: 52, week: 8, phase: 3, kind: 'lesson',
    title: 'Rank, Eigenvectors & SVD Intuition',
    analogy: 'The grain of the wood',
    objectives: [
      'Define rank as the true dimensionality of what a matrix produces, and detect it numerically',
      'Explain eigenvectors as directions a machine only stretches, and find one by power iteration',
      'Describe SVD as rotate → stretch → rotate and read the singular values as importance scores',
      'Compress a matrix with a truncated SVD and measure the error-vs-rank trade-off',
      'Connect low-rank structure to LoRA (Day 128) and PCA (Day 79) in one paragraph each',
    ],
    prereqs: [
      { day: 51, label: 'Matrices as transformations' },
      { day: 50, label: 'Dot products & norms' },
    ],
    eli5: `Run your hand across a plank of wood. It feels totally different along the grain versus across it — the wood has built-in directions, and everything you do to it (splitting, sanding, bending) works with or against them. Matrix machines have grain too. Most arrows you feed a machine come out rotated AND stretched — but a few special arrows come out merely stretched, still pointing the way they went in. Those are the **eigenvectors** — the machine's grain — and the stretch factors are the **eigenvalues**. Push anything through the machine repeatedly and it gets combed toward the strongest grain direction, like sanding always ends up following the wood.

Now the deeper cut, the **SVD**: every machine — every matrix, no exceptions — is secretly three simple moves glued together: a rotation, then a pure stretch along perpendicular axes (by amounts called singular values), then another rotation. The singular values are an importance ranking of the machine's directions. And here is the trick that pays your salary later: if only a few singular values are large, the machine is impersonating a much simpler machine — you can throw away the small ones and keep almost all the behavior at a fraction of the size. That is a **low-rank approximation**, and it is precisely the bet LoRA makes when it fine-tunes a giant model with tiny sticky-note matrices on Day 128.`,
    why: `Low-rank structure is one of the most monetizable ideas in modern AI. LoRA fine-tunes billion-parameter models by learning updates constrained to rank r ≈ 8–64 — millions of times smaller than the weight matrices they adjust — and it works because useful weight *changes* empirically have low rank; when you run a LoRA lab on Day 128, "rank" is a dial you will set with today's intuition. PCA (Day 79) is SVD applied to data, powering the 2D maps you will draw of embedding spaces (Day 92). Recommender systems, image compression, and attention-matrix analysis all speak this language: which directions matter, and how many are there really?`,
    tech: `### Rank — how much dimension survives

The **rank** of a matrix is the dimension of its output space: the number of linearly independent directions it can actually produce. A 100×100 matrix of rank 3 looks huge but maps everything into a 3-dimensional slice — Day 51's flattener generalized. Rank also counts the independent columns (equivalently rows). Numerically you do not trust exact zeros: you look at the singular values and count those above a tolerance — real data is full of "rank 3 plus noise," and seeing THROUGH the noise to the effective rank is the practical skill.

### Eigenvectors — the directions that only stretch

For square A, an eigenvector v satisfies Av = λv: output parallel to input, scaled by eigenvalue λ. Repeated application multiplies by λ each time, so the largest-|λ| direction dominates: normalize Aⁿx for a random x and it converges to the dominant eigenvector — **power iteration**, three lines of NumPy, and the ancestor of PageRank (the web's dominant eigenvector). Eigen-analysis applies to square machines; not all have real eigenvectors (a rotation stretches nothing — its grain is complex-valued), which is one reason we need the more general tool.

### SVD — every matrix is rotate · stretch · rotate

The singular value decomposition factors ANY matrix, square or not: A = U Σ Vᵀ, with U and V orthogonal (pure rotations/reflections) and Σ diagonal with non-negative **singular values** σ₁ ≥ σ₂ ≥ … The machine's anatomy: rotate the input (Vᵀ), stretch along perpendicular axes by the σᵢ, rotate into the output space (U). Rank = number of nonzero σᵢ. Written as a sum, A = Σᵢ σᵢ uᵢvᵢᵀ — a stack of rank-1 layers ordered by importance.

### Truncation — the deal of the century

Keep only the top k layers: A_k = Σᵢ₌₁ᵏ σᵢ uᵢvᵢᵀ. The Eckart–Young theorem says this is the BEST rank-k approximation of A (in Frobenius norm) — no cleverer scheme beats simple truncation. Storage falls from m·n to k(m+n+1) numbers; for a 1000×1000 matrix at k=20 that is ~4% of the original. LoRA's move is the same shape, applied to updates: instead of learning a full ΔW (m×n), learn ΔW = B·A with B (m×r) and A (r×n), r tiny — a rank-r sticky note on a giant frozen machine. When Day 128 asks you to pick r, you are choosing how many singular directions the adaptation is allowed to use.`,
    viz: null,
    guided: [
      {
        title: 'Find the grain: power iteration by hand',
        minutes: 20,
        body: `1. Run part 1: the matrix A stretches direction [1,1] by 3 and direction [1,−1] by 0.5 (it is built from those eigenvectors). Feed it a random vector and apply A repeatedly, normalizing each step. Watch the printed vector swing toward [0.707, 0.707] within ~8 iterations — the strongest grain wins.
2. Check against \`np.linalg.eig\`: confirm eigenvalues ≈ 3 and 0.5, eigenvectors ≈ [1,1]/√2 and [1,−1]/√2.
3. Verify the definition directly: compute \`A @ v\` for the found v and confirm it equals 3v (parallel, stretched, not rotated) — then do the same for a NON-eigenvector and see the direction change.
4. Break it: replace A with a 90° rotation matrix and re-run power iteration. It never settles — a rotation has no real grain. Note WHY in one line (nothing keeps its direction under rotation).`,
        code: `import numpy as np

rng = np.random.default_rng(52)

# build A with known grain: eigenvectors [1,1] (λ=3) and [1,-1] (λ=0.5)
P = np.array([[1.0, 1.0], [1.0, -1.0]])
A = P @ np.diag([3.0, 0.5]) @ np.linalg.inv(P)
print("A =\\n", A.round(3))

# --- 1. power iteration: repeated application combs toward the grain
v = rng.normal(size=2)
for i in range(10):
    v = A @ v
    v = v / np.linalg.norm(v)
    print(f"iter {i}: direction {v.round(4)}")

# --- 2. the library agrees
vals, vecs = np.linalg.eig(A)
print("\\neigenvalues:", vals.round(3))
print("eigenvectors (columns):\\n", vecs.round(3))

# --- 3. Av = λv for the grain; not for other directions
print("\\nA @ [1,1]/sqrt2 =", (A @ (np.array([1, 1]) / np.sqrt(2))).round(3),
      " (= 3 * v: stretched, same direction)")
w = np.array([1.0, 0.0])
print("A @ [1,0]      =", (A @ w).round(3), " (direction changed: not grain)")`,
      },
      {
        title: 'SVD anatomy + the compression deal',
        minutes: 25,
        body: `1. Part 1 decomposes a 3×2 matrix with \`np.linalg.svd\` and verifies the anatomy: U and V have orthonormal columns (rotations), Σ is a non-negative stretch, and U @ diag(σ) @ Vᵀ rebuilds A exactly.
2. Part 2 builds a 60×60 "image" (a smiley-like pattern of blocks) that is secretly low-rank, adds noise, and prints the first ten singular values. Read the cliff: a few large σ (the pattern), then a floor of small ones (the noise). Effective rank = the count above the cliff.
3. Reconstruct at ranks k = 1, 2, 4, 8 and print the relative error and compression ratio for each. Find the k where the error stops improving meaningfully — you have separated structure from noise.
4. Write the LoRA sentence in your notes, filling the blanks from YOUR run: "keeping k=…, I stored …% of the numbers and kept …% of the structure; LoRA bets weight UPDATES are compressible exactly like this."`,
        code: `import numpy as np

rng = np.random.default_rng(7)

# --- 1. anatomy check on a small matrix
A = np.array([[3.0, 1.0], [1.0, 3.0], [0.0, 2.0]])
U, s, Vt = np.linalg.svd(A, full_matrices=False)
print("singular values:", s.round(3))
print("U columns orthonormal:", np.allclose(U.T @ U, np.eye(2)))
print("V columns orthonormal:", np.allclose(Vt @ Vt.T, np.eye(2)))
print("rebuild exact:", np.allclose(U @ np.diag(s) @ Vt, A))

# --- 2. a low-rank picture drowned in noise
img = np.zeros((60, 60))
img[10:20, 15:25] = 1.0          # left eye
img[10:20, 35:45] = 1.0          # right eye
img[38:44, 12:48] = 1.0          # mouth
img[30:34, 28:32] = 0.5          # nose
noisy = img + rng.normal(0, 0.08, img.shape)

U, s, Vt = np.linalg.svd(noisy)
print("\\nfirst 10 singular values:", s[:10].round(2))

# --- 3. truncate: keep the k most important rank-1 layers
total = np.linalg.norm(noisy)
for k in (1, 2, 4, 8):
    approx = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
    err = np.linalg.norm(noisy - approx) / total
    stored = k * (60 + 60 + 1)
    print(f"rank {k}: rel error {err:.3f}   "
          f"stored {stored}/{60*60} numbers ({stored/3600:.1%})")`,
      },
    ],
    practice: [
      {
        title: 'The rank detective',
        minutes: 20,
        body: `You get three mystery 50×50 matrices (build them per the spec, then pretend you did not): M1 = outer product of two random vectors; M2 = sum of three outer products; M3 = M2 + tiny noise (scale 1e-6). Using ONLY singular values (no np.linalg.matrix_rank at first):

(1) print each spectrum's first 8 values and state the exact or effective rank; (2) for M3, choose and justify a tolerance that recovers "rank 3" despite 50 nonzero σ; (3) verify with np.linalg.matrix_rank and its tol argument; (4) answer in two sentences: a weight-update matrix from fine-tuning shows σ = [42.1, 18.3, 9.7, 0.3, 0.29, 0.28, …]. What LoRA rank would capture it, and what would you lose at r=2?

Hints (only if stuck): an outer product u vᵀ is exactly rank 1 — the machine A = u vᵀ sends every input somewhere on the line through u; sums of k outer products have rank ≤ k.`,
      },
    ],
    project: {
      title: 'Low-rank lab report',
      brief: `Create \`svd_lab.py\` + \`lowrank_notes.md\`. The script: the smiley compression sweep (ranks 1–10) printing error and storage tables, plus your rank-detective solutions. The notes: (1) "the grain of the wood" retold in your own words with the power-iteration evidence; (2) the SVD anatomy (rotate-stretch-rotate) with your orthonormality checks as proof; (3) the compression table and the k you chose, with the structure-vs-noise argument; (4) two forward-looking paragraphs written to your future self — "Dear Day 128: LoRA constrains ΔW = B·A at rank r because…" and "Dear Day 79: PCA is SVD on centered data; the top singular directions are the best camera angles because…". These two paragraphs get re-read on those days — write them well. Commit both files.`,
      rubric: [
        'Compression sweep table covers ranks 1–10 with error and storage columns',
        'Rank detective identifies 1, 3, and effective-3 with a justified tolerance',
        'Power-iteration evidence (convergence to [1,1]/√2) recorded',
        'Orthonormality and exact-rebuild checks pass in the script',
        'Both "Dear Day" paragraphs written and technically correct',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Conflating eigenvectors and singular vectors. Eigen: square matrices, input direction preserved (Av = λv), possibly complex. SVD: any matrix, two DIFFERENT orthonormal direction sets (in and out), always real and non-negative σ. Related, not identical.',
      'Expecting exact zeros to reveal rank in real data. Noise makes every σ nonzero; effective rank = counting above a tolerance you must choose and justify. The cliff in the spectrum is your friend.',
      'Thinking low-rank approximation is lossy compression you could beat with cleverness. Eckart–Young: SVD truncation is provably the best rank-k approximation in Frobenius norm. The only question is choosing k.',
      'Believing every matrix has real eigenvectors. Rotations stretch nothing — their eigenvalues are complex. Power iteration spinning forever is the symptom you saw.',
      'Missing why LoRA is cheap: it does not compress the frozen model, it constrains the UPDATE to rank r — storage and training cost scale with r(m+n), not m·n. The bet is that adaptation needs few directions.',
      'Reading σ magnitudes without normalizing context. Singular values scale with the data; compare them to each other (ratios, cumulative energy), not to constants remembered from another matrix.',
    ],
    quiz: [
      {
        q: 'v is an eigenvector of A with eigenvalue 3. What is A @ (A @ v)?',
        o: [
          'A vector orthogonal to v',
          '9v — each application stretches by 3 along the same direction',
          '3v — eigenvalues do not compound',
          'The zero vector',
        ],
        x: 1,
        w: 'Av = 3v, so A(Av) = A(3v) = 3·Av = 9v. Repeated application compounds the stretch — which is exactly why power iteration converges toward the dominant grain direction.',
        revisit: 52,
      },
      {
        q: 'A 1000×1000 matrix has singular values [95, 40, 12, 0.02, 0.01, …]. The best summary is:',
        o: [
          'It is full rank and incompressible',
          'Its effective rank is ~3 — a rank-3 truncation keeps almost all its behavior in ~0.6% of the storage',
          'It has three eigenvectors',
          'It cannot be inverted',
        ],
        x: 1,
        w: 'Three singular values tower over a near-zero floor: the machine is effectively rank 3 plus noise. Storing k(m+n+1) = 3×2001 ≈ 6k numbers instead of 10⁶ keeps the structure — the low-rank deal.',
        revisit: 52,
      },
      {
        q: 'LoRA fine-tunes by learning ΔW = B·A with B ∈ ℝ^(m×r), A ∈ ℝ^(r×n), r ≈ 8. What is the underlying mathematical bet?',
        o: [
          'That the base model is rank 8',
          'That the useful weight UPDATE has low rank — few independent directions of change suffice to adapt the machine',
          'That matrix multiplication is commutative',
          'That r must equal the number of layers',
        ],
        x: 1,
        w: 'B·A can only ever produce a rank-≤r matrix, so LoRA constrains the adaptation to r directions. Empirically fine-tuning changes weights along few important directions — today\'s truncation intuition, applied to ΔW. Day 128 tests the bet.',
        revisit: 52,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Essence of Linear Algebra, ch. 14 (eigenvectors & eigenvalues)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '20 min' },
      { label: 'MIT OCW 18.06 — lectures 21–22 (eigenvalues) & 29 (SVD)', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', type: 'course', time: '40 min' },
      { label: 'Mathematics for Machine Learning — ch. 4 (matrix decompositions)', url: 'https://mml-book.github.io/', type: 'book', time: '30 min' },
      { label: 'Immersive Linear Algebra — interactive decomposition figures', url: 'http://immersivemath.com/ila/index.html', type: 'book', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 50–51)', minutes: 10 },
      { activity: 'ELI5 + tech read + 3B1B eigenvectors chapter', minutes: 25 },
      { activity: 'Guided: power iteration + SVD compression', minutes: 45 },
      { activity: 'Practice: the rank detective', minutes: 20 },
      { activity: 'Project: low-rank lab report', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Power iteration converges to the known eigenvector; rotation counterexample noted',
      'SVD anatomy checks pass; compression sweep table recorded',
      'Rank detective solved with a justified tolerance',
      'Both "Dear Day 128 / Day 79" paragraphs committed',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 51\'s flattener was a rank-deficient machine before you had the word; its parallel columns were dependent columns. Power iteration is just repeated Day 51 composition, and every σᵢuᵢvᵢᵀ layer is built from Day 50 outer products of unit vectors.',
      forward: 'Day 79 runs SVD on centered data and calls it PCA — your "best camera angle" for visualizing Day 92\'s embedding spaces. Day 128 makes the low-rank bet operational: choosing LoRA\'s r IS choosing a truncation rank for the adaptation. Tomorrow pivots from the shape of transformations to the shape of change: derivatives.',
    },
    flashcards: [
      { f: 'Eigenvector in one line?', b: 'A direction the machine only stretches: Av = λv. The grain of the wood; λ is the stretch.' },
      { f: 'SVD anatomy?', b: 'A = U Σ Vᵀ: rotate (Vᵀ) → stretch by singular values (Σ) → rotate (U). Works for ANY matrix.' },
      { f: 'Rank, practically?', b: 'Number of independent directions the matrix produces = nonzero (above-tolerance) singular values.' },
      { f: 'Why is SVD truncation special?', b: 'Eckart–Young: keeping the top-k singular layers is the provably best rank-k approximation.' },
      { f: 'LoRA\'s low-rank bet?', b: 'ΔW = B·A with tiny rank r: fine-tuning changes weights along few directions, so r(m+n) params suffice (Day 128).' },
      { f: 'Power iteration?', b: 'Repeatedly apply A and normalize: converges to the dominant eigenvector. Ancestor of PageRank.' },
    ],
    deepDive: [
      { label: 'PCA = SVD on centered data', note: 'Center the data matrix, take its SVD: right singular vectors are the principal components, σᵢ² the explained variances. Day 79 does this properly; peek now if curious.' },
      { label: 'The LoRA paper (Hu et al. 2021)', url: 'https://arxiv.org/abs/2106.09685', note: 'Section 4.1 states the low-rank hypothesis in two sentences you can now read. Save the full read for Day 128.' },
    ],
  },
  {
    id: 'd053', day: 53, week: 8, phase: 3, kind: 'lesson',
    title: 'Derivatives & Gradients',
    analogy: 'The sensitivity dial',
    objectives: [
      'Define the derivative as sensitivity: how much output moves per tiny input nudge',
      'Compute numerical derivatives with central differences and choose a sane step size h',
      'Compute partial derivatives of a two-variable function by hand and verify with NumPy',
      'Explain the gradient as the steepest-ascent direction and demonstrate it by sampling directions',
      'State when analytic beats numerical differentiation and why ML uses both (gradient checking)',
    ],
    prereqs: [
      { day: 50, label: 'Vectors — the gradient is one' },
      { day: 22, label: 'Reading growth from numbers' },
    ],
    eli5: `You are in the shower fiddling with an unfamiliar dial. The question your hand is asking — "if I nudge this a tiny bit, how much does the temperature change, and which way?" — is a derivative. Nudge the dial a hair clockwise, temperature jumps 3 degrees: the derivative is +3 (steep! be careful!). Nudge it and almost nothing happens: derivative near 0 (a numb zone — turn harder). Temperature DROPS as you turn up: negative derivative (the plumber crossed the pipes). The derivative is not a formula first — it is a number attached to a point, measuring local sensitivity: output change per unit of tiny input change.

Now give the shower two dials — hot and cold. Each has its own sensitivity while the other is held still (**partial derivatives**), and the pair of them, written as a vector, is the **gradient**. Here is the one fact to carry forever: that little vector of sensitivities points exactly in the direction to turn BOTH dials at once for the fastest temperature increase. Every neural network ever trained is someone reading billions of these dials and nudging every single one a tiny step the OPPOSITE way — downhill, toward less error. Today you build the dial-reading machinery with your own hands; tomorrow chains dials together; Thursday you ride downhill.`,
    why: `Training IS derivatives: loss.backward() on Day 87 computes a gradient — one sensitivity number per parameter, billions of them — and every optimizer step nudges parameters against it. Engineers who internalize "gradient = local sensitivity" debug training runs instead of staring at them: exploding loss means huge sensitivities compounding (Day 89's clipping), a flat loss means numb dials (dead units, vanishing gradients). The numerical-vs-analytic distinction becomes gradient checking on Day 86 — the standard test for a hand-written backward pass — and "wiggle it and watch" remains your fallback tool for any black box, including prompt changes against an eval score.`,
    tech: `### The derivative, honestly defined

For f: ℝ → ℝ, the derivative at x is f'(x) = lim as h→0 of (f(x+h) − f(x))/h — the slope of the tangent line, the local exchange rate between input and output. Near x, f(x+δ) ≈ f(x) + f'(x)·δ: the function impersonates a straight line if you zoom in far enough. That linear impersonation is the whole business model of calculus — and of gradient descent, which repeatedly trusts it for one small step.

### Numerical derivatives and the two-sided error budget

You can estimate f'(x) by actually nudging: the forward difference (f(x+h) − f(x))/h has error O(h), while the **central difference** (f(x+h) − f(x−h))/(2h) cancels the leading error term and achieves O(h²) — dramatically better for free. But h has a floor: too large and the linear impersonation breaks (truncation error); too small and floating-point subtraction of near-equal numbers destroys precision (round-off error). The sweet spot for central differences in float64 sits around h ≈ 1e-5·(1+|x|); you will map this U-shaped error curve yourself today. Numerical differentiation costs one or two function evaluations PER INPUT — fine for checking, catastrophic for a billion parameters, which is why autodiff (Day 87) exists.

### Partials and the gradient

For f(x, y), the partial ∂f/∂x is the derivative treating y as a constant — one dial at a time. The **gradient** ∇f = [∂f/∂x, ∂f/∂y] packages all sensitivities into a vector (a Day 50 object!). Two facts give it its power. First, for a small step in unit direction u, the change is approximately ∇f·u — a dot product, so the gradient is a linear price list for moving in any direction. Second, that dot product is maximized when u points along ∇f: **the gradient is the steepest-ascent direction**, and −∇f the steepest descent. Perpendicular to ∇f, the dot product is zero — those are the level curves, directions of no change. Where ∇f = 0 (all dials numb): a minimum, maximum, or saddle — Day 54 sorts them out.

### Analytic derivatives — exact and cheap

Rules you will actually use: d/dx xⁿ = n·xⁿ⁻¹, linearity, product rule, and eˣ, ln x, and 1/x as furniture. For f(x,y) = x² + 3xy + y², you can write ∇f = [2x + 3y, 3x + 2y] in one line and evaluate it exactly for the cost of arithmetic. The professional pattern, from Day 86 onward: derive (or let autodiff derive) analytically, then spot-check numerically at a few points. Agreement to ~1e-7 means your math and your code are telling the same story.`,
    viz: 'gradient-descent',
    guided: [
      {
        title: 'Build a derivative machine and find its sweet spot',
        minutes: 20,
        body: `1. Run part 1: central-difference derivative of f(x) = x³ − 2x at x = 2.0. The analytic answer is 3x² − 2 = 10 exactly — confirm the estimate agrees to ~1e-10.
2. Part 2 sweeps h from 1e-1 down to 1e-13 and prints the error at each. Find the U-shape: error falls as h shrinks (truncation fading) then RISES again (float round-off). Record your best h and worst h.
3. Say the two failure modes out loud: big h = the function is not linear at that scale; tiny h = subtracting nearly equal floats leaves noise, then dividing by tiny h amplifies it.
4. Swap in forward difference (part 3) and compare its best error to central's at the same h values — see the O(h) vs O(h²) gap as real digits lost.`,
        code: `import numpy as np

f = lambda x: x**3 - 2 * x
fprime_true = lambda x: 3 * x**2 - 2       # analytic, for judging

def central(f, x, h):
    return (f(x + h) - f(x - h)) / (2 * h)

def forward(f, x, h):
    return (f(x + h) - f(x)) / h

x = 2.0
print(f"analytic f'(2) = {fprime_true(x)}")
print(f"central h=1e-5 = {central(f, x, 1e-5):.12f}")

# --- 2. the U-shaped error curve
print("\\n      h      central error   forward error")
for exp in range(1, 14):
    h = 10.0 ** -exp
    ec = abs(central(f, x, h) - fprime_true(x))
    ef = abs(forward(f, x, h) - fprime_true(x))
    print(f"  1e-{exp:02d}   {ec:12.2e}   {ef:12.2e}")
# central bottoms out ~1e-5/1e-6; forward needs smaller h and still loses`,
      },
      {
        title: 'The gradient really is the steepest way up',
        minutes: 25,
        body: `The function: f(x, y) = x² + 3xy + y² (an elliptical bowl-ish surface, tilted).

1. Derive ∇f by hand on paper first: ∂f/∂x = 2x + 3y, ∂f/∂y = 3x + 2y. Evaluate at the point (1, 2). You should get [8, 7].
2. Run part 1: the numerical gradient (central difference per coordinate) at (1, 2). Confirm it matches your hand answer to ~1e-9 — your first gradient check, the exact ritual Day 86 uses on backprop.
3. Part 2 is the payoff: from (1, 2), step a fixed tiny distance in 24 compass directions and measure the actual increase in f. The printout marks the best direction found by brute force — confirm it aligns with ∇f/‖∇f‖ (cosine ≈ 1.0), that the worst is −∇f, and that the two zero-change directions are perpendicular to the gradient.
4. Write the price-list sentence in your notes: change ≈ ∇f·u means the gradient prices every direction, and the dot product (Day 50!) is maximized along it.`,
        code: `import numpy as np

f = lambda x, y: x**2 + 3*x*y + y**2
grad_true = lambda x, y: np.array([2*x + 3*y, 3*x + 2*y])

def num_grad(f, x, y, h=1e-6):
    dx = (f(x + h, y) - f(x - h, y)) / (2 * h)
    dy = (f(x, y + h) - f(x, y - h)) / (2 * h)
    return np.array([dx, dy])

p = np.array([1.0, 2.0])
g_hand = grad_true(*p)
g_num = num_grad(f, *p)
print(f"hand: {g_hand}   numerical: {g_num.round(9)}")
print(f"gradient check max diff: {np.abs(g_hand - g_num).max():.2e}")

# --- 2. brute-force the best direction; the gradient predicted it
step = 1e-4
best = (None, -np.inf)
print("\\n  dir(deg)   delta f")
for deg in range(0, 360, 15):
    u = np.array([np.cos(np.radians(deg)), np.sin(np.radians(deg))])
    delta = f(*(p + step * u)) - f(*p)
    if delta > best[1]:
        best = (deg, delta)
    print(f"    {deg:3d}     {delta:+.3e}")

u_best = np.array([np.cos(np.radians(best[0])), np.sin(np.radians(best[0]))])
u_grad = g_hand / np.linalg.norm(g_hand)
print(f"\\nbrute-force best: {best[0]} deg")
print(f"gradient direction: {np.degrees(np.arctan2(*u_grad[::-1])):.0f} deg")
print(f"cosine(best, gradient) = {float(u_best @ u_grad):.4f}  (~1.0)")`,
      },
    ],
    practice: [
      {
        title: 'Sensitivity clinic',
        minutes: 20,
        body: `Three exercises, hand-then-verify. (1) For f(x) = 5x⁴ − x² + 7, derive f'(x), evaluate at x = −1, 0, 2, and verify each with your central-difference machine. (2) For g(x, y) = (x − 3)² + 2(y + 1)², derive ∇g, find the point where ∇g = [0, 0] BY HAND (set both partials to zero), and explain in one sentence what that point is on the surface. (3) The ML shape: for a single data point, loss(w) = (w·2.0 − 3.0)² — a prediction w×2 against target 3. Derive dloss/dw, find the w where it is zero, and check that your central-difference machine agrees at w = 0 and w = 5.

Constraints: paper first, code second; every analytic answer must be verified numerically to at least 1e-6.

Hints (only if stuck): (3) is the chain rule you will formalize tomorrow — write loss = u² with u = 2w − 3 and multiply the sensitivities (2u)·(2).`,
      },
    ],
    project: {
      title: 'gradcheck.py — your derivative test kit',
      brief: `Build the tool you will still be using on Day 86: \`gradcheck.py\` with (1) \`numderiv(f, x, h=1e-5)\` — central difference, scalar; (2) \`numgrad(f, p, h=1e-5)\` — central-difference gradient for f taking an ndarray point of ANY dimension (loop coordinates, nudge one at a time); (3) \`check(f, analytic_grad, points)\` — compares analytic vs numerical at each point and reports max absolute and relative difference with a PASS/FAIL verdict at 1e-6. Include a pytest suite testing all three against the day's functions plus one 5-dimensional quadratic. Then \`gradients_notes.md\`: the U-curve table with your best-h reading, the steepest-ascent experiment result, and a five-line explanation of why numgrad's cost (2n evaluations for n dims) is fine for CHECKING but absurd for TRAINING a billion-parameter model (the sentence that makes Day 87's autograd feel inevitable).`,
      rubric: [
        'numgrad works for any dimension; verified on the 5-D quadratic',
        'check() reports max abs/rel difference and a threshold verdict',
        'Pytest suite passes, covering scalar, 2-D, and 5-D cases',
        'U-curve table recorded with best h identified and both failure modes named',
        'Cost argument (2n evals vs autodiff) written correctly',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Treating the derivative as "the formula" instead of a number at a point. Sensitivity is local: f\'(2) = 10 says nothing about x = −3. Training reads sensitivities at the CURRENT parameters, every step.',
      'Making h as small as possible "for accuracy." Below ~1e-8 in float64, round-off dominates and estimates get WORSE. You mapped the U-curve; trust it.',
      'Using forward differences when central costs the same order and buys O(h²). One extra evaluation per coordinate for orders of magnitude better error is the best trade in numerics.',
      'Forgetting the other variables when taking a partial. ∂/∂x of 3xy is 3y, not 3 — y is frozen, not deleted. Hand-derive slowly; the numerical check catches this instantly.',
      'Thinking the gradient points "toward the minimum." It points steepest UPHILL from here — descent follows −∇f, and even that is only locally optimal, not aimed at the minimum (Day 55 shows the zig-zag consequences).',
      'Believing zero gradient means minimum. It means FLAT — minimum, maximum, or saddle. Day 54 shows why saddles, not minima, dominate high-dimensional landscapes.',
    ],
    quiz: [
      {
        q: 'f\'(x) = −4 at the current x. What does a tiny step of +0.01 in x do to f?',
        o: [
          'Increases f by about 0.04',
          'Decreases f by about 0.04 — sensitivity is negative, output moves opposite the nudge',
          'Nothing until x moves by at least 1',
          'Cannot be determined without the formula for f',
        ],
        x: 1,
        w: 'The linear impersonation: Δf ≈ f\'(x)·Δx = −4 × 0.01 = −0.04. The derivative at a point is exactly this local exchange rate — no formula needed.',
        revisit: 53,
      },
      {
        q: 'Your central-difference estimate gets WORSE when you shrink h from 1e-6 to 1e-12. Why?',
        o: [
          'The function is not differentiable',
          'Round-off: f(x+h) and f(x−h) become nearly identical floats; their subtraction leaves noise that division by 2h amplifies',
          'Central differences require h > 1e-6 by definition',
          'The truncation error grows as h shrinks',
        ],
        x: 1,
        w: 'Truncation error falls with h but float64 has ~16 digits: subtracting near-equal numbers cancels most of them, and dividing by a tiny 2h blows the residue up. The U-shaped error curve has a floor near h ≈ 1e-5–1e-8.',
        revisit: 53,
      },
      {
        q: 'At point p, ∇f = [3, 4]. Which unit direction gives approximately ZERO change in f for a tiny step?',
        o: [
          '[3, 4]/5',
          '[−3, −4]/5',
          '[4, −3]/5 — perpendicular to the gradient, along the level curve',
          'No direction gives zero change',
        ],
        x: 2,
        w: 'Change ≈ ∇f·u. Perpendicular directions have dot product zero — they run along the contour line. Along [3,4]/5 you climb fastest (+5 per unit); against it you descend fastest.',
        revisit: 50,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Essence of Calculus, chapters 1–3 (derivatives, sensitivity)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr', type: 'video', time: '35 min' },
      { label: 'Khan Academy — Calculus 1: derivatives introduction', url: 'https://www.khanacademy.org/math/calculus-1', type: 'course', time: '30 min' },
      { label: 'Mathematics for Machine Learning — ch. 5 (vector calculus)', url: 'https://mml-book.github.io/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 50–52)', minutes: 10 },
      { activity: 'ELI5 + tech read + 3B1B calculus ch. 1–3', minutes: 25 },
      { activity: 'Guided: derivative machine + steepest-ascent proof', minutes: 45 },
      { activity: 'Practice: sensitivity clinic', minutes: 20 },
      { activity: 'Project: gradcheck.py', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'U-curve mapped; best h recorded with both failure modes explained',
      'Hand gradient at (1,2) matches numerical to 1e-9; compass experiment confirms steepest ascent',
      'Sensitivity clinic done paper-first, all answers verified numerically',
      'gradcheck.py committed with passing tests including the 5-D case',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'The gradient is a Day 50 vector, and "change ≈ ∇f·u" is a Day 50 dot product doing pricing work — steepest ascent is literally maximal alignment. The h sweep reused Day 22\'s habit of reading behavior from measured tables.',
      forward: 'Tomorrow the chain rule composes sensitivities through nested functions — the one rule backprop needs — and Day 55 turns −∇f into an algorithm with a step size. gradcheck.py returns verbatim on Day 86 to audit your hand-written backprop, and Day 87 replaces numgrad\'s 2n evaluations with autograd\'s single backward pass.',
    },
    flashcards: [
      { f: 'Derivative in one sentence?', b: 'Local sensitivity: output change per tiny input nudge — the slope of the tangent at that point.' },
      { f: 'Central vs forward difference?', b: 'Central (f(x+h)−f(x−h))/2h has O(h²) error vs forward\'s O(h) — better for one extra evaluation.' },
      { f: 'Why does tiny h ruin numerical derivatives?', b: 'Float round-off: near-equal subtraction leaves noise, division by 2h amplifies it. Sweet spot ~1e-5.' },
      { f: 'What is the gradient, geometrically?', b: 'The vector of partials; points steepest uphill; ⊥ to level curves; ∇f·u prices any direction u.' },
      { f: 'Gradient checking?', b: 'Compare analytic (or autodiff) gradients against central differences at sample points; agreement ~1e-7 = trust the code (Day 86 ritual).' },
      { f: 'Why not train networks with numerical gradients?', b: '2n function evaluations for n parameters — billions of forward passes per step. Autodiff does it in one backward pass.' },
    ],
    deepDive: [
      { label: 'Directional derivatives, formally', note: 'D_u f = ∇f·u for unit u — the compass experiment as a theorem. MML book §5.2 proves the steepest-ascent claim you verified empirically.' },
    ],
  },
  {
    id: 'd054', day: 54, week: 8, phase: 3, kind: 'lesson',
    title: 'Chain Rule & Optimization',
    analogy: 'Gears in a chain',
    objectives: [
      'State the chain rule as sensitivity multiplication through composed functions',
      'Draw a computational graph and compute d(loss)/d(parameter) by walking it backwards',
      'Verify every hand-derived gradient with the Day 53 gradcheck kit',
      'Distinguish convex from non-convex loss surfaces and what each promises an optimizer',
      'Explain minima, maxima, and saddle points, and why saddles dominate in high dimensions',
    ],
    prereqs: [
      { day: 53, label: 'Derivatives & gradients' },
      { day: 27, label: 'Recursion — decomposing nested structure' },
    ],
    eli5: `Picture a bicycle drivetrain with several gears in a chain. You turn the pedal (a parameter); it turns gear A, which turns gear B, which turns the wheel (the loss). Question: how sensitive is the wheel to the pedal? Answer: multiply the gear ratios. If pedal→A triples the spin, A→B doubles it, and B→wheel halves it, then pedal→wheel is 3 × 2 × 0.5 = 3. That is the **chain rule** — the entire chain rule. Sensitivities of composed stages multiply.

Two consequences run all of deep learning. First, you can compute any long chain's sensitivity by walking backwards from the wheel, multiplying local ratios as you go — do it once and you know how EVERY gear in the chain affects the wheel. That backwards walk has a famous name: backpropagation (Day 86). Second, multiplication compounds: ten gears of ratio 2 give 1,024; ten gears of ratio 0.5 give about 0.001. Long chains make sensitivities explode or vanish — the exact disease deep networks suffer (Day 89 treats it). And once you can read sensitivities through any chain, optimization is just: nudge every pedal slightly the way that lowers the wheel — which works beautifully in a single smooth valley (convex) and gets interesting in mountain ranges with fake-flat mountain passes (saddle points) — the actual terrain of neural network training.`,
    why: `The chain rule is the single most important equation in modern AI: backprop is nothing but the chain rule executed efficiently over a computational graph, and on Day 86 you will implement it in ~60 lines and feel the whole mystery evaporate. The compounding intuition explains real production pathologies — vanishing and exploding gradients, why residual connections exist (Day 95), why gradient clipping is in every training script (Day 89). And the convex/non-convex distinction sets expectations you will defend in interviews: why linear regression has one right answer while neural nets have many good ones, and why "it converged" never means "it found THE minimum."`,
    tech: `### The chain rule, precisely

For y = f(g(x)): dy/dx = f'(g(x)) · g'(x) — the outer sensitivity evaluated at the inner value, times the inner sensitivity. Deeper nesting multiplies more links: dy/dx = (dy/du)(du/dv)(dv/dx). Each factor is LOCAL — a stage's sensitivity to its immediate input — and locality is the engineering miracle: no stage needs to know the whole pipeline, only its own ratio.

### Computational graphs and the backward walk

Write a computation as a graph of primitive nodes. For a one-neuron model's loss: u = w·x, v = u + b, r = v − y_target, L = r². Forward pass: with x=2, w=1.5, b=0.5, y=5 → u=3, v=3.5, r=−1.5, L=2.25. Backward pass, seeding dL/dL = 1 and multiplying local derivatives: dL/dr = 2r = −3; dL/dv = −3 (r = v − y has ratio 1); dL/db = −3; dL/du = −3; dL/dw = dL/du · x = −6. Interpretation checks out: increasing w raises the prediction toward the target, reducing loss — negative sensitivity. When a variable feeds MULTIPLE paths, its sensitivities ADD (the multivariable chain rule): total effect = sum over paths of the product along each path. Multiply along paths, add across paths — that sentence IS backprop.

### Compounding: vanish and explode

A chain of n stages multiplies n local ratios. Ratios systematically below 1 shrink the product exponentially (vanishing gradients — early stages learn nothing); above 1, it blows up (exploding gradients — training NaNs). Depth is a chain length: this is why 100-layer networks needed architectural rescue (residual connections give gradients a ratio-1 shortcut path) and why clipping exists. You will meet all three again with instruments on Days 86–89.

### The terrain: convex vs non-convex

A function is **convex** if every chord lies above the graph — one global valley, no traps; gradient descent with a sane step size wins, and linear/logistic regression (Days 56, 72) live here. Neural network losses are **non-convex**: multiple minima, ridges, plateaus, and above all **saddle points** — flat points that curve up in some directions and down in others. In high dimensions saddles vastly outnumber local minima (a flat point needs curvature up in EVERY one of a million directions to be a minimum — combinatorially unlikely), so the practical enemy is slow escape from near-flat saddle regions, not "getting stuck in a bad minimum." Empirically, most local minima found by SGD in large networks are good enough — a claim Day 55's experiments will make tangible.`,
    viz: 'chain-rule',
    guided: [
      {
        title: 'Walk the graph backwards, by hand and by code',
        minutes: 25,
        body: `The model: prediction = w·x + b, loss L = (w·x + b − y)², at x=2, y=5, w=1.5, b=0.5.

1. On paper, draw the graph (w,x → u = w·x → v = u+b → r = v−y → L = r²) and run the forward pass, writing each node's value.
2. Walk backwards on paper: dL/dr, then dL/dv, dL/db, dL/du, dL/dw, multiplying one local ratio per step. You should land on dL/dw = −6 and dL/db = −3.
3. Run the starter — it does the same walk with printed narration. Confirm every intermediate matches your paper.
4. The payoff move: check both against \`numgrad\` from your Day 53 gradcheck kit (already imported in the starter). Agreement to ~1e-6 = your first verified backprop.
5. Nudge test: bump w by +0.01 and recompute L. Confirm L changes by ≈ −6 × 0.01 — the sensitivity means what it says.`,
        code: `import numpy as np

x, y = 2.0, 5.0
w, b = 1.5, 0.5

# --- forward pass, saving every node
u = w * x            # 3.0
v = u + b            # 3.5
r = v - y            # -1.5
L = r ** 2           # 2.25
print(f"forward: u={u} v={v} r={r} L={L}")

# --- backward pass: multiply local ratios from L back to each input
dL_dL = 1.0
dL_dr = dL_dL * 2 * r        # d(r^2)/dr = 2r        -> -3.0
dL_dv = dL_dr * 1.0          # d(v-y)/dv = 1         -> -3.0
dL_db = dL_dv * 1.0          # d(u+b)/db = 1         -> -3.0
dL_du = dL_dv * 1.0          # d(u+b)/du = 1         -> -3.0
dL_dw = dL_du * x            # d(w*x)/dw = x         -> -6.0
print(f"backward: dL/dw={dL_dw}  dL/db={dL_db}")

# --- verify against Day 53's central differences
def numgrad(f, p, h=1e-6):
    g = np.zeros_like(p)
    for i in range(len(p)):
        q1, q2 = p.copy(), p.copy()
        q1[i] += h; q2[i] -= h
        g[i] = (f(q1) - f(q2)) / (2 * h)
    return g

loss = lambda p: (p[0] * x + p[1] - y) ** 2
g_num = numgrad(loss, np.array([w, b]))
print(f"numerical: dL/dw={g_num[0]:.6f}  dL/db={g_num[1]:.6f}")
print("gradient check:", np.allclose([dL_dw, dL_db], g_num, atol=1e-5))

# --- the nudge test: sensitivities predict reality
L_nudged = (1.51 * x + b - y) ** 2
print(f"nudge w by +0.01: dL predicted {dL_dw * 0.01:+.4f}, "
      f"actual {L_nudged - L:+.4f}")`,
      },
      {
        title: 'Compounding chains, and the terrain tour',
        minutes: 20,
        body: `1. Part 1 chains the SAME squashing function (logistic sigmoid) 1, 5, 10, and 20 times and computes d(output)/d(input) through the chain. Watch the gradient shrink toward zero as depth grows — sigmoid's local ratio maxes at 0.25, and 0.25²⁰ is dust. This is vanishing gradients, measured.
2. Change the multiplier to a stage with ratio ~1.7 (part 1b) and watch 20 stages explode past 10⁴. Write both numbers in your notes next to the words "why depth was hard before residuals + careful init."
3. Part 2 tours three 2-D surfaces at their critical points: a convex bowl, a double-well (two minima, a maximum between), and the classic saddle z = x² − y². For each, the script reports the gradient (≈0 at all three!) and what a small step in each axis direction does. State for each: min, max, or saddle — and why the gradient alone could not tell you.
4. The high-dim punchline, out loud: a critical point is a MINIMUM only if it curves up in every direction; with a million directions, "up in all of them" is the rare case — most flat points are saddles.`,
        code: `import numpy as np

sig = lambda x: 1 / (1 + np.exp(-x))
dsig = lambda x: sig(x) * (1 - sig(x))     # local ratio, max 0.25

# --- 1. vanishing: multiply local ratios through a deep chain
for depth in (1, 5, 10, 20):
    x = 0.5
    grad = 1.0
    for _ in range(depth):
        grad *= dsig(x)      # chain rule: multiply each stage's ratio
        x = sig(x)
    print(f"depth {depth:2d}: d(out)/d(in) = {grad:.2e}")

# --- 1b. exploding: a stage with ratio > 1
grad = 1.0
for _ in range(20):
    grad *= 1.7
print(f"20 stages of ratio 1.7: {grad:.2e}  <- explosion")

# --- 2. three terrains, all with gradient ~0 at the origin/critical point
surfaces = {
    "bowl   z=x^2+y^2 at (0,0)":   (lambda x, y: x**2 + y**2, (0, 0)),
    "well   z=x^4-2x^2+y^2 at (0,0)": (lambda x, y: x**4 - 2*x**2 + y**2, (0, 0)),
    "saddle z=x^2-y^2 at (0,0)":   (lambda x, y: x**2 - y**2, (0, 0)),
}
h = 0.1
for name, (f, (cx, cy)) in surfaces.items():
    gx = (f(cx + 1e-6, cy) - f(cx - 1e-6, cy)) / 2e-6
    along_x = f(cx + h, cy) - f(cx, cy)
    along_y = f(cx, cy + h) - f(cx, cy)
    print(f"\\n{name}\\n  gradient ~ {gx:.1e};  step +x: {along_x:+.3f}, "
          f"step +y: {along_y:+.3f}")
# bowl: up/up (min). well at (0,0): DOWN along x (max there), up along y -> saddle!
# saddle: up along x, down along y -> saddle by name and nature.`,
      },
    ],
    practice: [
      {
        title: 'Chain rule reps, graded by your own checker',
        minutes: 20,
        body: `Derive each gradient BY HAND via a drawn graph, then verify with your gradcheck kit; all must pass at 1e-5. (1) L(w) = (sig(w·x) − y)² at x=1.5, y=0.8, w=0.3 — a one-neuron classifier's loss; reuse dsig. (2) L(w, b) = (w·x₁ + b − y₁)² + (w·x₂ + b − y₂)² with data (1, 2) and (2, 3.5) — TWO data points: note how the paths add (sum across paths, multiply along each). (3) f(x) = ln(1 + eˣ) at x = −2, 0, 3 — derive f'(x), simplify, and recognize the result (it is the sigmoid — softplus's sensitivity dial is sigmoid, a fact Day 85 reuses).

Constraints: show the graph and per-node locals for (1) and (2) in your notes; no symbolic shortcuts until your graph walk produced the answer once.

Hints (only if stuck): (2) is dL/dw = Σᵢ 2rᵢxᵢ with rᵢ the per-point residual — the shape of tomorrow's regression gradient.`,
      },
    ],
    project: {
      title: 'The backprop-on-paper dossier',
      brief: `Create \`chainrule_dossier.md\` — the artifact you will re-read the night before Day 86. Contents: (1) the one-neuron graph drawn in ASCII with forward values and backward sensitivities at every node, from today's guided lab; (2) the multipath rule ("multiply along a path, add across paths") with your two-data-point exercise as the worked example; (3) the compounding table — sigmoid-chain gradients at depths 1/5/10/20 and the ratio-1.7 explosion — under the heading "why deep training needs help"; (4) the terrain field guide: bowl/well/saddle with the step-test evidence and the high-dimensional saddle argument in your own words; (5) a self-test: three fresh compositions (pick your own) derived by graph walk with gradcheck PASS lines pasted in. Commit alongside \`chain_lab.py\` containing all runnable code.`,
      rubric: [
        'ASCII graph shows forward values AND backward sensitivities at every node',
        'Two-point exercise demonstrates add-across-paths with matching gradcheck output',
        'Compounding table includes both vanishing and exploding runs with numbers',
        'Terrain guide classifies all three critical points with step-test evidence',
        'Self-test compositions pass gradcheck at 1e-5, output pasted',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Memorizing "outer times inner" without evaluating the outer at the INNER VALUE. f\'(g(x))·g\'(x) — that f\' is read at g(x), not at x. The computational graph makes this impossible to get wrong: each node differentiates at its own recorded input.',
      'Forgetting to ADD when a variable feeds multiple paths. w appearing in two loss terms contributes the SUM of both paths\' products. Multiply along, add across — half of backprop bugs are a missing add.',
      'Believing vanishing gradients are a rare pathology. Chain twenty ratio-0.25 stages and it is arithmetic, not bad luck. Architectures (residuals), activations (ReLU), and init schemes exist specifically to keep local ratios near 1.',
      'Assuming gradient ≈ 0 means "found a minimum." Flat means flat: minimum, maximum, or (overwhelmingly, in high dimensions) saddle. Curvature — what steps in each direction do — makes the diagnosis.',
      'Expecting neural training to find THE global minimum. Non-convex losses have many minima; SGD finds A good one, and empirically that is fine. Convexity (regression) is the special case with a uniqueness guarantee, not the norm.',
      'Skipping the numerical check because the algebra "was easy." The nudge test and gradcheck take seconds and catch sign errors that would otherwise cost you an evening on Day 86. Verify every derivation today, while it is cheap.',
    ],
    quiz: [
      {
        q: 'y = f(g(x)) with g(2) = 5, g\'(2) = 3, f\'(5) = −2. What is dy/dx at x = 2?',
        o: ['−10', '−6 — multiply the sensitivities: f\'(g(2)) · g\'(2) = (−2)(3)', '15', '1'],
        x: 1,
        w: 'Chain rule: dy/dx = f\'(g(x))·g\'(x), with the outer derivative evaluated at the inner VALUE g(2)=5. So (−2)·3 = −6. Gear ratios multiply.',
        revisit: 54,
      },
      {
        q: 'A 30-stage chain has local sensitivity ~0.5 per stage. The end-to-end gradient is ~10⁻⁹. This phenomenon and its standard architectural fix are…',
        o: [
          'Overfitting; add dropout',
          'Vanishing gradients; residual (skip) connections that give the gradient a ratio-1 path',
          'Exploding gradients; increase the learning rate',
          'Underflow; use bigger floats',
        ],
        x: 1,
        w: '0.5³⁰ ≈ 10⁻⁹: early stages receive no learning signal. Residual connections add an identity path whose local ratio is exactly 1, letting gradients flow through depth (Day 95 shows them inside transformers).',
        revisit: 54,
      },
      {
        q: 'At a critical point of a million-parameter loss, the gradient is zero. Why is "saddle point" the safest bet?',
        o: [
          'Because saddles have the lowest loss',
          'A minimum needs upward curvature in EVERY direction; with a million directions, mixed up/down is combinatorially far more likely',
          'Because SGD only ever visits saddles',
          'It is not — local minima are more common',
        ],
        x: 1,
        w: 'Each direction independently curving up is the rare all-heads coin flip; any single downward direction makes it a saddle. High-dimensional flat points are overwhelmingly saddles — the optimizer\'s real terrain.',
        revisit: 54,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Essence of Calculus, ch. 4 (chain rule, visually)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr', type: 'video', time: '20 min' },
      { label: 'Karpathy — Zero to Hero, lecture 1 (micrograd: the graph walk you just did, extended)', url: 'https://karpathy.ai/zero-to-hero.html', type: 'course', time: '30 min' },
      { label: 'Khan Academy — Calculus 1: chain rule practice', url: 'https://www.khanacademy.org/math/calculus-1', type: 'course', time: '20 min' },
      { label: 'Mathematics for Machine Learning — ch. 5.6 (backpropagation & autodiff)', url: 'https://mml-book.github.io/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 50–53)', minutes: 10 },
      { activity: 'ELI5 + tech read + 3B1B chain rule chapter', minutes: 25 },
      { activity: 'Guided: backward graph walk + compounding & terrain', minutes: 45 },
      { activity: 'Practice: chain rule reps with gradcheck', minutes: 20 },
      { activity: 'Project: backprop-on-paper dossier', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Paper backward walk matches code and numgrad at 1e-6; nudge test passes',
      'Vanishing and exploding chains measured and recorded',
      'All three practice gradients pass gradcheck at 1e-5',
      'Dossier committed with graph, multipath example, and terrain guide',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every backward step multiplied a Day 53 local sensitivity, and gradcheck.py graded your algebra. Decomposing nested computation into a graph is Day 27\'s recursion instinct pointed at calculus.',
      forward: 'Tomorrow, −∇L plus a step size becomes gradient descent and you will watch trajectories navigate exactly the terrains you toured. Day 86 scales today\'s backward walk into micrograd (Karpathy\'s lecture 1 is the same walk with code that grows); Day 89 treats vanishing/exploding with instruments; Day 95 shows residual connections doing chain-rule first aid inside transformers.',
    },
    flashcards: [
      { f: 'The chain rule in gear language?', b: 'Sensitivities of composed stages multiply: dy/dx = f\'(g(x)) · g\'(x), outer read at the inner value.' },
      { f: 'Variable feeding multiple paths?', b: 'Multiply along each path, ADD across paths. The multivariable chain rule = backprop\'s core sentence.' },
      { f: 'Why do deep chains vanish or explode?', b: 'n stages multiply n local ratios: below 1 → exponential shrink; above 1 → blowup. Depth is chain length.' },
      { f: 'Convex function promise?', b: 'One global valley — any local minimum is THE minimum; gradient descent with sane steps wins. Regression lives here.' },
      { f: 'Why are high-dim critical points usually saddles?', b: 'A minimum needs up-curvature in every direction; one down direction makes a saddle — the common case among millions of directions.' },
      { f: 'What is backpropagation (preview)?', b: 'The chain rule executed backwards over a computational graph, computing every parameter\'s sensitivity in one pass (Day 86).' },
    ],
    deepDive: [
      { label: 'Why backward beats forward for training', note: 'Forward-mode autodiff costs one pass per INPUT; reverse-mode costs one per OUTPUT. Loss functions have millions of inputs (parameters) and one output — reverse-mode wins by exactly that ratio. Day 87 makes this concrete in PyTorch.' },
    ],
  },
  {
    id: 'd055', day: 55, week: 8, phase: 3, kind: 'lesson',
    title: 'Gradient Descent Lab',
    analogy: 'Rolling downhill in fog',
    objectives: [
      'Implement gradient descent from scratch and log full trajectories',
      'Demonstrate the three learning-rate regimes: creep, converge, oscillate/diverge',
      'Explain why ill-conditioned (elongated) valleys force zig-zagging and small steps',
      'Compare batch, mini-batch, and stochastic gradients on cost and noise',
      'Add momentum and show it damping oscillation and accelerating narrow valleys',
    ],
    prereqs: [
      { day: 53, label: 'Gradients — the downhill direction' },
      { day: 54, label: 'Chain rule & loss terrains' },
    ],
    eli5: `You are on a foggy mountainside at night with a flashlight that shows only the ground at your feet. You cannot see the valley floor — but you can feel which way is downhill RIGHT HERE (the gradient), so you step that way and re-check. That loop — feel, step, repeat — is gradient descent, the algorithm training every neural network on Earth.

Everything interesting is in the step size. Tiny steps: you inch down safely but take all night (slow convergence). Confident medium steps: you stride to the bottom. Huge steps: you leap clear across the valley and land HIGHER on the far wall, leap back even higher — ping-ponging upward until you fly off the mountain (divergence). Worse, real valleys are not round bowls; they are long narrow canyons. Downhill-at-your-feet points mostly at the steep canyon WALL, barely along the gentle floor — so you zig-zag wall to wall while creeping forward. The fix is delightfully physical: be a heavy ball instead of a cautious hiker. Momentum remembers your recent direction; the wall-to-wall zigs cancel out while the persistent along-the-floor component accumulates. Today you implement all of it and watch the trajectories with your own eyes.`,
    why: `The learning rate is the single most important hyperparameter you will ever tune, and today you buy the intuition cheaply — on 2-D functions where you can SEE oscillation and divergence — instead of expensively, on a 4-hour training run that NaNs at 3 a.m. Loss-curve pathology reading (Day 89) is pattern-matching to what you produce deliberately today: plateau = LR too small or a saddle; wild spikes = too large or a bad batch. Mini-batch SGD is not a compromise but the industry default for deep learning — cheap steps, and noise that helps shake loose from saddles — and momentum-family optimizers (Adam included) are what \`torch.optim\` gives you on Day 88. Today is the lab where those defaults stop being folklore.`,
    tech: `### The algorithm, complete

Repeat: θ ← θ − η·∇L(θ). That is gradient descent: current parameters, minus learning rate times gradient. Each step trusts Day 53's linear impersonation for a distance of ~η‖∇L‖ — small enough that the local slope stays honest, large enough to get somewhere. Stopping: fixed iteration budget, or when ‖∇L‖ or the loss improvement drops below tolerance.

### The learning-rate regimes

On the bowl L = x² + y², ∇L = [2x, 2y], and the update multiplies each coordinate by (1 − 2η): η < 0.5 converges (fast near η ≈ 0.4), η = 0.5 jumps straight to 0, and η > 1.0 makes |1 − 2η| > 1 — each step MULTIPLIES the distance from the minimum: geometric divergence. You will see all regimes in a printed trajectory table. Rule of practice: find the largest stable η, then back off — and when in doubt, decay it over time.

### Ill-conditioning: the canyon

L = x² + 10y² is a valley 10× steeper in y than x. The gradient [2x, 20y] over-serves the steep direction: a step size safe for y (η < 0.1) is timid for x, so trajectories zig-zag across the canyon while inching along it. The steepness ratio (the condition number, ~the ratio of largest to smallest curvature — Day 52's eigenvalues of the Hessian, if you want the deep story) governs how painful plain GD is. Real losses have condition numbers in the thousands; plain GD is untenable, which is why the field runs on the two fixes below.

### Noise as a feature: batch, mini-batch, stochastic

With N data points, the true gradient averages N per-point gradients — a full pass per step (**batch GD**, exact but expensive). **SGD** uses ONE random point per step: 1/N the cost, high variance — steps wander drunkenly around the true direction, converging noisily to a fuzzy region rather than a point. **Mini-batch** (32–512 points) is the production sweet spot: variance shrinks with batch size, hardware parallelism is saturated (Day 51's matmul economics), and the residual noise even helps escape Day 54's saddles. LR and batch size interact: bigger batches tolerate bigger steps.

### Momentum: the heavy ball

Keep a velocity: v ← β·v − η·∇L; θ ← θ + v (β ≈ 0.9). Gradients now accelerate rather than teleport. In the canyon, alternating wall-gradients cancel inside v while the persistent floor-component compounds — less zig, more zag. β = 0.9 roughly means "average the last ~10 gradients." Adam (Day 88) combines momentum with per-parameter step scaling; after today you can say precisely what each ingredient is for.`,
    viz: 'gradient-descent',
    guided: [
      {
        title: 'The three regimes, on a bowl you can predict',
        minutes: 20,
        body: `1. Read the starter's \`gd()\` — ten lines, no magic. It logs every position so trajectories are inspectable.
2. Run on the round bowl L = x² + y² from (4, 3) with η ∈ {0.01, 0.1, 0.45, 0.9, 1.1}. For each, the script prints steps-to-converge (or DIVERGED) and the first few positions.
3. Before each run, predict from the (1 − 2η) analysis which regime you will see; check yourself. Watch η = 0.9 overshoot back and forth with shrinking amplitude, and 1.1 ping-pong outward geometrically.
4. Record your table: η, behavior, steps to reach loss < 1e-6. Note the asymmetric moral: too small wastes time; too large loses everything. The safe strategy in practice: start large-ish, decay.`,
        code: `import numpy as np

def gd(grad_fn, start, lr, steps=100, tol=1e-6):
    """Vanilla gradient descent; returns full trajectory."""
    theta = np.array(start, float)
    path = [theta.copy()]
    for _ in range(steps):
        g = grad_fn(theta)
        theta = theta - lr * g
        path.append(theta.copy())
        if not np.isfinite(theta).all() or np.linalg.norm(theta) > 1e6:
            break                      # diverged: stop logging the explosion
        if np.linalg.norm(g) < tol:
            break
    return np.array(path)

bowl_grad = lambda t: 2 * t            # gradient of x^2 + y^2

for lr in (0.01, 0.1, 0.45, 0.9, 1.1):
    path = gd(bowl_grad, (4.0, 3.0), lr, steps=200)
    final = path[-1]
    loss = float(final @ final)
    verdict = ("DIVERGED" if loss > 1e6 else
               f"loss {loss:.1e} in {len(path)-1} steps")
    print(f"lr={lr:4.2f}: {verdict}")
    print("   first steps:", [p.round(2).tolist() for p in path[:4]])`,
      },
      {
        title: 'The canyon, and the heavy ball that tames it',
        minutes: 25,
        body: `1. Switch to the canyon L = x² + 10y², start (9, 1). Gradient: [2x, 20y]. First find the divergence threshold empirically: try η = 0.05, 0.09, 0.11. (The steep axis multiplies by (1 − 20η) — instability arrives at η = 0.1, far below the bowl's 1.0.)
2. At the safe η = 0.09, print the first 12 positions and LOOK at them: y flips sign nearly every step (wall-to-wall zig-zag) while x grinds down slowly. Count steps to loss < 1e-6. This is ill-conditioning: the steep direction sets the speed limit; the gentle direction pays it.
3. Now run \`gd_momentum\` with the same η = 0.09, β = 0.9. Compare steps-to-converge (expect several-fold fewer) and watch the y-column: oscillations damp as opposing gradients cancel in the velocity while x-progress compounds.
4. Sweep β ∈ {0, 0.5, 0.9, 0.99} and tabulate. Note that β = 0.99 overshoots and rings before settling — momentum has its own too-much regime.
5. Notes: two sentences on why real training (condition numbers in the thousands) makes momentum-family optimizers the default, not a luxury.`,
        code: `import numpy as np

canyon_grad = lambda t: np.array([2 * t[0], 20 * t[1]])
canyon_loss = lambda t: t[0]**2 + 10 * t[1]**2

def gd_momentum(grad_fn, start, lr, beta=0.9, steps=400, tol=1e-6):
    theta = np.array(start, float)
    v = np.zeros_like(theta)
    path = [theta.copy()]
    for _ in range(steps):
        g = grad_fn(theta)
        v = beta * v - lr * g          # velocity remembers direction
        theta = theta + v
        path.append(theta.copy())
        if np.linalg.norm(g) < tol:
            break
    return np.array(path)

# --- plain GD zig-zags
from_start = (9.0, 1.0)
path = gd(canyon_grad, from_start, 0.09, steps=400)   # gd() from part 1
print(f"plain GD lr=0.09: {len(path)-1} steps to "
      f"loss {canyon_loss(path[-1]):.1e}")
for i, p in enumerate(path[:12]):
    print(f"  step {i:2d}: x={p[0]:7.3f}  y={p[1]:+7.3f}")

# --- momentum: same lr, far fewer steps
for beta in (0.0, 0.5, 0.9, 0.99):
    path_m = gd_momentum(canyon_grad, from_start, 0.09, beta)
    print(f"momentum beta={beta:4.2f}: {len(path_m)-1} steps, "
          f"final loss {canyon_loss(path_m[-1]):.1e}")`,
      },
    ],
    practice: [
      {
        title: 'Batch vs mini-batch vs stochastic, measured',
        minutes: 25,
        body: `Fit the 1-parameter model y ≈ w·x to 1,000 synthetic points (x from N(0,1), y = 3x + noise·0.5) by minimizing mean squared error. The full-data gradient is dL/dw = mean(2·(w·xᵢ − yᵢ)·xᵢ); a batch's gradient is the same mean over the batch only.

Run three descents from w = 0 at η = 0.05, an "epoch budget" of 30 passes over the data: (1) batch GD — one exact step per epoch; (2) mini-batch, size 32 — shuffled each epoch; (3) SGD, batch size 1. For each, log w after every epoch and produce: a table of w-trajectories, gradient EVALUATIONS per epoch, and the final |w − 3|.

Answer in your notes: which method takes the most steps but the fewest data passes per step? Why does the SGD trajectory never quite settle (look at its last five epochs)? Which would you pick if the dataset were 10 million points, and why does the noise become a feature at saddle points (Day 54)?

Hints (only if stuck): all three see the same data per epoch — the difference is exactness per step vs steps per epoch; SGD's endpoint jitters in a band whose width scales with η.`,
      },
    ],
    project: {
      title: 'The step-size field manual',
      brief: `Create \`gd_lab.py\` + \`gd_field_manual.md\` in your practice repo. The script: your gd/gd_momentum implementations plus the three experiments (regimes table, canyon + momentum sweep, batch-variant comparison), each behind a function, all reproducible with one seed. The manual: (1) the regimes table with the (1 − 2η) explanation in your own words; (2) the canyon story — why steep directions set the speed limit, with your zig-zag printout as evidence; (3) the momentum sweep table and the "average of last ~10 gradients" reading of β = 0.9; (4) the batch-variant table with the cost/noise trade; (5) a ten-line "symptom → suspect" cheat sheet (loss flat → LR tiny or saddle; loss spikes then recovers → borderline LR or noisy batch; loss NaN → diverged, cut LR 10×...). Tomorrow's checkpoint uses gd_lab.py directly on real regression — write it importable.`,
      rubric: [
        'gd and gd_momentum implemented cleanly, trajectory-logging, importable',
        'Regimes table covers all five learning rates with predicted-then-observed behavior',
        'Canyon zig-zag evidence and momentum speedup (≥ 3×) recorded',
        'Batch/mini-batch/SGD table includes evaluations per step and final error',
        'Symptom cheat sheet has ≥ 5 entries mapping observation to cause and fix',
        'Committed with a descriptive message',
      ],
    },
    mistakes: [
      'Tuning the learning rate by tiny increments from a bad start. The regimes differ by orders of magnitude — search η in powers of 10 first (0.001, 0.01, 0.1), then refine within the stable decade.',
      'Reading oscillation as "noise" and averaging it away mentally. Systematic overshoot (sign-flipping coordinates, loss bouncing) is a too-large step size announcing itself — cut η, do not squint.',
      'Expecting the bowl\'s safe η to transfer to the canyon. Stability is set by the STEEPEST direction; ill-conditioned losses demand steps sized for their worst axis. That is why the same η that cruised on one problem diverges on another.',
      'Treating SGD noise as pure downside. The wander costs precision near the minimum but shakes trajectories off saddles and plateaus — part of why deep learning works. Decay η late to trade noise back for precision.',
      'Cranking momentum toward 1.0 for "more speed." β = 0.99 averages ~100 gradients: the ball gets so heavy it overshoots and rings. 0.9 is the default for a reason; tune it like a damper, not a throttle.',
      'Judging convergence by the last loss value alone. Log trajectories. A loss of 0.01 could be converged (gradient ~0) or mid-oscillation; the path — like your printed tables — tells you which.',
    ],
    quiz: [
      {
        q: 'On L = x² + y², gradient descent with η = 1.1 produces iterates that get FARTHER from the minimum each step. Why?',
        o: [
          'The gradient formula is wrong at large η',
          'Each update multiplies the distance by |1 − 2η| = 1.2 > 1 — geometric divergence from overshooting the valley',
          'The minimum moved',
          'Floating-point error accumulates',
        ],
        x: 1,
        w: 'The update x ← x − η·2x = (1 − 2η)x scales each coordinate by 1 − 2.2 = −1.2: the sign flips (leaping across the valley) AND the magnitude grows 1.2× per step. Divergence is arithmetic, not bad luck.',
        revisit: 55,
      },
      {
        q: 'In the canyon L = x² + 10y², why does plain GD zig-zag?',
        o: [
          'Random noise in the gradient',
          'The gradient over-weights the steep y-direction, so safe steps overshoot across the canyon in y while barely advancing in x',
          'Momentum is too high',
          'The minimum is a saddle point',
        ],
        x: 1,
        w: 'The gradient [2x, 20y] points mostly at the canyon wall. A step size safe for the steep axis (η < 0.1) still overshoots y back and forth while x, ten times shallower, creeps. Ill-conditioning makes the steepest direction the speed limit.',
        revisit: 55,
      },
      {
        q: 'Mini-batch SGD is the deep-learning default over full-batch GD mainly because…',
        o: [
          'It always converges to a better minimum',
          'Steps cost a small fraction of a data pass, saturate parallel hardware, and the gradient noise even helps escape saddles',
          'It requires no learning rate',
          'Full-batch gradients are incorrect',
        ],
        x: 1,
        w: 'A size-256 batch estimates the gradient well enough at 1/40,000th the cost of a 10M-point exact pass, fits GPU matmul economics, and its noise perturbs trajectories off saddles and plateaus. Exactness per step is the wrong thing to maximize.',
        revisit: 55,
      },
    ],
    resources: [
      { label: '3Blue1Brown — Neural Networks ch. 2 (gradient descent, how machines learn)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', type: 'video', time: '20 min' },
      { label: 'Google ML Crash Course — Linear regression: gradient descent & learning-rate exercises', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '30 min' },
      { label: 'Mathematics for Machine Learning — ch. 7.1 (continuous optimization)', url: 'https://mml-book.github.io/', type: 'book', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due flashcards (Days 53–54)', minutes: 10 },
      { activity: 'ELI5 + tech read + gradient-descent visualizer', minutes: 20 },
      { activity: 'Guided: LR regimes + canyon & momentum', minutes: 45 },
      { activity: 'Practice: batch vs mini-batch vs SGD', minutes: 25 },
      { activity: 'Project: the step-size field manual', minutes: 15 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'All five LR regimes produced and matched to prediction',
      'Canyon zig-zag observed in printed trajectories; momentum ≥ 3× speedup measured',
      'Three batch variants compared with cost and final-error table',
      'Field manual committed with the symptom cheat sheet',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Every step is Day 53\'s −∇L pointed downhill, marching over Day 54\'s terrains — and the canyon\'s steepness ratio is secretly Day 52\'s eigenvalue story (curvature eigenvalues set the speed limit). The batching economics are Day 51\'s matmul argument.',
      forward: 'Tomorrow gd_lab.py trains a real model: linear regression by hand, closing the math week. Day 71 reveals sklearn doing the same fit in one line; Day 88 hands you torch.optim.SGD(momentum=0.9) and Adam, which you can now read ingredient by ingredient; Day 89\'s loss-curve clinic is today\'s symptom sheet at production scale.',
    },
    flashcards: [
      { f: 'Gradient descent in one line?', b: 'θ ← θ − η·∇L(θ): step against the gradient, size η, repeat. The fog-walk downhill.' },
      { f: 'The three learning-rate regimes?', b: 'Too small: slow creep. Right: smooth convergence. Too large: oscillate then geometrically diverge.' },
      { f: 'Why do narrow valleys force zig-zags?', b: 'Gradients over-serve the steep axis; steps safe for it overshoot side-to-side while the gentle axis crawls (ill-conditioning).' },
      { f: 'Momentum update?', b: 'v ← βv − η∇L; θ ← θ + v. Opposing gradients cancel in v, persistent ones compound. β=0.9 ≈ average last ~10 grads.' },
      { f: 'Batch vs mini-batch vs SGD?', b: 'Exact/slow vs sweet-spot (32–512, parallel, mild noise) vs cheapest/noisiest. Noise helps escape saddles.' },
      { f: 'Loss went NaN mid-training — first move?', b: 'Divergence: cut the learning rate ~10× (then consider clipping, Day 89). It is arithmetic, not mystery.' },
    ],
    deepDive: [
      { label: 'Why the canyon is eigenvalues in disguise', note: 'The Hessian of x² + 10y² has eigenvalues 2 and 20; stability requires η < 2/λ_max and convergence speed is set by λ_min — condition number κ = λ_max/λ_min predicts the pain. Day 52\'s decomposition, running the optimizer\'s speed limit.' },
    ],
  },
  {
    id: 'd056', day: 56, week: 8, phase: 3, kind: 'review',
    title: 'Week 8 Checkpoint: Linear Regression by Hand',
    analogy: 'The math becomes code',
    objectives: [
      'Reproduce the week\'s core machinery from memory: dot products, matmul-as-transformation, SVD truncation, gradients, the chain rule, GD regimes',
      'Derive the MSE gradient for linear regression by hand and verify it with gradcheck',
      'Train w and b with your own gradient descent and read the loss curves',
      'Produce a learning-rate ablation table and defend the chosen rate',
      'Write the intuition paragraph connecting this week to embeddings, backprop, and LoRA',
    ],
    prereqs: [
      { day: 50, label: 'Vectors & dot products' },
      { day: 53, label: 'Derivatives & gradients' },
      { day: 54, label: 'Chain rule' },
      { day: 55, label: 'Gradient descent lab' },
    ],
    eli5: `Seven days ago, vectors were arrows and derivatives were a shower dial. Today they conspire: you will teach a line to fit data, using nothing but this week's parts. The model is one dot product (w·x + b — Day 50). The loss is a bowl whose height is squared error. The gradient — derived by you, with Day 54's chain rule, checked by Day 53's checker — tells each parameter which way to nudge. And Day 55's descent loop rolls the parameters downhill until the line lies snugly through the cloud of points. Machine learning, complete, with no library and no mystery.

Why spend a checkpoint on the simplest model in the field? Because linear regression is the hydrogen atom of ML: every phenomenon you will ever debug — loss curves, learning rates, divergence, convergence — appears here in its purest form, small enough to inspect every number. The recall drills come first, as always: what you can rebuild from an empty file is what you actually own. When Day 71 shows you sklearn fitting this same model in one line, and Day 85 stacks these dot-product neurons into networks, you will know exactly what is inside the box — because you built the box.`,
    why: `"Implement linear regression with gradient descent" is a real screening question for ML-adjacent roles — asked precisely because it composes vectors, gradients, and optimization into twenty lines and exposes whether the candidate owns the parts. It is also your first end-to-end training run: initialize → forward → loss → gradient → step → loss curve, the exact skeleton of every PyTorch loop you will write from Day 88 to the capstone. When a training run misbehaves in month six, you will debug it by shrinking the problem back toward today's transparent twenty lines — the hydrogen atom is also the diagnostic instrument.`,
    tech: `### What to recall before you build

Closed-book targets for the drills: the dot product's three faces and cosine similarity (Day 50); columns-tell-all and composition order (Day 51); rank, the SVD anatomy, and the low-rank deal (Day 52); central differences, the U-curve, and steepest ascent (Day 53); multiply-along-paths-add-across-paths and the vanish/explode arithmetic (Day 54); the LR regimes, the canyon, momentum (Day 55). Anything shaky feeds the revisit list; the quiz's pointers name the day to restudy.

### The checkpoint model, derived

Data: N points (xᵢ, yᵢ). Model: ŷᵢ = w·xᵢ + b. Loss: MSE = (1/N)·Σ(ŷᵢ − yᵢ)². The gradient, via the chain rule with rᵢ = ŷᵢ − yᵢ as the residual: each squared term contributes 2rᵢ (outer), times the inner sensitivities ∂ŷᵢ/∂w = xᵢ and ∂ŷᵢ/∂b = 1; paths add across data points, so ∂L/∂w = (2/N)·Σ rᵢxᵢ and ∂L/∂b = (2/N)·Σ rᵢ. Read the formulas like an engineer: the b-gradient is twice the mean residual (the line drifts vertically toward the cloud's center); the w-gradient correlates residuals with inputs (if big-x points sit above the line, tilt up). Vectorized, the whole gradient is two NumPy reductions — no loops (Day 51's habit).

### What the loss curve should look like

MSE in (w, b) is convex — one valley (Day 54's promise: any minimum is THE minimum), though usually elongated (x and the constant 1 have different scales: a mild canyon, Day 55). Expect: steep early drop, smooth flattening onto a floor set by the noise in the data — the model cannot (and should not) fit noise below σ². A kinked or bouncing curve is a too-large η; an agonizing glide is too-small. Your ablation table will hold examples of each, deliberately.

### The honest finish

A trained model deserves three checks: parameters against ground truth (you generated the data, so you KNOW w≈3, b≈−2 — a luxury real data never grants), the loss floor against the noise level you injected, and a residual glance (residuals should look like the noise you added: centered, patternless). Then the write-up — because on Day 105 and in every FDE room after, the model matters less than your explanation of it.`,
    viz: null,
    guided: [
      {
        title: 'Closed-book recall drills — Week 8 edition',
        minutes: 25,
        body: `Editor closed. Write from memory, then diff against your notes and lab files; score each solid / shaky / gone.

1. **Day 50:** cosine similarity formula; typical cosine of random unit vectors in ℝ⁷⁶⁸ and why; the reason pipelines normalize embeddings.
2. **Day 51:** what a matrix's columns tell you; is AB = BA?; the shape story of (1000×768)@(768×512) and why batching = matmul matters.
3. **Day 52:** eigenvector in one line; SVD's three-move anatomy; the LoRA bet in one sentence.
4. **Day 53:** central-difference formula; why h has a floor; what direction ∇f points and what is perpendicular to it.
5. **Day 54:** compute by graph-walk: dL/dw for L = (w·x − y)² at w=2, x=3, y=5. (Answer: 2(6−5)·3 = 6. No peeking.)
6. **Day 55:** the three LR regimes; why canyons zig-zag; the momentum update from memory.

Shaky/gone items → revisit list; re-read ONLY those sections before building.`,
      },
      {
        title: 'Derive, check, and dry-run the regression gradient',
        minutes: 15,
        body: `1. On paper: derive ∂L/∂w and ∂L/∂b for MSE from scratch, showing the chain rule and the add-across-points step. Compare against the tech section only when done.
2. Generate the data (starter): 200 points, x ~ N(0, 2), y = 3x − 2 + noise(σ=1). Note the ground truth you will hunt: w=3, b=−2, and a loss floor near σ² = 1.
3. Implement \`mse_loss(w, b)\` and \`mse_grad(w, b)\` vectorized (two reductions, no loops), then verify the gradient with your Day 53 \`gradcheck\` at three points, e.g. (0,0), (3,−2), (−1, 4). All must pass at 1e-6 BEFORE training — never descend an unchecked gradient.
4. Sanity dry-run: at (w,b) = (0,0), state the SIGNS of both gradient components from the formulas alone (residuals are mostly negative where y is positive…), then confirm numerically.`,
        code: `import numpy as np

rng = np.random.default_rng(56)
N = 200
x = rng.normal(0, 2, N)
y = 3 * x - 2 + rng.normal(0, 1, N)      # ground truth: w=3, b=-2, noise sigma=1

def mse_loss(w, b):
    r = w * x + b - y                     # residuals, vectorized
    return float(np.mean(r ** 2))

def mse_grad(w, b):
    r = w * x + b - y
    return np.array([2 * np.mean(r * x),  # dL/dw: residual-input correlation
                     2 * np.mean(r)])     # dL/db: mean residual, doubled

# gradient check before trusting anything (Day 53's ritual)
def numgrad(f, p, h=1e-6):
    g = np.zeros_like(p)
    for i in range(len(p)):
        q1, q2 = p.copy(), p.copy()
        q1[i] += h; q2[i] -= h
        g[i] = (f(q1) - f(q2)) / (2 * h)
    return g

for point in ([0.0, 0.0], [3.0, -2.0], [-1.0, 4.0]):
    p = np.array(point)
    ana = mse_grad(*p)
    num = numgrad(lambda q: mse_loss(*q), p)
    ok = np.allclose(ana, num, atol=1e-5)
    print(f"grad check at {point}: analytic {ana.round(4)} "
          f"numerical {num.round(4)}  {'PASS' if ok else 'FAIL'}")`,
      },
    ],
    practice: [
      {
        title: 'Explain it like a colleague is watching',
        minutes: 10,
        body: `Before the build, rehearse the understanding: set a 6-minute timer and explain out loud, as if pair-programming, (1) why the b-gradient is the mean residual (what the line does when it is uniformly too low), (2) why the w-gradient is a residual-input correlation (what tilting fixes), and (3) what the loss floor will be and why no amount of training goes below it.

Goal: no formula recited without its geometric reading. If any explanation stalls, that is your weakest link — reinforce it before training, because the write-up (and one day an interviewer) will ask exactly these three.`,
      },
    ],
    project: {
      title: 'Linear regression by hand — the Week 8 build',
      brief: `Create \`linreg_by_hand.py\` + \`linreg_report.md\`. The build: import your Day 55 \`gd\` (or reimplement), train (w, b) from (0, 0) on the generated data, logging loss per step. Produce: (1) the loss-curve table (or matplotlib plot if you prefer) for the chosen η; (2) an LR ablation over η ∈ {0.001, 0.01, 0.05, 0.2, 0.5}: final loss, steps to within 1% of floor, verdict (creep/converged/oscillated/diverged); (3) recovered w, b vs ground truth 3, −2, and the loss floor vs σ² = 1; (4) a momentum bonus run (β=0.9) with its speedup; (5) the intuition paragraph — 8–12 sentences telling the whole story (dot product → residuals → chain-rule gradient → downhill loop → noise floor) with zero formulas, as if to a smart PM. Commit everything; Day 71 will rerun this exact fit with sklearn and your numbers must match.`,
      rubric: [
        'Gradient passes gradcheck at three points before any training run',
        'Recovered parameters within ~0.1 of (3, −2); final loss near the σ²=1 floor',
        'Ablation table covers all five rates with correct regime verdicts',
        'Loss curve for the chosen rate shows the steep-drop-then-floor shape, and the floor is explained',
        'Momentum run recorded with speedup vs plain GD',
        'Intuition paragraph is formula-free, correct, and names the loss floor',
      ],
    },
    mistakes: [
      'Training on an unchecked gradient. A sign error still descends — just to the wrong place, slowly and confusingly. Gradcheck first is a two-second insurance policy; make it a permanent habit (Day 86 depends on it).',
      'Expecting loss → 0. The data contains noise σ²; the best possible line floors there. Chasing zero means chasing noise — your first encounter with the overfitting boundary (Day 76 formalizes it).',
      'Reviewing by re-reading lab files instead of rebuilding from an empty buffer. The checkpoint\'s recall drills exist because retrieval, not recognition, is what sticks — same rule as Day 49.',
      'Forgetting to average (or consistently sum) the loss and gradient. Mixing mean-loss with sum-gradient silently scales your effective learning rate by N — a classic "why does η=0.01 diverge here?" bug.',
      'Sweeping η in tiny increments. Regimes live decades apart; scan powers of ten first (Day 55\'s rule), then refine. Your ablation table should SHOW the regimes, not five flavors of convergence.',
      'Writing the intuition paragraph with formulas. The point is the FDE muscle: if you cannot tell the story without symbols, the understanding is still borrowed. Rewrite until a PM could repeat it.',
    ],
    quiz: [
      {
        q: 'For MSE linear regression, ∂L/∂b = (2/N)·Σ(ŷᵢ − yᵢ). If the line currently sits uniformly BELOW the data, this gradient is…',
        o: [
          'Positive, so descent lowers b further',
          'Negative (residuals ŷ−y are negative), so descent RAISES b — the line drifts up toward the cloud',
          'Zero, because errors cancel',
          'Undefined without knowing w',
        ],
        x: 1,
        w: 'Below the data means ŷᵢ < yᵢ, so the mean residual is negative; stepping against a negative gradient increases b. The formula is the geometry: b chases the average vertical miss.',
        revisit: 56,
      },
      {
        q: 'Your regression loss curve plunges, then flattens at ≈ 1.02 and never improves. The injected noise had σ = 1. The right conclusion is…',
        o: [
          'Training failed — try a bigger learning rate',
          'The model converged: MSE cannot fall below the irreducible noise variance σ² ≈ 1',
          'The gradient has a bug',
          'More epochs would eventually reach zero',
        ],
        x: 1,
        w: 'The best line predicts the signal, not the noise; the noise variance is the floor. A floor near σ² is a success signature — pushing below it would mean fitting noise, which a 2-parameter line mercifully cannot.',
        revisit: 55,
      },
      {
        q: 'The MSE loss surface in (w, b) is convex. What does this guarantee that will NOT hold for the neural networks of Phase 5?',
        o: [
          'That gradients exist',
          'That any minimum gradient descent finds is the unique global minimum — no bad valleys, no saddles to fear',
          'That training is fast',
          'That the learning rate does not matter',
        ],
        x: 1,
        w: 'Convexity means one valley: converged = optimal, full stop. Deep nets are non-convex (Day 54) — many minima and saddle-dominated terrain — so "it converged" stops meaning "it found THE answer" the moment you stack layers.',
        revisit: 54,
      },
    ],
    resources: [
      { label: 'Google ML Crash Course — linear regression module (their loop vs yours)', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', time: '25 min' },
      { label: 'Mathematics for Machine Learning — ch. 9 (linear regression, done formally)', url: 'https://mml-book.github.io/', type: 'book', time: '30 min' },
      { label: '3Blue1Brown — Essence of Linear Algebra (rewatch weak chapters from the drills)', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'video', time: '20 min' },
      { label: 'NumPy user guide — for the vectorized reductions', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Closed-book recall drills over Days 50–55', minutes: 25 },
      { activity: 'Derive + gradcheck the MSE gradient', minutes: 15 },
      { activity: 'Explain-out-loud rehearsal', minutes: 10 },
      { activity: 'Build: train, ablate, and write the report', minutes: 55 },
      { activity: 'Cumulative quiz + flashcard deck drill', minutes: 15 },
    ],
    completion: [
      'Recall drills scored; weak sections restudied from the revisit list',
      'Gradient derived on paper and gradcheck-passed before training',
      'Model recovers (3, −2) within tolerance; floor explained via σ²',
      'Ablation table + loss curve + intuition paragraph committed',
      'Cumulative quiz ≥ 2/3 (follow revisit pointers for misses)',
    ],
    connections: {
      back: 'The whole week fit in twenty lines: Day 50\'s dot product is the model, Day 54\'s chain rule derived the gradient, Day 53\'s checker certified it, Day 55\'s loop trained it — and even Day 52 lurks in why the (w, b) valley is mildly canyon-shaped. Phase 2 shows too: the report habit comes from Day 49\'s design-doc-first discipline.',
      forward: 'Day 57 starts probability — the second pillar of ML math. Day 71 refits today\'s model with sklearn in one line (and your numbers must agree); Day 72 swaps the loss and gets classification; Day 85 stacks these neurons into networks; Day 86 automates today\'s hand gradient into backprop. The intuition paragraph is your first artifact in the Day 105 explainer lineage.',
    },
    flashcards: [
      { f: 'MSE gradient for ŷ = w·x + b?', b: '∂L/∂w = (2/N)Σrx, ∂L/∂b = (2/N)Σr with r = ŷ−y. Tilt by residual-input correlation; shift by mean residual.' },
      { f: 'Why does regression loss floor above zero?', b: 'Irreducible noise: MSE bottoms near σ². Below that is fitting noise, not signal.' },
      { f: 'Order of operations for a new training setup?', b: 'Derive gradient → gradcheck it → THEN train. Never descend an unchecked gradient.' },
      { f: 'What convexity buys linear regression?', b: 'One valley: any converged minimum is global. Deep nets lose this on Day 85+.' },
      { f: 'The full training-loop skeleton?', b: 'Init → forward → loss → gradient → step → repeat, logging the loss curve. Same skeleton from today to the capstone.' },
    ],
    deepDive: [
      { label: 'The closed-form ending', note: 'Convex + quadratic means calculus can skip the loop: setting the gradient to zero gives the normal equations, solvable directly (np.linalg.lstsq — which runs on Day 52\'s SVD). Fit your data with it and confirm it matches your GD answer; then note why closed forms die the moment models go nonlinear.' },
    ],
  },
];
