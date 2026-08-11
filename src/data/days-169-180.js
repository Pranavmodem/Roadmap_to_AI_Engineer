// Days 169–180 — Phase 9: FDE craft II (Week 25) + the Finale (Week 26).
// Enterprise delivery, the full-cycle FDE simulation, capstone hardening and ship,
// interview gym, and Demo Day.
export const DAYS_169_180 = [
  {
    id: 'd169', day: 169, week: 25, phase: 9, kind: 'lesson',
    title: 'Enterprise Integration',
    analogy: 'Plumbing into an old building',
    objectives: [
      'Explain the SAML and OIDC SSO flows well enough to whiteboard either for a customer IT team',
      'Describe what SCIM provisioning adds on top of SSO and when a customer will demand it',
      'Map the enterprise systems an AI product actually meets — SharePoint, warehouses, ERPs, ticketing — and the integration pattern for each',
      'Name three integration anti-patterns and the pattern that replaces each',
      'Draft the security-review and change-management answers a customer will ask for before go-live',
    ],
    prereqs: [
      { day: 44, label: 'Security, AuthN & AuthZ' },
      { day: 45, label: 'Web service architecture' },
      { day: 162, label: 'The FDE role' },
    ],
    eli5: `You built a beautiful modern kitchen appliance. Now you have to install it in a 1920s office building. The wiring is aluminum, the pipes are lead, three different superintendents each control one floor, and nothing gets connected without a permit signed by the building committee. You don't get to rewire the building — you adapt YOUR plug to THEIR sockets, and you learn who signs the permits.

That is enterprise integration. The "old building" is the customer's existing stack: their identity system decides who can log in (you plug into it, you never build your own login), their document stores and databases hold the knowledge your AI needs (you connect to them on their terms), and their change-management process decides when anything ships. The engineers who thrive here aren't the ones with the shiniest appliance — they're the ones who can walk the building, find every pipe, and produce a wiring diagram the superintendents will actually sign.`,
    why: `Deals die at integration, not at the demo. A docs-QA assistant that wowed the exec sponsor goes nowhere if it can't authenticate against the customer's Entra ID tenant, read their SharePoint, and pass their security review. FDE job postings almost universally list "experience integrating with enterprise systems (SSO, data warehouses, ticketing)" — because the last mile between a working product and a deployed product is exactly this plumbing, and it is where forward-deployed engineers earn their keep.`,
    tech: `### SSO: SAML and OIDC in practice

Enterprises centralize identity in an IdP (Okta, Microsoft Entra ID, Ping). Your product is a service provider (SAML) or relying party (OIDC) — you never store enterprise passwords. In the OIDC authorization-code flow: the browser is redirected to the IdP, the user authenticates there, the IdP redirects back with a short-lived code, and your backend exchanges the code (plus client secret) for an ID token — a signed JWT whose claims (sub, email, groups) you verify against the IdP's published keys. SAML does the same dance with signed XML assertions instead of JWTs; it is older, still everywhere, and the reason "supports SAML" appears on enterprise pricing tiers. What you must get right: validate signatures and audience, honor token expiry, and map IdP groups to your app's roles (RBAC from Day 44).

SSO answers "who is this?" once, at login. **SCIM** answers "who should exist at all?" continuously: a provisioning protocol where the IdP pushes user create/update/deactivate events to your API, so when an employee leaves, their account dies everywhere within minutes. Customers with compliance obligations will ask for it by name.

### The systems you will actually meet

- **Document stores** — SharePoint/OneDrive, Google Drive, Confluence: OAuth-scoped APIs, throttling, permission models you must mirror (a user should never retrieve chunks from documents they can't open — "permission-aware RAG").
- **SQL warehouses** — Snowflake, BigQuery, Redshift: read-only service accounts, cost-per-query awareness.
- **ERPs and CRMs** — SAP, Salesforce: rigid schemas, change windows, integration middleware already in place.
- **Ticketing/ITSM** — ServiceNow, Jira, Zendesk: often both a data source and the delivery surface for your agent's output.

### Patterns and anti-patterns

Prefer: going through the customer's **API gateway** (their auth, rate limits, audit logging come free); incremental sync with change tokens instead of nightly full re-crawls; a single integration service with retries and dead-letter handling. Avoid: screen-scraping internal tools (breaks silently), point-to-point spaghetti (N systems × M consumers), syncing data you don't need (every copied record is a liability in the security review), and building your own login "temporarily." And budget calendar time, not just code time: enterprise change management (CAB approvals, security questionnaires, pen-test windows) routinely takes longer than the integration itself.`,
    viz: 'enterprise-map',
    guided: [
      {
        title: 'Walk the OIDC flow with your own hands',
        minutes: 20,
        body: `1. Create \`oidc_walk.py\` and paste the starter code. It simulates the relying-party side of an OIDC login: an ID token arrives, you must validate it before trusting it.
2. Run it. The first sample token passes; note which checks it passed (issuer, audience, expiry, signature-present flag).
3. Three bad tokens follow: one expired, one issued for a different app (wrong \`aud\`), one from an unknown issuer. Confirm your validator rejects each and prints WHY.
4. On paper, draw the full auth-code flow as a 6-step sequence (browser → your app → IdP → browser → your app → IdP token endpoint). Label where this validation step lives.
5. Write one sentence: why does your backend, not the browser, exchange the code for tokens?`,
        code: `import base64, json, time

# Toy ID-token validator. Real code uses a JWT library and verifies the
# signature against the IdP's published JWKS keys - here we simulate that
# with a 'sig_ok' flag so the CLAIM checks are what you practice.

MY_CLIENT_ID = "docsqa-prod"
TRUSTED_ISSUER = "https://login.customer-idp.example/tenant-42"

def b64url(obj):
    raw = json.dumps(obj).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")

def make_token(claims, sig_ok=True):
    return {"payload": b64url(claims), "sig_ok": sig_ok}

def validate(token):
    if not token["sig_ok"]:
        return False, "signature invalid - not signed by the IdP's key"
    pad = "=" * (-len(token["payload"]) % 4)
    claims = json.loads(base64.urlsafe_b64decode(token["payload"] + pad))
    if claims.get("iss") != TRUSTED_ISSUER:
        return False, "unknown issuer: " + str(claims.get("iss"))
    if claims.get("aud") != MY_CLIENT_ID:
        return False, "audience mismatch: token minted for " + str(claims.get("aud"))
    if claims.get("exp", 0) < time.time():
        return False, "token expired"
    return True, "ok - user " + claims["sub"] + " groups " + str(claims.get("groups"))

now = time.time()
good = make_token({"iss": TRUSTED_ISSUER, "aud": MY_CLIENT_ID,
                   "sub": "u_1042", "exp": now + 3600, "groups": ["docsqa-users"]})
expired = make_token({"iss": TRUSTED_ISSUER, "aud": MY_CLIENT_ID,
                      "sub": "u_1042", "exp": now - 60})
wrong_aud = make_token({"iss": TRUSTED_ISSUER, "aud": "other-app",
                        "sub": "u_1042", "exp": now + 3600})
bad_iss = make_token({"iss": "https://evil.example", "aud": MY_CLIENT_ID,
                      "sub": "u_1042", "exp": now + 3600})

for name, tok in [("good", good), ("expired", expired),
                  ("wrong_aud", wrong_aud), ("bad_iss", bad_iss)]:
    ok, why = validate(tok)
    print(f"{name:10s} -> {'ACCEPT' if ok else 'REJECT':6s} | {why}")`,
      },
      {
        title: 'Enterprise recon sheet for the capstone',
        minutes: 20,
        body: `Your capstone docs-QA assistant is being sold into "Meridian Insurance" (4,000 employees, Microsoft shop). Build an integration matrix — this becomes part of tomorrow's and Day 174's deliverables.

1. Create \`docs/integration-matrix.md\` in the capstone repo with columns: System · What we need from it · Auth method · API/sync pattern · Rate/cost constraints · Permission model · Open questions for their IT.
2. Fill a row each for: SharePoint Online (policy docs), a Snowflake warehouse (claims data for future phases), ServiceNow (where employees currently ask these questions), and Entra ID (SSO + groups).
3. For SharePoint, decide: nightly full crawl or incremental delta sync with change tokens? Write two sentences defending your choice using the anti-patterns list.
4. For each row, write at least one question you literally cannot answer without the customer (e.g. "which SharePoint sites are in scope, and who owns app-registration approval?"). Vague rows are the ones that blow up timelines.`,
      },
    ],
    practice: [
      {
        title: 'Permission-aware retrieval design',
        minutes: 20,
        body: `Meridian's CISO asks: "If an intern queries your assistant, can it quote from the executive-compensation policy that only HR can open?"

Design the mechanism that makes the honest answer "no." Deliverable: half a page in \`docs/integration-matrix.md\` covering (1) where document ACLs are captured at ingest time, (2) how a query gets filtered — pre-filter on metadata at retrieval vs post-filter after retrieval — and which you choose and why, (3) what happens when a document's permissions CHANGE after it was indexed, (4) how you would prove it works (an eval case, not a promise).

Hints (only if stuck): your vector DB (Day 115) supports metadata filters; post-filtering leaks information through "I found something but can't show you"; permission sync is just another incremental-sync problem.`,
      },
    ],
    project: {
      title: 'Enterprise readiness addendum',
      brief: `Write \`docs/enterprise-readiness.md\` for the capstone as if Meridian's security and IT teams will read it Monday. Sections: (1) Authentication — OIDC via customer IdP, token validation, group-to-role mapping, SCIM position (supported / roadmap, be honest); (2) Data flows — a text diagram of every place customer data moves or rests, with encryption noted; (3) Integration plan — the matrix from guided work plus the permission-aware retrieval design; (4) Change management — what you need from their CAB and realistic calendar estimates; (5) Security questionnaire pre-answers — retention, deletion, subprocessors (your LLM provider IS one — name it), audit logging. Commit it; Day 174's simulation and Day 178's ship docs both reuse it.`,
      rubric: [
        'OIDC section names the flow, the three token checks, and where group→role mapping happens',
        'Data-flow section accounts for the LLM provider as a subprocessor with data sent/retained noted',
        'Integration matrix has all four systems with at least one real open question each',
        'Permission-aware retrieval design chooses pre- vs post-filtering with a stated reason',
        'Change-management section estimates calendar time separately from engineering time',
        'Committed to the capstone repo and linked from the README',
      ],
    },
    mistakes: [
      'Building your own username/password login "for now." Enterprises will not create accounts in your system; SSO is table stakes, and retrofitting it later touches every session and permission path.',
      'Treating SSO as done when login works. Without SCIM (or at least group-sync on login), departed employees keep access — the exact finding that fails a security review.',
      'Indexing everything the service account can see. Your retrieval layer must honor per-document ACLs, or the intern really can read the exec-comp policy. Sync permissions, not just content.',
      'Full re-crawls every night because they are easy. They hammer the customer\'s API limits, cost real money on warehouses, and still leave you stale during the day — use change tokens/delta APIs.',
      'Quoting engineering time when the customer hears calendar time. The connector takes 2 weeks; the app registration, firewall change, and CAB approval take 6. Say both numbers out loud.',
      'Bypassing the customer\'s API gateway to hit an internal service directly "because it is faster." You just opted out of their auth, rate limiting, and audit trail — the first thing an integration review flags.',
    ],
    quiz: [
      {
        q: 'In the OIDC authorization-code flow, why does your BACKEND exchange the code for tokens instead of the browser doing it?',
        o: [
          'Browsers cannot make POST requests to other domains',
          'The exchange requires the client secret, which must never live in the browser — and tokens then never transit the user agent',
          'It is faster because backends have better network connections',
          'OIDC forbids browsers from holding any token',
        ],
        x: 1,
        w: 'The code alone is useless without the client secret; keeping the exchange server-side means the secret stays secret and access tokens avoid exposure in browser history, logs, and extensions.',
        revisit: 169,
      },
      {
        q: 'A customer asks "do you support SCIM?" What are they actually asking for?',
        o: [
          'Single sign-on so employees can log in with their IdP',
          'Automatic user provisioning and — critically — deprovisioning driven by their IdP',
          'Encryption of data at rest with customer-managed keys',
          'An API gateway in front of your service',
        ],
        x: 1,
        w: 'SCIM is the provisioning protocol: the IdP pushes creates, updates, and deactivations to your app. The compliance driver is instant deprovisioning when someone leaves — SSO alone does not guarantee that.',
        revisit: 169,
      },
      {
        q: 'Your docs-QA service account can read all of SharePoint. The safest retrieval design is…',
        o: [
          'Index everything; rely on the LLM prompt to avoid quoting sensitive documents',
          'Index everything; post-filter answers if a user complains',
          'Capture per-document ACLs at ingest and pre-filter retrieval by the querying user\'s permissions',
          'Only index public documents, permanently',
        ],
        x: 2,
        w: 'Prompts are not access control (Day 132), and post-filtering leaks existence. Store ACL metadata with each chunk and filter at query time by the user\'s groups — then keep permissions synced.',
        revisit: 44,
      },
    ],
    resources: [
      { label: 'OpenID Foundation — How OpenID Connect works', url: 'https://openid.net/developers/how-connect-works/', type: 'docs', time: '15 min' },
      { label: 'C4 Model — diagrams for the integration map', url: 'https://c4model.com/', type: 'docs', time: '15 min' },
      { label: 'FDE Interview Guide (Exponent) — enterprise delivery expectations', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '20 min' },
      { label: 'MDN: HTTP — refresher for gateway/auth headers', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Week 24', minutes: 10 },
      { activity: 'ELI5 + tech read; sketch the enterprise map', minutes: 20 },
      { activity: 'Guided: OIDC walk + enterprise recon sheet', minutes: 40 },
      { activity: 'Practice: permission-aware retrieval design', minutes: 20 },
      { activity: 'Project: enterprise readiness addendum', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'OIDC validator run; all three bad tokens rejected with correct reasons stated',
      'Integration matrix committed with four systems and open questions per row',
      'Enterprise readiness addendum committed, rubric ≥ 5/6',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 44 gave you JWTs, OAuth and RBAC as concepts — today they became the customer\'s Entra ID tenant and a group-mapped role table. Day 45\'s layered architecture is where the auth middleware and integration service slot in.',
      forward: 'Tomorrow (Day 170) the plumbing question becomes WHERE your product runs — the customer\'s VPC and worse. Day 174\'s simulation throws a security-review objection at you that this addendum answers, and Day 178 ships these docs in the final repo.',
    },
    flashcards: [
      { f: 'SAML vs OIDC in one line?', b: 'Same SSO job: SAML = signed XML assertions (older, everywhere); OIDC = OAuth2 + signed JWT ID tokens (newer default).' },
      { f: 'Three checks on every ID token?', b: 'Issuer is trusted, audience is YOUR client ID, not expired — plus signature against the IdP\'s published keys.' },
      { f: 'What does SCIM add over SSO?', b: 'Provisioning: IdP pushes user creates/updates/DEACTIVATIONS, so leavers lose access everywhere within minutes.' },
      { f: 'Permission-aware RAG?', b: 'Store document ACLs as chunk metadata at ingest; pre-filter retrieval by the querying user\'s groups; sync permission changes.' },
      { f: 'Top integration anti-patterns?', b: 'DIY login, screen-scraping, point-to-point spaghetti, nightly full re-crawls, syncing data you don\'t need, bypassing the gateway.' },
      { f: 'Engineering time vs calendar time?', b: 'Connector = weeks of code; app registration + firewall + CAB approval = often more weeks of calendar. Quote both.' },
    ],
    deepDive: [
      { label: 'SCIM 2.0 protocol (RFC 7644)', url: 'https://datatracker.ietf.org/doc/html/rfc7644', note: 'Skim the endpoint list and the deactivation semantics — enough to answer "what would supporting SCIM take?"' },
    ],
  },
  {
    id: 'd170', day: 170, week: 25, phase: 9, kind: 'lesson',
    title: 'Customer Environments',
    analogy: "Cooking in someone else's kitchen",
    objectives: [
      'Compare SaaS, customer-VPC, and on-prem/air-gapped deployment models across data residency, control, and support cost',
      'Explain VPCs, private networking, and egress control well enough to plan a deployment into one',
      'State what customer-managed keys (CMK) change about your architecture and operations',
      'Design a debugging strategy for environments you cannot directly access',
      'Produce an environment preflight checklist that catches blockers before install day',
    ],
    prereqs: [
      { day: 150, label: 'Cloud fundamentals' },
      { day: 159, label: 'Production security & compliance' },
      { day: 169, label: 'Enterprise integration' },
    ],
    eli5: `Cooking in your own kitchen, you know where every knife lives, the oven runs 10 degrees hot, and you can taste the sauce whenever you want. Now cook the same dinner in a stranger's kitchen — with the lights half off. Some drawers are locked. The host stands behind you saying "we don't allow open flames on Tuesdays." And you can't taste anything: you ask the host to taste it and describe the flavor back to you.

That is deploying into a customer's environment. Their cloud account or data center is their kitchen: their network rules decide what your app can reach, their compliance rules decide where data may sit, and their keys lock the pantry. The dimmed lights are the loss of observability — you often can't SSH in, can't tail logs live, sometimes can't reach the internet at all. The skill is cooking well anyway: package everything you need before you arrive, write down every step so the host can follow it, and build tools that let the host "taste and describe" — diagnostics they run and send back — because you will not be allowed to taste it yourself.`,
    why: `The deals with the biggest budgets — banks, healthcare, government, defense — are precisely the ones that will not send their data to your SaaS. "Can you deploy in our VPC?" or "we are air-gapped" is where AI deals in regulated industries live or die, and the engineer who can say "yes, here is our deployment model and here is the support cost difference" is the FDE. It is also where careers get made at 2 a.m.: production is down in an environment you cannot see, and your diagnostic tooling is the only flashlight anyone has.`,
    tech: `### The three deployment models

**SaaS (your cloud):** you run everything; the customer sends data to you. Cheapest to support — one fleet, one version, your observability. Blocked whenever data cannot leave the customer's boundary. **Customer-VPC (their cloud, your software):** your containers run inside a private network the customer owns — an isolated slice of AWS/Azure/GCP with its own subnets, route tables, and security groups (Day 150's mental model, now on their account). Data stays home; you get in only through whatever door they allow. **On-prem / air-gapped:** their physical or fully disconnected infrastructure. No call-home telemetry, updates arrive as signed bundles walked across the boundary, and "the model API" must be a local inference server (Day 155) because there is no outbound internet at all.

Each step rightward multiplies support cost: N customers now run N slightly different versions in N unknown environments. Price and staff accordingly — this is why VPC/on-prem tiers cost multiples of SaaS.

### What changes technically

- **Networking:** egress is deny-by-default. Every external call your app makes — LLM provider, package registry, telemetry — must be enumerated for the allowlist or removed. Expect proxies with TLS inspection and custom CA bundles.
- **Data residency:** law or policy pins data to a region or site. This constrains model choice too: an EU-residency requirement may rule out your favorite US-hosted endpoint.
- **Customer-managed keys:** encryption keys live in the customer's KMS. They can revoke them — instantly bricking their data as far as you are concerned. Your backup/restore and support stories must survive that.
- **Debugging without access:** you can't SSH in. Your levers are: structured logs the customer can export (with redaction, Day 142), a diagnostic bundle script that collects versions/config-shape/connectivity results, reproducing locally in a mirrored environment, and screen-shares where you navigate by asking the customer to type. Design these BEFORE the incident.

### The preflight discipline

Install-day failures are almost never exotic — they are a blocked egress rule, a missing DNS entry, an untrusted internal CA, an under-provisioned node, a service account without permissions. A written preflight checklist the customer completes beforehand converts each of these from a war-room day into a pre-sales email.`,
    viz: null,
    guided: [
      {
        title: 'Deployment-model decision matrix',
        minutes: 18,
        body: `1. Create \`docs/deployment-models.md\` in the capstone repo. Build a table: rows = SaaS / customer-VPC / on-prem-air-gapped; columns = where data rests, who holds keys, how updates ship, how you debug, LLM access path, relative support cost (1x / 3x / 10x).
2. Fill every cell for YOUR capstone specifically — e.g. the LLM row: SaaS = hosted API; VPC = provider endpoint via their egress allowlist OR cloud-native model service in-region; air-gapped = local open-weights model (Day 103) with the quality delta stated honestly.
3. Now profile three prospects: a 40-person startup, Meridian Insurance (Day 169), and a defense contractor. Pick a model for each and write ONE sentence of justification per choice.
4. Add a "what we would have to build" list for the air-gapped column — this is your honest engineering bill for saying yes to that deal.`,
      },
      {
        title: 'Build the diagnostic bundle',
        minutes: 22,
        body: `You cannot SSH into Meridian's VPC. Build the flashlight you will hand them instead.

1. Create \`tools/diagnostic_bundle.py\` from the starter. It must be safe to run in a customer environment: it reports env-var PRESENCE, never values, and redacts hostnames in output.
2. Run it locally against your capstone stack. Read the JSON it prints.
3. Add two checks the starter lacks: (a) reach the vector DB health endpoint; (b) confirm the configured model name matches an allowlist of expected values.
4. Test the failure paths: unset an env var and point one URL at a dead port; confirm the bundle REPORTS the failures instead of crashing on them.
5. Commit it. On Day 172 this script is your first move in two of the three debugging scenarios.`,
        code: `import json, os, platform, shutil, socket, sys, time
import urllib.request

# Diagnostic bundle: run inside the customer environment, send back the JSON.
# Rule 1: never print secret VALUES. Rule 2: never crash - a failed check is data.

REQUIRED_ENV = ["LLM_API_KEY", "VECTOR_DB_URL", "APP_ENV", "LOG_LEVEL"]
ENDPOINTS = {
    "app_health": os.environ.get("APP_URL", "http://localhost:8000") + "/health",
    "llm_egress": "https://api.anthropic.com",  # connectivity only, no auth call
}

def check_env():
    return {k: ("present" if os.environ.get(k) else "MISSING") for k in REQUIRED_ENV}

def check_endpoint(url, timeout=5):
    t0 = time.perf_counter()
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.status
    except Exception as e:
        return {"ok": False, "error": type(e).__name__ + ": " + str(e)[:120]}
    ms = round((time.perf_counter() - t0) * 1000)
    return {"ok": code < 500, "status": code, "latency_ms": ms}

def check_disk():
    du = shutil.disk_usage("/")
    return {"free_gb": round(du.free / 1e9, 1), "pct_used": round(du.used / du.total * 100)}

def check_dns(host="api.anthropic.com"):
    try:
        socket.getaddrinfo(host, 443)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)[:120]}

bundle = {
    "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "python": sys.version.split()[0],
    "platform": platform.platform(),
    "env_vars": check_env(),
    "dns": check_dns(),
    "endpoints": {name: check_endpoint(url) for name, url in ENDPOINTS.items()},
    "disk": check_disk(),
}
print(json.dumps(bundle, indent=2))`,
      },
    ],
    practice: [
      {
        title: 'The preflight checklist',
        minutes: 20,
        body: `Meridian's install is in two weeks. Write \`docs/preflight-checklist.md\` — the list their platform team completes BEFORE you show up.

Constraints: every item must be verifiable by the customer without you (phrase as commands or yes/no checks, not "ensure networking works"); cover at minimum egress allowlist entries (enumerate the exact hostnames your capstone calls), DNS, proxy/CA-bundle handling, compute sizing, service-account permissions for SharePoint and the IdP app registration (Day 169), secrets delivery, and who is in the room on install day with what access. Cap it at one page — a checklist nobody completes is worse than none.

Hints: read your own docker-compose and .env.example and list every external hostname; the CA-bundle item is the one everyone forgets in TLS-inspecting proxies.`,
      },
    ],
    project: {
      title: 'Environment kit: models doc + bundle + preflight',
      brief: `Assemble today's three artifacts into a coherent "environment kit" in the capstone repo: \`docs/deployment-models.md\` (matrix + three prospect calls + air-gapped bill), \`tools/diagnostic_bundle.py\` (extended, failure-tested), and \`docs/preflight-checklist.md\` (one page, customer-executable). Add a short section to the README pointing support engineers at the kit: when a customer reports trouble, step 1 is "run the bundle, send the JSON." This kit is graded again inside Day 174's simulation, where the prospect demands VPC deployment.`,
      rubric: [
        'Matrix filled for all three models including the LLM access path per model',
        'Three prospect recommendations each carry a one-sentence justification',
        'Diagnostic bundle runs green locally AND reports (not crashes on) two induced failures',
        'Bundle never emits a secret value — grep the output to prove it',
        'Preflight checklist enumerates the exact egress hostnames from your own config',
        'README updated with the support-engineer entry point',
      ],
    },
    mistakes: [
      'Promising on-prem at SaaS support cost. Every deployment model to the right of SaaS multiplies versions in the wild and slows every debug loop — price and staff it, or lose money on every regulated deal.',
      'Discovering egress rules on install day. Deny-by-default networks block your LLM API, your package pulls, and your telemetry; enumerate every outbound hostname in the preflight, not in the war room.',
      'Forgetting the TLS-inspecting proxy. Customer proxies re-sign traffic with an internal CA; your Python/httpx stack must be pointed at their CA bundle or every HTTPS call fails with a "certificate verify" error that looks like a bug in your code.',
      'Diagnostic tools that print secrets. A bundle that dumps env-var values will be (rightly) refused by the customer\'s security team — report presence and shape, never values.',
      'Treating customer-managed keys as a checkbox. CMK means the customer can revoke access to their own data at any moment; your restore, migration, and support procedures must assume that power exists.',
      'Debugging by asking the customer to "poke around." Untrained hands in a production environment create new incidents; give them ONE command (the bundle) and navigate the rest yourself on a screen-share.',
    ],
    quiz: [
      {
        q: 'A bank says "your product may not send our data outside our AWS account." Which deployment model is the minimum fit?',
        o: [
          'SaaS with encryption in transit',
          'Customer-VPC: your containers run inside their account, data stays home',
          'Air-gapped on-prem only',
          'SaaS with a signed DPA',
        ],
        x: 1,
        w: 'The constraint is the data boundary, not disconnection. VPC deployment keeps data in their account while still (usually) allowing controlled egress; air-gapped is a heavier requirement they did not state.',
        revisit: 170,
      },
      {
        q: 'Your app works everywhere except one customer, where every HTTPS call fails with a certificate-verification error. Most likely cause?',
        o: [
          'Their firewall blocks port 443 entirely',
          'Your TLS certificate expired',
          'A TLS-inspecting proxy re-signs traffic with an internal CA your app does not trust',
          'DNS is misconfigured',
        ],
        x: 2,
        w: 'Verification failing (rather than connection refused/timeout) points at an untrusted issuer — the classic corporate TLS-inspection proxy. Fix: point your HTTP stack at their CA bundle.',
        revisit: 43,
      },
      {
        q: 'The first design rule of a diagnostic bundle script for customer environments is…',
        o: [
          'Collect as much raw data as possible, including configs, for completeness',
          'Report presence/shape of secrets and never their values; failed checks are output, not crashes',
          'Automatically upload results to your servers for convenience',
          'Require root so all checks succeed',
        ],
        x: 1,
        w: 'The customer\'s security team must be able to read the output and approve running it. Secret values, auto-exfiltration, or root requirements each get it banned; crashing on the failure you came to find defeats the purpose.',
        revisit: 170,
      },
    ],
    resources: [
      { label: 'AWS docs — What is Amazon VPC?', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', type: 'docs', time: '20 min' },
      { label: 'AWS Skill Builder — networking fundamentals paths', url: 'https://skillbuilder.aws/', type: 'course', time: '30 min' },
      { label: 'Reflections on Palantir — what field deployment feels like', url: 'https://nabeelqu.substack.com/p/reflections-on-palantir', type: 'article', time: '25 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards incl. Day 169', minutes: 10 },
      { activity: 'ELI5 + tech read: the three models', minutes: 20 },
      { activity: 'Guided: decision matrix + diagnostic bundle', minutes: 40 },
      { activity: 'Practice: preflight checklist', minutes: 20 },
      { activity: 'Project: assemble the environment kit', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Deployment matrix committed with three justified prospect recommendations',
      'Diagnostic bundle handles two induced failures without crashing; output secret-free',
      'Preflight checklist fits one page and lists your real egress hostnames',
      'Quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 150 taught VPCs as YOUR infrastructure; today the same picture belongs to the customer and you are the guest. Day 142\'s redacted tracing and Day 159\'s security checklist are why anything is debuggable at all in there.',
      forward: 'Day 172 runs incident scenarios where the diagnostic bundle is your opening move. Day 173 prices the support-cost multipliers you tabulated today, and Day 174\'s prospect demands VPC deployment in writing.',
    },
    flashcards: [
      { f: 'Three deployment models, one axis?', b: 'SaaS → customer-VPC → on-prem/air-gapped: data control rises, your access and observability fall, support cost multiplies.' },
      { f: 'Egress in enterprise networks?', b: 'Deny-by-default: enumerate every outbound hostname (LLM API, registries, telemetry) for the allowlist — before install day.' },
      { f: 'Cert-verify errors at ONE customer only?', b: 'TLS-inspecting proxy with an internal CA; point your HTTP stack at their CA bundle.' },
      { f: 'Customer-managed keys change what?', b: 'Customer\'s KMS holds the keys and can revoke them; backup, migration, and support must survive that power.' },
      { f: 'Debugging with no access — four levers?', b: 'Exportable structured logs, a safe diagnostic bundle, a mirrored local repro, and screen-shares where you navigate.' },
    ],
    deepDive: [
      { label: 'Air-gapped LLM serving', note: 'Sketch what replacing your hosted model with a local vLLM deployment (Day 155) would change: quality evals to re-run (Day 140), GPU sizing, and how model updates ship as files.' },
    ],
  },
  {
    id: 'd171', day: 171, week: 25, phase: 9, kind: 'lesson',
    title: 'Stakeholders & Trade-off Navigation',
    analogy: 'Translating between two languages',
    objectives: [
      'Translate one technical situation into exec language and eng language without distorting either',
      'Work trade-offs on the accuracy/latency/cost/privacy/usability pentagon with explicit, defensible reasoning',
      'Say no to a stakeholder request while offering two real options',
      'Write status updates that build trust — especially when the news is bad',
      'Decide when and how to escalate without burning relationships',
    ],
    prereqs: [
      { day: 160, label: 'AI system design & the quadrilemma' },
      { day: 162, label: 'The FDE role' },
      { day: 165, label: 'Proposals & architecture docs' },
    ],
    eli5: `A good interpreter at a peace summit does not translate word-for-word — that produces nonsense and occasionally war. They carry the MEANING across: what this side fears, what that side needs, what both can live with. And they never editorialize; both sides trust them because the meaning arrives intact.

An FDE interprets between two languages every day. The executive speaks outcomes: money, risk, dates, headcount. The engineer speaks mechanisms: latency budgets, eval scores, retrieval precision. "The reranker adds 400 ms but lifts groundedness eight points" means nothing to a VP — but "answers take a beat longer and are wrong noticeably less often; wrong answers are what your compliance team flagged" is the same fact in their language. The second half of the job is that most requests are secretly trade-offs. "Make it faster AND more accurate AND cheaper" is like asking the summit for "everything, concede nothing." Your job is to put the real menu on the table — here is what each choice costs, here are two packages I recommend — so the people who own the outcome can actually choose.`,
    why: `Interview loops for FDE and applied-AI roles almost always include a stakeholder scenario: "the customer demands X, engineering says no, what do you do?" — because the day-to-day job is exactly this. Projects rarely die of bad code; they die of surprised stakeholders. The engineer who sends the Tuesday update that names the risk before it lands, and who answers "can it be faster?" with a priced menu instead of a promise, is the one customers ask for by name — and the one whose renewals close.`,
    tech: `### The two-audience discipline

Every material fact about your system has an exec rendering and an eng rendering, and you must be fluent in producing both from the same truth. Exec rendering: outcome, business impact, decision needed, date — three to five sentences, no mechanism unless it changes the decision. Eng rendering: mechanism, evidence, alternatives considered — precise enough to be checked. The cardinal sin is a third thing: mechanism dressed in jargon delivered to execs ("we swapped the cross-encoder"), or vague vibes delivered to engineers ("make it snappier"). Write the eng version first (it forces honesty), then compress to the exec version (it forces clarity). Numbers survive translation when you attach them to consequences: "p95 went from 2.1 s to 3.4 s" becomes "the slowest tenth of queries now take a second longer — support hasn't flagged it, and it bought the accuracy win below."

### The pentagon

Day 160's quadrilemma — quality, latency, cost, privacy — gains a fifth vertex in the field: **usability** (how much friction users tolerate before they stop using the thing, which zeroes the value of the other four). Working a trade-off honestly has four steps: (1) name which vertices are in tension — most requests pull on exactly two; (2) quantify both directions with real measurements, not adjectives; (3) present two or three packaged options with the costs attached; (4) let the owner of the outcome choose, and record the choice. What you never do is silently pick for them, or pretend the tension away.

### Saying no, status, and escalation

"No" delivered bare reads as unwillingness. The professional form is **no-with-options**: "Friday isn't achievable for the full feature. Option A: hardcoded-scope version Friday, real version in 3 weeks. Option B: full version in 3 weeks, nothing Friday. I recommend A if the board demo is the driver." You said no, they still got to choose, and the constraint (not your attitude) is the visible obstacle.

Status updates build trust on a schedule: same day each week, same shape — done / next / risks / asks — and the risks section is the whole point. A risk disclosed two weeks early is planning; disclosed two days late it is a cover-up. Escalate when a decision exceeds your authority or a commitment will be missed: escalate the DECISION, with options, to the person who owns it — never the complaint, and never as a surprise the other party first hears about in the room.`,
    viz: 'tradeoff-radar',
    guided: [
      {
        title: 'One truth, two audiences',
        minutes: 18,
        body: `The situation, straight from your capstone's world: last Tuesday your LLM provider upgraded the default model version. Your regression gate (Day 141) caught it: groundedness on the golden set dropped from 92% to 84%, and two customer users have already reported "weird answers." You've pinned the previous model version as a stopgap; a re-tuned prompt for the new version is 3–4 days out. The pinned version is deprecated in 60 days, so staying put is not an option.

1. Write the ENG update first (8–12 sentences): mechanism, eval evidence with numbers, the stopgap, the plan, what reviews you need.
2. Compress to the EXEC update (max 5 sentences): what users saw, business risk, what you did within the hour, decision/date, what you need from them (nothing? say so).
3. Self-check the exec version: zero unexplained jargon (would a CFO stumble?), at least one number tied to a consequence, a date, and the risk stated before they could hear it elsewhere.
4. Read both aloud. If the exec version takes over 45 seconds, cut again.`,
      },
      {
        title: 'Three trade-offs on the pentagon',
        minutes: 22,
        body: `Work each case with the four-step method: name the tension → quantify both sides → package 2–3 options → make a recommendation but leave the choice. Write each as a half-page memo. Use your real capstone numbers where you have them (Days 140, 155, 156); estimate honestly where you don't.

**Case 1 — accuracy vs latency:** The champion user says answers feel slow. Your reranker (Day 117) costs ~500 ms of the 2.8 s p50 and buys +9 points of context precision. Options to consider: drop it, rerank only low-confidence retrievals, cache more aggressively, stream the answer so perceived latency falls (Day 155).

**Case 2 — privacy vs quality:** The CISO wants zero data sent to any external model. Local open-weights model scores 11 points lower on your golden set (or estimate from Day 103/128 experience). Options: hosted with a DPA + redaction (Day 132), region-pinned hosted endpoint, local model with the quality delta stated, hybrid routing by document sensitivity.

**Case 3 — cost vs usability:** Finance flags the monthly LLM bill. Cheapest lever is capping answer length and disabling streaming — which users will feel immediately. Better levers exist (Days 129, 156): routing easy queries to a small model, semantic caching, prompt-prefix caching. Package a cut that saves ≥30% with the least felt pain.`,
      },
    ],
    practice: [
      {
        title: 'The Friday demand',
        minutes: 20,
        body: `Email from Meridian's VP of Claims, Thursday 4:52 pm: "Board meeting moved up — I need the assistant handling claims-status questions by Friday EOD. IT says the Snowflake connection is approved. Make it happen."

Reality: the Snowflake integration (Day 169's matrix) is 2–3 weeks of work — schema mapping, permission model, evals for a new answer type. Nothing safe ships by tomorrow.

Write the reply. Constraints: send-ready tone (this VP forwarded your last email to the CEO); no bare no; at least two concrete options with dates — think wizard-of-oz / hardcoded-scope moves from Day 166; one recommendation with a reason tied to THEIR outcome (the board meeting, not your backlog); under 200 words.

Hints: what could a board see Friday that is honest? A scripted demo on real-but-frozen data is not lying if you label it. What single sentence protects you from "but you demoed it, ship it"?`,
      },
    ],
    project: {
      title: 'Stakeholder map & comms plan for the capstone',
      brief: `Write \`docs/stakeholder-plan.md\` as if the capstone is deployed at Meridian. (1) Stakeholder map: economic buyer, champion, daily users, blocker(s) — Day 163's roles — each with: what they care about, the metric they watch, their language (exec/eng), update cadence and channel. (2) The standing weekly update template (done/next/risks/asks) pre-filled with one realistic example. (3) An escalation path: three named triggers (e.g. "regression gate red > 48 h", "security finding severity ≥ high", "scope change touching the contract") and who decides what at each. (4) Your three trade-off memos from guided work, linked as appendices. This document is the communication half of Day 174's full simulation.`,
      rubric: [
        'All four stakeholder roles mapped with metric + language + cadence each',
        'Weekly template includes a risks section with a non-empty realistic example',
        'Escalation triggers are objectively checkable, not "if things get bad"',
        'Three trade-off memos each name the tension, quantify both sides, and offer ≥ 2 options',
        'Friday-demand reply included and under 200 words with two dated options',
        'Committed to the capstone repo',
      ],
    },
    mistakes: [
      'Translating jargon into vaguer jargon. "We improved retrieval precision" is still eng-speak; the exec version names what a human saw and what it costs or saves.',
      'Hiding the risk section until the risk lands. The Tuesday update that says "eval scores dipped, mitigation running, decision needed by Friday" builds more trust than a month of green — surprises, not problems, kill relationships.',
      'Answering a trade-off request with a promise. "We\'ll make it faster and keep accuracy" without measurements is a debt you\'ll pay with interest; put the priced menu on the table instead.',
      'Saying yes to the Friday demand and quietly cutting corners. The corner you cut (evals, permissions) is precisely what explodes in front of the board; no-with-options exists for this moment.',
      'Escalating the complaint instead of the decision. "The customer is being unreasonable" gets you sympathy; "here are the two options and who must choose by Wednesday" gets you a decision.',
      'Optimizing four vertices and forgetting usability. A private, cheap, accurate, fast assistant that requires three clicks and a VPN nobody has… gets zero queries, and zero times anything is zero.',
    ],
    quiz: [
      {
        q: 'The best EXEC rendering of "the cross-encoder reranker adds 500 ms p50 but raises context precision 9 points" is:',
        o: [
          'We deployed a cross-encoder reranking stage with a latency budget impact',
          'Answers take about half a second longer and are wrong noticeably less often — the wrong answers were what compliance flagged',
          'We improved a key retrieval metric by nine points',
          'The system is slower but better now',
        ],
        x: 1,
        w: 'It carries the same two numbers translated into consequences a non-engineer owns: user-felt delay and the compliance risk. Options a and c are jargon or context-free metrics; d has no information.',
        revisit: 171,
      },
      {
        q: 'A stakeholder demands a feature by Friday that safely needs three weeks. The professional move is:',
        o: [
          'Agree — you can probably cut testing to make it',
          'Refuse and explain your team\'s process constraints',
          'Offer two honest options with dates (e.g. labeled scripted demo Friday + real feature in 3 weeks) and recommend one tied to their goal',
          'Escalate to their CEO that the request is unreasonable',
        ],
        x: 2,
        w: 'No-with-options: the constraint stays visible, the stakeholder keeps the choice, and the recommendation serves THEIR outcome. Silent yes ships the cut corner; bare no reads as unwillingness.',
        revisit: 171,
      },
      {
        q: 'Which vertex did Day 160\'s quadrilemma gain today, and why does it dominate?',
        o: [
          'Security — because enterprises demand it',
          'Usability — because friction that stops usage multiplies the value of everything else by zero',
          'Scalability — because success means growth',
          'Explainability — because of regulation',
        ],
        x: 1,
        w: 'Quality, latency, cost, and privacy only matter if people actually use the system; adoption-killing friction zeroes the product regardless of the other four.',
        revisit: 160,
      },
    ],
    resources: [
      { label: 'Google Technical Writing — courses (audience & clarity)', url: 'https://developers.google.com/tech-writing', type: 'course', time: '30 min' },
      { label: 'PreSales Collective — customer-facing engineering craft', url: 'https://www.presalescollective.com/', type: 'article', time: '15 min' },
      { label: 'FDE Interview Guide (Exponent) — stakeholder scenario rounds', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Days 169–170', minutes: 10 },
      { activity: 'ELI5 + tech read; study the trade-off radar', minutes: 20 },
      { activity: 'Guided: two-audience drill + three pentagon cases', minutes: 40 },
      { activity: 'Practice: the Friday demand reply', minutes: 20 },
      { activity: 'Project: stakeholder map & comms plan', minutes: 20 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'Exec and eng updates written from the same incident; exec version ≤ 45 seconds aloud',
      'Three trade-off memos with quantified tensions and ≥ 2 options each',
      'Friday-demand reply under 200 words with two dated options',
      'Stakeholder plan committed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 163 named these stakeholders during discovery; Day 165 wrote for the mixed audience; Day 160 gave you four of the pentagon\'s five vertices. Today you practiced running the room they all sit in.',
      forward: 'Day 173 arms the money vertex with a real cost model — trade-off memos get sharper when the dollars are real. Day 174\'s objections are stakeholder pressure in written form, and Day 180\'s Demo Day presentation is the exec rendering of your whole 180 days.',
    },
    flashcards: [
      { f: 'Exec rendering vs eng rendering?', b: 'Exec: outcome, impact, decision, date — no mechanism. Eng: mechanism + evidence, checkable. Write eng first, compress to exec.' },
      { f: 'The trade-off pentagon?', b: 'Accuracy · latency · cost · privacy · usability. Usability dominates: friction that stops usage zeroes the rest.' },
      { f: 'No-with-options formula?', b: 'State the constraint, offer 2–3 honest options with dates/costs, recommend one tied to THEIR outcome, let them choose.' },
      { f: 'What makes a status update build trust?', b: 'Fixed cadence, fixed shape (done/next/risks/asks), and risks disclosed EARLY — surprises kill trust, problems don\'t.' },
      { f: 'Escalate the ___, not the ___?', b: 'The decision (with options, to its owner, never as an ambush) — not the complaint.' },
    ],
    deepDive: [
      { label: 'Crucial-conversation patterns for engineers', note: 'Practice the "facts → story → ask" pattern: lead with observable facts, label your interpretation as interpretation, end with a specific ask. It de-escalates almost any tense customer thread.' },
    ],
  },
  {
    id: 'd172', day: 172, week: 25, phase: 9, kind: 'lesson',
    title: 'Production Debugging with Customers',
    analogy: 'The field mechanic',
    objectives: [
      'Run the triage framework — impact → scope → recent changes — before touching any code',
      'Perform log and trace forensics on an LLM application to isolate the failing stage',
      'Choose between hotfix and root-cause fix deliberately, and schedule the one you skipped',
      'Communicate during an incident in a way that lowers the customer\'s blood pressure',
      'Convert a closed incident into regression tests, eval cases, and runbook entries',
    ],
    prereqs: [
      { day: 142, label: 'Tracing LLM applications' },
      { day: 158, label: 'Reliability & incident response' },
      { day: 170, label: 'Customer environments' },
    ],
    eli5: `A field mechanic gets called to a farm where the harvester died mid-season. The farmer is losing money by the hour and hovering at the mechanic's elbow. A rookie starts unbolting panels immediately — looks busy, learns little. The veteran asks three questions first: What exactly stopped working — engine, cutter, or conveyor? (impact). Does the other harvester do it too? (scope). What changed since it last worked — new fuel, new operator, yesterday's storm? (recent changes). Three questions in, the search space has collapsed from "the whole machine" to "the fuel line," and the farmer has calmed down, because someone with a method is on the case.

Debugging production AI with a customer watching is the same craft under the same pressure. The three questions come before any code. The engine's flight recorder — your traces from Day 142 — replaces guesswork with a timeline. And the talking IS part of the fix: a calm "here's what we know, here's what we're checking, next update at 3" is worth as much to the customer as the patch itself.`,
    why: `"The AI is giving wrong answers" is the vaguest incident report in software, and you will receive it constantly — often about an environment you cannot touch (Day 170). LLM apps fail in stages (ingest, retrieval, rerank, prompt, model, parsing), non-deterministically, and sometimes because a PROVIDER changed something under you. FDEs live at this exact intersection: the customer sees you debug, so your method — or your flailing — becomes their opinion of your entire company. Interviewers probe it directly: "walk me through a production incident you handled."`,
    tech: `### Triage before touch

**Impact:** what is broken for whom — all users or one? all queries or one topic? wrong answers, errors, or latency? Quantify from your dashboard (Day 146) before believing any anecdote. **Scope:** find the boundary — one tenant or all, one document set or all, one model route or all. The boundary IS the clue: a failure confined to yesterday's ingested documents indicts the ingest run, not the model. **Recent changes:** your deploys, prompt/config versions (Day 141 keeps these in git — bless it), corpus updates, AND provider-side model updates, which you learned to fear on Day 145. Most incidents sit within arm's reach of a change; check the change log before the code.

### Forensics on an LLM request

A grounded-answer request traverses: query → embedding → retrieval → rerank → prompt assembly → model call → parse/citations → response. Your traces (Day 142) record each span with latency and inputs/outputs (redacted). Forensics is bisection over stages (Day 33's invariant thinking, applied to a pipeline): pull 3–5 traces of BAD requests, diff against good ones, find the first stage whose output is wrong. Retrieval returned the right chunks but the answer ignores them → prompt-assembly or model stage. Retrieval returned nothing relevant → embedding/index/filters. Latency doubled but quality held → look at retries, rate limiting, connection pools. Non-determinism means one trace proves little — sample several before concluding.

### Hotfix vs root cause, and the mouth

When impact is high, you stop the bleeding first: pin the model version, roll back the prompt, disable the misbehaving route with a feature flag, serve the honest degraded path (Day 158's fallback chain). That is a hotfix — legitimate, and incomplete. Every hotfix creates a scheduled debt: the root-cause fix plus a regression test (Day 19's habit) plus an eval case (Day 143's flywheel) so this failure class is caught by machines next time. Say both out loud to the customer: "we've stopped it recurring as of 2:40; the underlying fix ships Thursday."

Incident comms follow a rhythm: acknowledge fast (minutes, not hours) with what you know and when the next update comes; update on the promised cadence even when the update is "still investigating"; close with cause, fix, and prevention in plain language. Never speculate about causes in writing — early guesses get quoted back at you — and never go silent, because silence is where customers write their own catastrophic version of events.`,
    viz: null,
    guided: [
      {
        title: 'Three scenarios, one framework',
        minutes: 20,
        body: `For each scenario below, write a "first 15 minutes" plan BEFORE reading on: your impact/scope/recent-changes questions, the first data you'd pull (dashboard panel? traces? diagnostic bundle from Day 170?), and your top two hypotheses ranked.

**Scenario A — "Answers got worse yesterday."** Meridian's champion emails: users say the assistant "started making things up" since Wednesday. Your deploy log shows nothing shipped. Think: what ELSE changes without you shipping? (Two candidates from Day 145 — provider model update, corpus ingest run — and Wednesday's ingest log shows 40 new documents.)

**Scenario B — "It's unusable at 9 a.m."** The VPC deployment (their kitchen, your app) times out every weekday 9:00–9:30, fine otherwise. You cannot SSH in. Think: what is special about 9 a.m.? (Everyone logs on; token-refresh stampede; shared gateway rate limits; a scheduled ingest job colliding with peak traffic.)

**Scenario C — "It showed me another department's document."** An HR user saw a snippet from a Legal-restricted file. Think: is this an ACL-sync gap (Day 169), a metadata-filter bug, or a cache serving another user's answer (Day 156)? What makes this one different from A and B? (It is a security incident: different comms, different urgency, preserve evidence.)

Then compare against the reference plans at the bottom of the starter file for the lab below — score yourself: did you quantify impact first? Did "recent changes" include non-deploy changes?`,
      },
      {
        title: 'Log forensics lab',
        minutes: 20,
        body: `Scenario A made concrete. The starter code contains 12 synthetic trace summaries (JSON lines) from before and after Wednesday's ingest — the shape your Day 142 instrumentation actually emits.

1. Create \`forensics_lab.py\` with the starter and run it — it just parses and pretty-prints per-stage data.
2. Extend it to answer, with numbers: (a) mean \`groundedness\` before vs after Wednesday; (b) whether retrieval latency or the retrieved-chunk sources changed; (c) which SOURCE the bad answers' chunks come from.
3. Diagnosis: the post-Wednesday failures all cite chunks from \`hr_policy_2026_DRAFT.docx\` — a draft uploaded into the watched folder, contradicting the final policy. Retrieval works perfectly; the CORPUS is poisoned. Write the one-paragraph diagnosis naming the failing stage (ingest governance, not the model).
4. Write the two-line hotfix (exclude the draft, re-index) and the root-cause list (ingest filters for draft/temp files, a source-quality check in the eval set, a runbook entry).`,
        code: `import json
from collections import defaultdict

LOGS = """
{"day":"mon","trace":"t1","stage_ms":{"retrieve":180,"rerank":420,"llm":1400},"chunks":["handbook_v3.pdf","handbook_v3.pdf"],"groundedness":0.95,"flag":"ok"}
{"day":"mon","trace":"t2","stage_ms":{"retrieve":175,"rerank":410,"llm":1350},"chunks":["benefits_2026.pdf"],"groundedness":0.93,"flag":"ok"}
{"day":"tue","trace":"t3","stage_ms":{"retrieve":190,"rerank":430,"llm":1500},"chunks":["handbook_v3.pdf","security_policy.pdf"],"groundedness":0.94,"flag":"ok"}
{"day":"tue","trace":"t4","stage_ms":{"retrieve":170,"rerank":400,"llm":1420},"chunks":["benefits_2026.pdf","handbook_v3.pdf"],"groundedness":0.91,"flag":"ok"}
{"day":"wed","trace":"t5","stage_ms":{"retrieve":185,"rerank":425,"llm":1380},"chunks":["hr_policy_2026_DRAFT.docx","handbook_v3.pdf"],"groundedness":0.62,"flag":"user_reported"}
{"day":"wed","trace":"t6","stage_ms":{"retrieve":178,"rerank":415,"llm":1450},"chunks":["handbook_v3.pdf"],"groundedness":0.94,"flag":"ok"}
{"day":"thu","trace":"t7","stage_ms":{"retrieve":182,"rerank":420,"llm":1400},"chunks":["hr_policy_2026_DRAFT.docx"],"groundedness":0.55,"flag":"user_reported"}
{"day":"thu","trace":"t8","stage_ms":{"retrieve":176,"rerank":418,"llm":1390},"chunks":["benefits_2026.pdf"],"groundedness":0.92,"flag":"ok"}
{"day":"thu","trace":"t9","stage_ms":{"retrieve":188,"rerank":432,"llm":1410},"chunks":["hr_policy_2026_DRAFT.docx","benefits_2026.pdf"],"groundedness":0.58,"flag":"user_reported"}
{"day":"fri","trace":"t10","stage_ms":{"retrieve":179,"rerank":419,"llm":1370},"chunks":["handbook_v3.pdf"],"groundedness":0.95,"flag":"ok"}
{"day":"fri","trace":"t11","stage_ms":{"retrieve":183,"rerank":426,"llm":1430},"chunks":["hr_policy_2026_DRAFT.docx"],"groundedness":0.60,"flag":"user_reported"}
{"day":"fri","trace":"t12","stage_ms":{"retrieve":181,"rerank":421,"llm":1400},"chunks":["security_policy.pdf"],"groundedness":0.93,"flag":"ok"}
"""

traces = [json.loads(line) for line in LOGS.strip().splitlines()]

# Starter: group by day and print means. YOUR JOB: split before/after Wednesday,
# compare groundedness, latency, and chunk sources; find what the bad traces share.
by_day = defaultdict(list)
for t in traces:
    by_day[t["day"]].append(t)

for day, ts in by_day.items():
    g = sum(t["groundedness"] for t in ts) / len(ts)
    r = sum(t["stage_ms"]["retrieve"] for t in ts) / len(ts)
    print(f"{day}: n={len(ts)}  mean_groundedness={g:.2f}  mean_retrieve_ms={r:.0f}")

# Hint: collect the chunk sources of traces where flag == "user_reported".
# Reference plans for the three scenarios (guided ex. 1):
# A: impact=one topic? all users? -> pull flagged traces -> recent changes incl.
#    ingest run & provider version -> hypothesis: corpus change > model change.
# B: impact=latency not quality; scope=one env, one time window -> ask customer to
#    run the diagnostic bundle AT 9am -> hypotheses: auth stampede, gateway rate
#    limit, scheduled job collision. Fix candidates: stagger refresh, move job.
# C: SECURITY incident: preserve traces, disable affected route, notify security
#    contact per plan, then debug ACL sync vs filter vs cache-key bug. Never quietly fix.`,
      },
    ],
    practice: [
      {
        title: 'Incident comms under pressure',
        minutes: 18,
        body: `Write the three customer-facing messages for Scenario A (the poisoned draft document), addressed to Meridian's champion with the CISO cc'd:

1. **Acknowledgement** — send within 15 minutes of the report: what you know (facts only, no cause speculation), what you're doing, when the next update lands. ≤ 90 words.
2. **Update at T+2 h** — cause found (draft doc in the watched folder — phrase it without blaming THEIR admin who uploaded it), hotfix live, what remains. ≤ 120 words.
3. **Closure at T+2 days** — cause, fix, prevention (ingest filter + new eval case + runbook entry), in plain exec language (Day 171). ≤ 150 words.

Constraints: never write "the model hallucinated" (unfalsifiable and wrong here); the closure must make the customer MORE confident than before the incident — name the machinery that now catches this class automatically.`,
      },
    ],
    project: {
      title: 'Symptom → playbook runbook v2',
      brief: `Upgrade the capstone runbook (started Day 154, completed Day 161) with a customer-facing debugging section: five symptom-driven playbooks — (1) "answers got worse", (2) "it's slow / timing out", (3) "user saw something they shouldn't", (4) "provider outage / rate limited", (5) "ingest failed or corpus stale". Each playbook: first three triage questions, exact data to pull (dashboard panel name, trace query, or diagnostic-bundle command from Day 170 — real commands, not descriptions), top 3 causes ranked with the discriminating test for each, hotfix lever (flag/rollback/pin), and comms template pointer. Add the Scenario A regression: an eval case asserting no DRAFT-flagged source is ever cited. Commit; Day 177's quality gates check this file exists and is real.`,
      rubric: [
        'Five playbooks each open with triage questions, not fixes',
        'Every data-pull step is an actual command or named dashboard panel from YOUR stack',
        'Each playbook names its hotfix lever and its root-cause follow-up separately',
        'Playbook 3 is marked as a security incident with evidence-preservation and notification steps',
        'Draft-document eval case added to the golden set and passing',
        'Committed with the runbook linked from the README',
      ],
    },
    mistakes: [
      'Opening the code before quantifying impact. Ten minutes of dashboard and trace reading collapses the search space more than an hour of reading source — and calms the customer, because method is visible.',
      'Forgetting that "recent changes" includes changes you did not make: provider model updates, customer-side uploads, expiring certificates, a new proxy. Your deploy log being empty rules out almost nothing.',
      'Trusting one trace of a non-deterministic system. Sample several bad and several good requests before declaring a stage guilty; one weird trace is weather, five is climate.',
      'Blaming "the model" by default. In RAG apps the model is the LAST suspect: corpus, retrieval, filters, and prompt assembly fail far more often — and the traces can prove it either way.',
      'Hotfixing and moving on. A hotfix without a scheduled root-cause fix, regression test, and eval case is a time bomb with your name on it; Day 143\'s flywheel exists to metabolize incidents.',
      'Going silent while you investigate, or speculating in writing. Silence breeds catastrophic customer theories; written speculation gets quoted back at you. Promise a cadence, keep it, state facts.',
    ],
    quiz: [
      {
        q: 'Users report worse answers since Wednesday; you deployed nothing. Per the triage framework, the FIRST question to investigate is:',
        o: [
          'Which prompt template is currently live',
          'What changed Wednesday that is not a deploy — provider model version, corpus ingest, config',
          'Whether the model temperature is too high',
          'Whether users are phrasing questions differently',
        ],
        x: 1,
        w: '"Recent changes" is the fastest search-space collapser, and non-deploy changes (provider updates, ingest runs) are the classic culprits when your own change log is empty — exactly Day 145\'s drift lesson.',
        revisit: 172,
      },
      {
        q: 'Traces show retrieval returning the correct chunks, but answers contradict them. The failing stage is most likely:',
        o: [
          'The embedding model',
          'The vector index',
          'Prompt assembly or the model call — retrieval\'s output is verifiably fine',
          'The chunking strategy',
        ],
        x: 2,
        w: 'Forensics is bisection over stages: the first stage whose output is wrong owns the bug. Correct chunks in, contradiction out → the fault lies downstream of retrieval.',
        revisit: 142,
      },
      {
        q: 'A user saw content from a document their role cannot access. What makes this scenario different from a quality bug?',
        o: [
          'Nothing — debug it the same way, just faster',
          'It is a security incident: preserve evidence, disable the affected path, notify per the agreed plan — before and alongside debugging',
          'It only matters if the document was truly confidential',
          'It should be hotfixed quietly to avoid alarming the customer',
        ],
        x: 1,
        w: 'Access-control failures trigger a different protocol: evidence preservation, containment, and notification obligations. Quietly fixing it destroys trust AND possibly violates the contract.',
        revisit: 159,
      },
    ],
    resources: [
      { label: 'Google SRE Book — Effective Troubleshooting (ch. 12)', url: 'https://sre.google/sre-book/effective-troubleshooting/', type: 'book', time: '30 min' },
      { label: 'OpenTelemetry Docs — traces refresher', url: 'https://opentelemetry.io/docs/', type: 'docs', time: '15 min' },
      { label: 'Grafana Docs — building the panels your playbooks cite', url: 'https://grafana.com/docs/grafana/latest/', type: 'docs', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Days 169–171', minutes: 10 },
      { activity: 'ELI5 + tech read: triage and forensics', minutes: 20 },
      { activity: 'Guided: three scenarios + log forensics lab', minutes: 40 },
      { activity: 'Practice: incident comms', minutes: 18 },
      { activity: 'Project: runbook v2 with five playbooks', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'First-15-minutes plans written for all three scenarios before reading references',
      'Forensics lab pinpoints the draft document with numbers, not vibes',
      'Three incident messages written within the word limits',
      'Runbook v2 committed with 5 playbooks + draft-source eval case; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 142\'s traces are the flight recorder you just read; Day 158 taught the internal incident machinery — today added the customer in the room. Day 145 predicted the "nothing deployed, everything changed" class of incident.',
      forward: 'Day 174\'s simulation includes a mid-engagement fire drill. Day 177 verifies the runbook and the new eval case as quality gates, and interviewers on Day 179 will ask for exactly the incident story you practiced today.',
    },
    flashcards: [
      { f: 'Triage order before touching code?', b: 'Impact (what/who, quantified) → scope (find the boundary) → recent changes (including non-deploy: provider, corpus, config).' },
      { f: 'LLM forensics method?', b: 'Bisect the pipeline: compare several bad vs good traces; the first stage with wrong output owns the bug.' },
      { f: 'Retrieval right, answer wrong — suspect?', b: 'Downstream: prompt assembly or model call. Retrieval\'s verifiably-correct output exonerates upstream stages.' },
      { f: 'Every hotfix creates what debt?', b: 'Scheduled root-cause fix + regression test + eval case + runbook entry — say both fix layers to the customer.' },
      { f: 'Incident comms rhythm?', b: 'Ack in minutes (facts, no speculation) → updates on a promised cadence → closure with cause, fix, prevention in exec language.' },
      { f: 'Cross-tenant/ACL leak — protocol?', b: 'Security incident: preserve evidence, contain (disable path), notify per plan. Never quietly fix.' },
    ],
    deepDive: [
      { label: 'Blameless postmortem for Scenario A', note: 'Write the full postmortem using Day 158\'s template: timeline, contributing factors (the watched-folder design, not the person who uploaded), action items with owners. Notice how "who uploaded the draft" becomes irrelevant.' },
    ],
  },
  {
    id: 'd173', day: 173, week: 25, phase: 9, kind: 'lesson',
    title: 'ROI, Pricing & Cost Analysis',
    analogy: 'Is the robot worth it?',
    objectives: [
      'Build a full cost model for an AI feature: tokens, infra, and people — per query and per month',
      'Quantify value honestly: time saved, ticket deflection, revenue effects, with an adoption ramp',
      'Run a build-vs-buy comparison that includes total cost of ownership, not just sticker price',
      'Design a pilot with success metrics agreed BEFORE it starts',
      'Compress all of it into a one-page cost analysis an executive will actually read',
    ],
    prereqs: [
      { day: 107, label: 'LLM API cost math' },
      { day: 156, label: 'Caching, batching & cost engineering' },
      { day: 165, label: 'Proposals & architecture docs' },
    ],
    eli5: `A restaurant owner is offered a dishwashing robot: $2,000 a month. Worth it? A bad answer compares $2,000 to zero, because "we wash dishes for free now." A good answer prices the status quo: the dishwasher's wages, the plates broken, the Friday nights when dishes pile up and tables turn slower. Then it prices the robot honestly: $2,000 PLUS electricity, PLUS the plumber who installs it, PLUS the month where the staff still hand-wash because they don't trust it yet. Worth it means: total new cost vs total old cost, including the ramp where you pay both.

Every AI feature is the dishwashing robot. The token bill is just the sticker price — infra, integration work, and the humans who maintain and supervise it are the plumber and the electricity. The value side is never zero either, because the current way of doing things has a cost someone is already paying — it's just hidden in salaries and slow Fridays. Your job is to drag both totals into daylight, on one page, with the assumptions written down so people can argue with the INPUTS instead of with you.`,
    why: `"What does this cost and what do we get?" is the question that decides renewals, expansions, and whether your pilot dies in procurement — and the engineer in the room is usually the only person who can answer it with real numbers. FDEs get pulled into pricing calls constantly: a cost model you can defend line-by-line beats a slide of vibes every time. It also protects YOU: features whose unit economics are underwater (Day 156's lesson) become your 2 a.m. problem when finance notices; better to be the one who noticed first.`,
    tech: `### The cost side: three layers

**Tokens (variable):** cost per query = (input tokens × input price) + (output tokens × output price) + embedding and reranking calls. You measured these on Days 107 and 156; multiply by monthly query volume. The levers that bend the curve — caching hit rate, routing easy queries to a small model, output-length caps — should appear IN the model as adjustable assumptions, because they are your negotiation room. **Infra (semi-fixed):** hosting, vector DB, observability stack, and environment multipliers from Day 170 (a VPC deployment adds their-cloud costs and your support hours). **People (dominant, usually forgotten):** engineering time to build and integrate, ongoing maintenance (evals, corpus upkeep, incident response — budget a realistic fraction of an engineer), and the customer's own time cost for review workflows. On most enterprise AI features, people-cost exceeds token-cost by an order of magnitude. A model that omits it isn't conservative, it's fiction.

### The value side: three honest currencies

**Time saved:** users × uses/week × minutes saved × loaded hourly rate (salary × ~1.3–1.4). Discount it: time saved in 3-minute crumbs does not all convert to productive work — say what fraction you're claiming and why. **Deflection:** tickets or lookups that no longer reach a human: volume × deflection rate × cost per ticket. Deflection rates come from YOUR eval and pilot data, not the vendor deck. **Revenue/risk:** faster quotes, fewer compliance misses — real but softest; quantify with ranges and label the uncertainty. Then apply an **adoption ramp**: value at month 1 is a fraction of steady state, while costs start on day one. ROI = (annual value − annual cost) / annual cost; also report **payback period**, which executives feel more viscerally than percentages.

### Build-vs-buy, pilots, and the one-pager

Build-vs-buy is a TCO comparison over 2–3 years: buy = license + integration + lock-in risk; build = engineering + maintenance + opportunity cost — plus the honest question "is this our differentiator or plumbing?" Pilots convert arguments into data, but only if success metrics (target deflection, satisfaction, usage) are agreed in writing BEFORE the pilot starts; a pilot without pre-agreed metrics is a demo with a longer runtime. The deliverable that carries all this is a one-pager: costs, value, ROI + payback, top 3 assumptions with sensitivity ("if adoption is half, payback moves from 4 to 9 months"), and the pilot proposal. One page is the feature, not the constraint — it forces every number to earn its place.`,
    viz: null,
    guided: [
      {
        title: 'Cost model as code',
        minutes: 20,
        body: `1. Create \`cost_model.py\` from the starter — a transparent, assumption-driven model of your capstone at Meridian (4,000 employees).
2. Run it. Read the per-query cost and the monthly total at baseline assumptions.
3. Replace the placeholder token counts and prices with YOUR real numbers: pull mean input/output tokens from your Day 146 dashboard or Day 156 measurements, and your provider's current prices.
4. Run the three built-in scenarios: baseline, +semantic-cache at 30% hit rate, +routing 40% of queries to a small model. Record the monthly deltas.
5. Add a people-cost line: 0.25 engineer FTE for maintenance at a loaded cost you choose. Notice what it does to the total — and to which lever matters most.`,
        code: `# Transparent cost model - every number is an ASSUMPTION someone can argue with.

A = {
    "employees": 4000,
    "weekly_active_pct": 0.30,        # adoption at steady state
    "queries_per_user_week": 5,
    "in_tokens": 3200,                 # prompt + retrieved context (measure yours!)
    "out_tokens": 350,
    "price_in_per_mtok": 3.00,         # USD per million input tokens (update!)
    "price_out_per_mtok": 15.00,
    "embed_rerank_per_query": 0.0008,  # embedding + reranker cost per query
    "infra_monthly": 900.0,            # hosting, vector DB, observability
    "maint_fte": 0.25,                 # engineer fraction for evals/corpus/incidents
    "fte_loaded_annual": 180000.0,
}

def monthly_cost(a, cache_hit=0.0, small_route=0.0, small_discount=0.85):
    users = a["employees"] * a["weekly_active_pct"]
    q_month = users * a["queries_per_user_week"] * 4.33
    tok = (a["in_tokens"] * a["price_in_per_mtok"]
           + a["out_tokens"] * a["price_out_per_mtok"]) / 1e6
    per_q = tok + a["embed_rerank_per_query"]
    per_q *= (1 - cache_hit)                        # cache hits ~ free
    per_q *= (1 - small_route * small_discount)     # routed queries much cheaper
    llm = q_month * per_q
    people = a["maint_fte"] * a["fte_loaded_annual"] / 12
    total = llm + a["infra_monthly"] + people
    return {"queries": round(q_month), "per_query_usd": round(per_q, 4),
            "llm_usd": round(llm), "infra_usd": a["infra_monthly"],
            "people_usd": round(people), "total_usd": round(total)}

for name, kw in [("baseline", {}),
                 ("with 30% semantic cache", {"cache_hit": 0.30}),
                 ("cache + route 40% small", {"cache_hit": 0.30, "small_route": 0.40})]:
    r = monthly_cost(A, **kw)
    print(f"{name:28s} {r['queries']:>7} q/mo  " +
          f"llm ~{r['llm_usd']:>6}  people ~{r['people_usd']:>6}  TOTAL ~{r['total_usd']:>7}/mo")`,
      },
      {
        title: 'The value side, with a straight face',
        minutes: 18,
        body: `Extend \`cost_model.py\` with the value model — same discipline, assumptions up top.

1. **Time saved:** active users × queries/week × minutes saved per query (estimate 4–8 min vs searching SharePoint or asking a colleague) × loaded hourly rate. Apply a productivity-conversion factor (claim 50%, defend it in a comment).
2. **Deflection:** Meridian's HR/IT helpdesks take ~1,400 policy-type tickets/month at ~USD 12 handled cost. Model deflection at 25% (pilot target) and 45% (steady state).
3. Apply an adoption ramp: months 1–3 at 25%/50%/75% of steady-state value while costs run at 100%.
4. Compute ROI and payback month. Print a 3-line summary.
5. Sensitivity: halve adoption AND minutes-saved. Is the project still above water? That worst-case number is the one you quote to a skeptical CFO — if it survives, you can\'t lose the argument on inputs.`,
      },
    ],
    practice: [
      {
        title: 'Build-vs-buy memo',
        minutes: 20,
        body: `Meridian's IT director asks: "Why shouldn't we just buy DocsBot Enterprise at USD 6/user/month instead of your platform?"

Write a one-page memo comparing 3-year TCO of: (a) buying that SaaS tool, (b) deploying your capstone platform. Constraints: use your cost model's real numbers for (b); for (a) include license (be honest: 1,200 provisioned seats, not 4,000), integration and SSO setup, and the things sticker price hides — data leaves their tenant (Day 170 objection), limited permission-aware retrieval (Day 169), no custom evals. No straw-manning: state what the SaaS option does BETTER (time-to-value, zero maintenance). End with a recommendation and the single assumption that, if wrong, flips it.

Hints: the differentiator question decides more than the spreadsheet — is docs-QA plumbing or strategic for Meridian? TCO includes YOUR maintenance FTE line for option (b).`,
      },
    ],
    project: {
      title: 'The cost-analysis one-pager',
      brief: `Write \`docs/cost-analysis.md\` for the capstone at Meridian — strictly one page. Sections: (1) Cost: per-query and monthly totals at baseline and optimized (cache + routing), the three layers visible; (2) Value: time-saved and deflection with the adoption ramp, stated as a range; (3) ROI + payback month, plus worst-case sensitivity in one sentence; (4) Top 3 assumptions anyone can challenge, each with its sensitivity; (5) Pilot proposal: 8 weeks, 200 users, success metrics pre-agreed (deflection ≥ 20%, weekly active ≥ 40% of pilot group, groundedness ≥ 90% on the golden set). Commit \`cost_model.py\` alongside so every number is reproducible. This one-pager is a required artifact in tomorrow's simulation and gets attacked by a CFO objection there.`,
      rubric: [
        'Cost section shows all three layers; people-cost is present and non-trivial',
        'Every value claim carries an assumption you could defend line-by-line, with a conversion discount on time saved',
        'ROI and payback computed at baseline AND worst-case sensitivity',
        'Pilot metrics are measurable and pre-agreed, not "customer satisfaction improves"',
        'Fits one page; cost_model.py committed and reproduces the numbers',
      ],
    },
    mistakes: [
      'Comparing against zero. The status quo has a cost — salaries spent searching, tickets handled by humans, mistakes from stale answers. Price the current way of working first, or your robot always looks expensive.',
      'Modeling tokens and forgetting people. Maintenance, evals, corpus upkeep, and incident response usually dwarf the token bill; a cost model without an FTE line is fiction that finance will eventually audit.',
      'Claiming 100% of time saved as value. Three minutes saved forty times a day does not become two productive hours; apply and defend a conversion factor or lose credibility on every other number.',
      'Running costs at day-one volume and value at steady state. Adoption ramps; costs don\'t. Model the crossover month honestly — that IS the payback story.',
      'Pilots without pre-agreed metrics. If success criteria are negotiated after the data exists, the pilot proves whatever the loudest person wants; agree the bar in writing before week one.',
      'Hiding assumptions to make the page look confident. Explicit, challengeable assumptions move arguments to inputs — where you win — instead of to your credibility, where nobody wins.',
    ],
    quiz: [
      {
        q: 'Which cost layer most often dominates an enterprise AI feature\'s true monthly cost?',
        o: [
          'Input/output tokens',
          'Vector database hosting',
          'People: maintenance, evals, corpus upkeep, incident response',
          'Embedding calls',
        ],
        x: 2,
        w: 'Token and infra costs are visible and optimizable (Day 156); the recurring human effort to keep the system good is usually an order of magnitude larger and routinely omitted.',
        revisit: 173,
      },
      {
        q: 'The honest way to model value during a rollout is…',
        o: [
          'Steady-state value from month one, since that is the run rate',
          'An adoption ramp on value while costs run at full rate from day one — payback is where they cross',
          'Excluding the first quarter entirely',
          'Counting 100% of time saved as productive gain',
        ],
        x: 1,
        w: 'Costs start immediately; value ramps with adoption. Modeling the crossover gives the payback month, and discounting time-saved conversion keeps the value side defensible.',
        revisit: 173,
      },
      {
        q: 'A customer proposes "let\'s just run a pilot and see how it goes." Your required amendment:',
        o: [
          'Extend the pilot to six months for better data',
          'Agree measurable success metrics and targets in writing before the pilot starts',
          'Restrict the pilot to the friendliest users',
          'Waive fees so cost is not a factor',
        ],
        x: 1,
        w: 'Without pre-agreed metrics, the pilot\'s meaning is decided afterwards by whoever argues best. Pre-committed targets (deflection, usage, quality) turn it into an experiment instead of a long demo.',
        revisit: 173,
      },
    ],
    resources: [
      { label: 'Chip Huyen\'s blog — production LLM economics & architecture posts', url: 'https://huyenchip.com/blog/', type: 'article', time: '25 min' },
      { label: 'PreSales Collective — value engineering for technical sellers', url: 'https://www.presalescollective.com/', type: 'article', time: '15 min' },
      { label: 'Made With ML — product & delivery lessons for ML systems', url: 'https://madewithml.com/', type: 'course', time: '20 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up: due cards from Days 169–172', minutes: 10 },
      { activity: 'ELI5 + tech read: three cost layers, three value currencies', minutes: 20 },
      { activity: 'Guided: cost model + value model as code', minutes: 38 },
      { activity: 'Practice: build-vs-buy memo', minutes: 20 },
      { activity: 'Project: the one-pager', minutes: 22 },
      { activity: 'Quiz + flashcards', minutes: 10 },
    ],
    completion: [
      'cost_model.py runs with YOUR measured token numbers and all three layers',
      'Worst-case sensitivity computed; you know if the project survives it',
      'Build-vs-buy memo names what the buy option does better',
      'One-pager committed at one page; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 107 taught the token meter, Day 156 taught the levers that bend it — today both became lines in a business case. Day 165\'s proposal template gets its "cost" section upgraded from estimate to model.',
      forward: 'Tomorrow\'s simulation (Day 174) fires a CFO objection directly at this one-pager. Day 177 re-runs the final capstone cost analysis as a quality gate, and Day 180\'s Demo Day presentation quotes your payback month.',
    },
    flashcards: [
      { f: 'Three layers of AI feature cost?', b: 'Tokens (variable), infra (semi-fixed), people (maintenance/evals/incidents — usually dominant and usually forgotten).' },
      { f: 'Three value currencies?', b: 'Time saved (discounted for conversion), deflection (volume × rate × cost/ticket), revenue/risk (ranges, labeled soft).' },
      { f: 'Why an adoption ramp?', b: 'Costs run at 100% from day one; value ramps with adoption. The crossover month IS the payback story.' },
      { f: 'Pilot design rule?', b: 'Success metrics agreed in writing BEFORE it starts — otherwise it is a long demo, not an experiment.' },
      { f: 'Where do you want stakeholders to argue?', b: 'With your explicit assumptions (inputs), not your credibility — so put the top 3 assumptions and sensitivities on the page.' },
    ],
    deepDive: [
      { label: 'Unit economics over time', note: 'Extend cost_model.py to project 24 months with corpus growth (more context tokens), price declines (assume −30%/yr), and adoption growth. Which force wins?' },
    ],
  },
  {
    id: 'd174', day: 174, week: 25, phase: 9, kind: 'project',
    title: 'FDE Simulation II — Full Cycle',
    analogy: 'The engagement',
    objectives: [
      'Run a complete FDE engagement solo and timed: discovery → requirements → proposal → prototype plan → demo script',
      'Answer two written stakeholder objections without over-promising or capitulating',
      'Handle a mid-course scope change with an impact analysis and options, not a silent yes or a flat no',
      'Self-grade honestly against the FDE rubric and identify your weakest dimension for tomorrow',
    ],
    prereqs: [
      { day: 168, label: 'FDE Simulation I' },
      { day: 171, label: 'Stakeholders & trade-offs' },
      { day: 173, label: 'ROI & cost analysis' },
    ],
    eli5: `Flight schools end with a check ride: a full flight — preflight, takeoff, navigation, and the part that actually decides your license: the examiner pulls the throttle mid-flight and says "your engine just died." Nobody fails a check ride for imperfect straight-and-level flying. They fail for panicking when the plan changes.

Simulation I (Day 168) was the first half of the flight — discovery to proposal, with the air calm. Today the examiner rides along the whole way: a new prospect, the full sequence of deliverables, and then the throttle-pull — two stakeholders push back in writing, and midway through, the customer changes what they want. Real engagements are exactly this: the proposal is never the end, it is the thing people start arguing with. You are graded on the same thing as the pilot: not perfection, but composure with a method — impact analysis before commitment, options instead of yes/no, and deliverables that stay coherent after the turbulence.`,
    why: `FDE and solutions-engineering interviews are converging on exactly this format: a take-home or live simulation with a scenario, an objection, and a curveball — because it predicts job performance better than any whiteboard. More importantly, the first real engagement of your career will go exactly like today: the CISO email, the CFO skepticism, and the scope change WILL arrive, usually in the same week. Having produced this document package once under a timer means you will produce it the second time — with a real logo on it — without the panic.`,
    tech: `### How today runs

This is a timed solo simulation. Total working time: ~95 minutes across three milestones. Rules of the game: use everything you have built (Day 164's requirements template, Day 165's proposal structure, Day 169's enterprise addendum, Day 170's deployment matrix, Day 173's cost model — reuse is realism, FDEs never start from blank pages), but write fresh prose for THIS customer. Do not peek at Milestone 3's artifacts until Milestones 1–2 are done — the surprise is part of the training effect.

### The engagement architecture

You will produce the standard engagement package: (1) a problem statement + scoped requirements (functional, non-functional, out-of-scope — the "later" list is where deals stay honest); (2) a proposal: approach, C4-context-level architecture in text, v0/v1 scope ladder, timeline as ranges, risks with mitigations, and the cost/pilot section powered by yesterday's model; (3) a demo plan for the prototype (Day 167's arc: problem → magic → how → next). Then the package meets contact: two objections and a change request arrive as written artifacts, and your replies become part of the graded deliverable.

### The grading frame

Self-graded against the FDE rubric from Day 168, extended with two new dimensions — objection handling and change management — for seven total: discovery fidelity (did you answer THEIR stated pain or a generic one?), scoping discipline, architecture soundness, communication register (exec vs eng, Day 171), commercial credibility (numbers that survive a CFO, Day 173), objection handling (conceding what is true, holding what is not), and change management (impact → options → recommendation). Each scored 1–4 with written justification; the honesty of the self-grade is itself graded tomorrow, when Day 175 has you rewrite the weakest deliverable.`,
    viz: null,
    guided: [
      {
        title: 'Milestone 1 — The brief and discovery notes (read, then scope)',
        minutes: 25,
        body: `Start your timer. Read the scenario, then produce a one-page problem statement + requirements doc (Day 164's template: functional, non-functional, constraints, out-of-scope, acceptance criteria).

~~~text
CUSTOMER BRIEF — Northwind Freight
International freight forwarder. 2,800 employees, 14 countries. Azure/Microsoft
shop, conservative IT, one prior AI pilot (a chatbot) that "embarrassed everyone."

Sponsor: Dana Okafor, VP Ops. Economic buyer: CFO. Wary party: CISO (the
chatbot pilot leaked a rate sheet to a customer).

From the discovery call (your notes):
- Ops staff answer internal questions all day: customs documentation rules,
  carrier SLA terms, HS-code procedures, internal SOPs. "Our senior people are
  human search engines. New hires take 9 months to stop asking."
- Knowledge lives in: SharePoint (SOPs, ~12k docs), a carrier-contract folder
  (PDFs, some scanned), and Maria in Rotterdam, who is retiring in March.
- Dana's stated goal: "Cut time-to-answer for ops questions from ~20 minutes
  to under 2. New-hire ramp is the board-level story."
- Volume guess: ~600 ops staff, "dozens of questions a day each, honestly."
- Constraint from IT (relayed): nothing leaves the Azure tenant; Entra ID SSO
  mandatory; the CISO will personally review anything before it touches SOPs.
- Prior-pilot scar tissue: any wrong answer shown to a customer is a
  fireable-offense-level fear. Internal-only is acceptable for v0.
- Timeline pressure: Dana wants something visible before the April board
  meeting (10 weeks out).
~~~

Scoping notes: decide what v0 is (internal docs-QA over SharePoint SOPs + contracts, VPC/tenant deployment, SSO) and what is explicitly OUT (anything customer-facing, live shipment data, the scanned PDFs if OCR risk is high — your call, but write it down). Every requirement must trace to a line in the notes — invent nothing Dana didn't say.`,
      },
      {
        title: 'Milestone 2 — Proposal, prototype plan & demo script',
        minutes: 35,
        body: `Produce the proposal (2–3 pages max) and the demo plan.

1. **Approach & architecture:** C4-context in text — Northwind users, Entra ID, SharePoint, your service in THEIR Azure tenant (Day 170's matrix says which model access path; justify it to a CISO who watched a chatbot leak a rate sheet). Name the guardrails and permission-aware retrieval explicitly (Days 132, 169) — this customer's scar tissue demands it in the proposal, not the appendix.
2. **Scope ladder:** v0 (10 weeks, board-demo-able), v1, later. The out-of-scope list from Milestone 1 appears here verbatim.
3. **Plan with ranges:** phases with week ranges, and the calendar-vs-engineering split (Day 169) — the Entra app registration and CISO review are on the critical path, so they start week 1.
4. **Risks:** top 4 with mitigations. (If "scanned PDFs OCR poorly" and "adoption fails because Maria answers faster" aren't on your list, look harder.)
5. **Commercials:** adapt yesterday's cost model to 600 ops users; pilot with pre-agreed metrics (time-to-answer sampled before/after, weekly active %, groundedness on a Northwind golden set).
6. **Demo script:** 10-minute board-meeting demo, Day 167's arc, with the two prepared failure recoveries.`,
      },
      {
        title: 'Milestone 3 — Objections and the throttle-pull (open only after M2)',
        minutes: 35,
        body: `Three artifacts just landed. Respond to each in writing. Objection replies ≤ 250 words each; the change-request response is an impact analysis + options memo (≤ 1 page).

~~~text
ARTIFACT 1 — Email from Priya Nair, CISO
Subject: RE: Proposal — security concerns

I'll be direct. The last "AI assistant" this company piloted sent a
confidential rate sheet to a customer. I have read your proposal. Questions:
(1) You say data stays in our tenant, but the model API is external. Which
is it? Exactly what leaves, in what form, and is it retained or trained on?
(2) Your assistant reads all of SharePoint with a service account. Our
SharePoint permissions are, frankly, a mess. What stops an ops trainee
from surfacing an M&A document a VP left in the wrong folder?
(3) I want the audit log spec — every question, every document cited, every
user — before I approve anything. Retention 7 years.
I am not opposed. I am unconvinced. — P.
~~~

~~~text
ARTIFACT 2 — Email from Marcus Webb, CFO (forwarded by Dana: "help?")
Subject: FW: Proposal — the numbers

Dana, your vendor quotes ~USD 9k/month all-in plus a 10-week build. Ops
answered these questions for free last year. The "time saved" math assumes
600 people save 15 min/day, which I frankly do not believe — nobody returns
saved minutes to the company. And Maria answered questions for 30 years
without a line item. What am I actually buying, what happens if adoption
is half the assumption, and why not the USD 6/seat tool IT found online?
~~~

~~~text
ARTIFACT 3 — Change request from Dana Okafor (week 4 of the engagement,
prototype in progress)
Subject: One change before the board meeting

Leadership loved the preview. One change: they want the CUSTOMER-FACING
support team using it for the board demo — answering customer emails about
shipment status and customs delays. Same corpus, right? IT says the
shipment-tracking database has an API. Timeline stays: board meeting in
6 weeks. This is the difference between a pilot and a company-wide rollout,
so I need a yes here. — D.
~~~

Response guidance — hold your ground where the ground is real: Priya gets exact data-flow facts (Day 169's addendum answers 1 and 3; permission-aware retrieval answers 2 — and concede honestly that permission hygiene is a shared risk, proposing the pre-launch ACL audit). Marcus gets the worst-case sensitivity you already computed, the deflection number (which does not depend on "returning minutes"), the buy-option comparison done straight, and the pilot as the honest "if I'm wrong, you find out cheap" offer. Dana's change request is the trap: customer-facing + live operational data + the SAME 6 weeks is the chatbot incident waiting to recur — her own board's biggest fear. Impact-analyze (new risk class, new data integration, new evals, the guardrail bar jumping from internal to external), then offer options: e.g. (A) board demo shows customer-facing flow on FROZEN data, clearly labeled, internal rollout ships as planned; (B) full customer-facing adds N weeks after v0; (C) scope swap. Recommend one, tied to HER stated fear of public wrong answers.`,
      },
    ],
    practice: [
      {
        title: 'Self-grade against the seven dimensions',
        minutes: 15,
        body: `Timer off. Grade the whole package against the seven-dimension rubric (discovery fidelity, scoping discipline, architecture soundness, communication register, commercial credibility, objection handling, change management), 1–4 each, with one sentence of evidence per score — quote your own deliverable.

Constraints: at least one dimension must score ≤ 2 (if everything is a 4, re-read Milestone 3 asking "would Priya actually be convinced?"); write down the single weakest dimension and WHY — Day 175 starts there. Then diff your package against Day 168's Simulation I output: name two concrete ways today's is better and one way it is still weak.`,
      },
    ],
    project: {
      title: 'The engagement package',
      brief: `Assemble everything into \`portfolio/fde-sim-2/\` in your practice repo: \`01-requirements.md\`, \`02-proposal.md\` (with demo script), \`03-objection-ciso.md\`, \`04-objection-cfo.md\`, \`05-change-request-response.md\`, and \`06-self-grade.md\`. This directory is a portfolio artifact — recruiters and interviewers can read an entire simulated engagement end-to-end, which is rarer and more convincing than another to-do app. Commit with a README fronting the scenario in three sentences.`,
      rubric: [
        'Every v0 requirement traces to a specific line of the discovery notes',
        'Proposal names guardrails + permission-aware retrieval in the main body, with the CISO\'s scar tissue explicitly acknowledged',
        'CFO reply uses the worst-case sensitivity number and offers the metric-gated pilot',
        'Change-request response contains an impact analysis and ≥ 2 options with dates, recommending one tied to Dana\'s stated fear',
        'Self-grade has written evidence per dimension and at least one score ≤ 2',
        'Package committed under portfolio/fde-sim-2/ with a scenario README',
      ],
    },
    mistakes: [
      'Reusing Meridian\'s documents with the names swapped. Discovery fidelity is the first rubric dimension: Northwind\'s scar tissue (the leaked rate sheet), its retiring expert, and its board deadline must visibly shape YOUR scope and prose.',
      'Answering the CISO with reassurance instead of facts. "We take security very seriously" is what the last vendor said; exact data flows, retention terms, and the ACL-audit proposal are what changes her mind.',
      'Fighting the CFO on his own simplification. "Nobody returns saved minutes" is partially TRUE — concede it, then stand on deflection and the pilot, which don\'t depend on it.',
      'Saying yes to Dana because she said "I need a yes here." Sponsors under board pressure ask for exactly the thing that would burn them; the loyal move is the impact analysis and the labeled-demo option, not obedience.',
      'Blowing the timebox polishing Milestone 2. Real engagements ration attention; a good-enough proposal with strong objection replies beats a perfect proposal with rushed ones — and the rubric weights them equally.',
      'Grading yourself 4s. The self-grade is calibration training for Day 175 and for real retros; an all-4 grade means the grader failed, not the work succeeded.',
    ],
    quiz: [
      {
        q: 'The CISO asks "what exactly leaves our tenant?" The winning response style is:',
        o: [
          'Reassurance about your company\'s security certifications',
          'Exact data flows: what is sent to the model API, in what form, retention and training terms, plus the audit-log spec she asked for',
          'Deferring to a security-team call to be scheduled later',
          'Offering the air-gapped deployment to end the discussion',
        ],
        x: 1,
        w: 'Unconvinced-but-not-opposed reviewers convert on verifiable specifics, not vibes. She asked three concrete questions; the reply that answers all three concretely (and concedes shared risks honestly) wins.',
        revisit: 169,
      },
      {
        q: 'Dana\'s change request (customer-facing + live shipment data, same timeline) is dangerous primarily because:',
        o: [
          'The shipment API might be poorly documented',
          'It jumps the risk class — external users and live operational data — recreating the exact failure mode (public wrong answers) this customer already suffered, without time for the new eval and guardrail bar',
          'It would require renegotiating the contract price',
          'Customer-facing UIs take longer to build than internal ones',
        ],
        x: 1,
        w: 'Scope changes that cross a risk boundary (internal→external, docs→live data) are not additive work — they reset the safety requirements. The impact analysis names this; the options let Dana get her board moment safely.',
        revisit: 174,
      },
      {
        q: 'Your worst-case sensitivity (half adoption, half minutes-saved) shows the project barely breaks even. In the CFO reply you should:',
        o: [
          'Omit it — leading with weakness loses negotiations',
          'Quote it — paired with the metric-gated pilot as the cheap way to find out, it is your most credible number',
          'Recompute with more favorable assumptions first',
          'Redirect the conversation to strategic value',
        ],
        x: 1,
        w: 'A skeptic trusts the number that survives his own skepticism. Break-even-at-worst-case plus a pilot that measures the real inputs is a stronger commercial argument than an optimistic ROI he\'ll discount to zero.',
        revisit: 173,
      },
    ],
    resources: [
      { label: 'FDE Interview Guide (Exponent) — the simulation round format', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '20 min' },
      { label: 'The Mom Test — re-skim before Milestone 1', url: 'https://www.momtestbook.com/', type: 'book', time: '15 min' },
      { label: 'C4 Model — context-level diagrams for the proposal', url: 'https://c4model.com/', type: 'docs', time: '10 min' },
      { label: 'arc42 — proposal/architecture doc structure', url: 'https://arc42.org/overview', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep warm-up + rules of the game', minutes: 10 },
      { activity: 'Milestone 1: brief + requirements (timed)', minutes: 25 },
      { activity: 'Milestone 2: proposal + demo plan (timed)', minutes: 35 },
      { activity: 'Milestone 3: objections + change request (timed)', minutes: 35 },
      { activity: 'Practice: self-grade + quiz', minutes: 15 },
    ],
    completion: [
      'All six package files committed under portfolio/fde-sim-2/',
      'Milestone 3 responses written without breaking the ≤ 250-word / 1-page limits',
      'Self-grade contains evidence quotes and one score ≤ 2',
      'Weakest dimension named in writing for tomorrow; quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 168\'s simulation with the second act added: Day 171\'s no-with-options carried the change request, Day 173\'s sensitivity number carried the CFO, and Day 169\'s addendum carried the CISO. Day 166\'s labeled-prototype honesty is what makes option A ethical.',
      forward: 'Tomorrow (Day 175) you rewrite today\'s weakest deliverable and fold the lessons into the capstone punch list. On Day 179, Northwind becomes an interview story; on Day 180, this package is a portfolio exhibit.',
    },
    flashcards: [
      { f: 'The full engagement package?', b: 'Requirements → proposal (architecture, scope ladder, risks, commercials) → demo plan → objection replies → change-request impact memo.' },
      { f: 'Objection handling in one rule?', b: 'Concede what is true, hold what is not — with verifiable specifics, never reassurance.' },
      { f: 'Change request crossing a risk boundary?', b: 'Internal→external or docs→live data resets safety requirements. Impact analysis + options, never a silent yes.' },
      { f: 'Why quote your worst-case number to a skeptic?', b: 'The number that survives his skepticism is the only one he\'ll trust — pair it with a metric-gated pilot.' },
      { f: 'Sponsor asks for the thing that would burn them?', b: 'Loyalty = impact analysis + a safe option serving their real goal (the board moment), not obedience.' },
    ],
    deepDive: [
      { label: 'Run Milestone 3 live', note: 'Have a friend (or the AI tutor in adversary mode) play Priya and Marcus on a call and push back on your written replies in real time — the spoken version is the interview format.' },
    ],
  },
  {
    id: 'd175', day: 175, week: 25, phase: 9, kind: 'review',
    title: 'Week 25 Checkpoint: Debrief & Gap Closure',
    analogy: 'The after-action review',
    objectives: [
      'Debrief the Simulation II package against the rubric and rewrite the weakest deliverable properly',
      'Drill the week\'s enterprise-delivery material with spaced recall until it retrieves cold',
      'Sweep the interview error log from all drills (Days 28–174) and classify what remains open',
      'Finalize the capstone punch list that drives the finale (Days 176–178)',
    ],
    prereqs: [
      { day: 174, label: 'FDE Simulation II' },
      { day: 168, label: 'FDE Simulation I' },
      { day: 28, label: 'The interview error log' },
    ],
    eli5: `After every mission, good squadrons run the same ritual: What was supposed to happen? What actually happened? Why the gap? What do we change before the next flight? Rank comes off at the door — the point is not blame, it is that the same mistake never flies twice. The worst squadrons skip the debrief when the mission went "fine," which is exactly how fine slowly decays into failure.

Today is your after-action review for the whole week — and the launchpad for the final five days. Yesterday's simulation produced a self-grade with a weakest dimension; today you don't just note it, you REWRITE that deliverable until it would score a 4, because the rewrite (not the noticing) is where the skill change happens. Then the review-day machinery you know: spaced recall over the week's material — SSO flows, deployment models, the trade-off pentagon, triage frameworks, cost layers — pulled from memory before checking, because retrieval practice is what moves knowledge from "I read that" to "I can use that in a meeting." Last: walk the punch list into the finale with clear eyes.`,
    why: `The debrief habit is itself a hireable skill: interviewers ask "tell me about a time you got feedback" and can hear within seconds whether you have a real revision practice or just nod at critiques. Practically, this is the last checkpoint before the finale — Days 176–178 execute the capstone punch list you freeze today, so an honest gap inventory now is the difference between a finale that hardens a real product and one that polishes the wrong things.`,
    tech: `### Why the rewrite, not the review, is the work

Testing yourself (Day 174's self-grade) identifies gaps; only regenerating the artifact closes them. The learning-science term is the generation effect: producing the corrected version encodes far more than re-reading the critique. So the debrief protocol is: pick the weakest deliverable, write down what a 4/4 version does differently (three specific properties, not "better"), rewrite it fresh — not edited, rewritten — then diff old vs new and name what changed. This mirrors Day 19's regression-test habit: every failure becomes a permanent upgrade, not a memory.

### This week's recall targets

The material that must survive without notes, because it comes up in meetings where you can't check: the OIDC flow and its three token checks; SCIM's job; permission-aware retrieval's mechanism; the three deployment models and their support-cost gradient; the diagnostic-bundle rules; the pentagon and no-with-options; impact → scope → recent-changes; hotfix-vs-root-cause debt; the three cost layers and three value currencies; pilot pre-commitment. Drill format: closed-notes brain dump per topic, then diff against the day's flashcards and tech section — the diff IS the study list.

### The error log's last full sweep

Your interview error log has accumulated since Day 28 across DSA drills (35, 84), ML vivas, sim rubrics, and red-team findings. Today: classify every open entry as CLOSED (verified fixed by later work — link the evidence), DRILL (goes into Day 179's interview gym), or ACCEPT (consciously deprioritized — write why). An honest ACCEPT list is a sign of seniority, not weakness; unbounded to-do lists are how prep collapses. The punch list works the same way: every open capstone issue gets a day assignment (176: hardening, 177: gates, 178: ship/docs) or an explicit WON'T-FIX with a reason — that reason may be asked about on Demo Day.`,
    viz: null,
    guided: [
      {
        title: 'Rewrite the weakest deliverable',
        minutes: 25,
        body: `1. Open yesterday's \`06-self-grade.md\` and confirm the weakest dimension (score ≤ 2).
2. Write the target spec: three concrete properties the 4/4 version has. (Example, if objection handling was weakest: "answers all three of Priya's questions with verifiable specifics", "concedes the shared ACL risk and proposes the audit", "ends with a specific next step she controls".)
3. Close the old file. Rewrite the deliverable from scratch in \`07-rewrite.md\` — fresh prose, 25 minutes hard cap.
4. Diff against the original. In three sentences at the bottom: what changed, and which HABIT caused the original weakness (rushed timebox? reassurance reflex? numbers without sources?). That habit line is the actual takeaway.`,
      },
      {
        title: 'Closed-notes recall circuit',
        minutes: 20,
        body: `Editor closed, six index cards (or six headings on paper), four minutes each — write everything you can retrieve, then check against Days 169–174 and mark gaps:

1. Draw the OIDC auth-code flow and list the token checks; state what SCIM adds.
2. The three deployment models table from memory: data, keys, updates, debugging, LLM path, support cost.
3. The trade-off pentagon + the no-with-options formula, with one worked example from Wednesday.
4. The triage framework + the LLM pipeline stages you bisect during forensics.
5. Cost model from memory: three cost layers, three value currencies, why the ramp matters, pilot rule.
6. The seven simulation rubric dimensions.

Scoring: a topic with ≥ 2 real gaps gets its flashcards re-drilled tonight and again on Day 179's warm-up.`,
      },
    ],
    practice: [
      {
        title: 'Error-log triage and punch-list freeze',
        minutes: 25,
        body: `Two passes, no new work — decisions only.

**Pass 1 — error log (Days 28 → 174):** every open entry becomes CLOSED (link the evidence: "hash-map complexity confusions — closed by D84 drill, 5/5 since"), DRILL (tag with its Day 179 station: DSA / ML rapid-fire / system design / behavioral), or ACCEPT (one written sentence of why). Target: a DRILL list of ≤ 12 items — that is what Day 179 can actually service.

**Pass 2 — capstone punch list:** merge open issues from your repo tracker, Day 161's cutover notes, Day 172's runbook gaps, and anything this week exposed (enterprise addendum promises the capstone doesn't keep yet?). Assign every item to D176 (hardening), D177 (gates), D178 (ship/docs), or WON'T-FIX with a reason. Constraints: D176's list must fit in ~75 minutes of work — cut until it does; a WON'T-FIX on anything security-adjacent needs a mitigating control noted, because Demo Day questions go there first.`,
      },
    ],
    project: {
      title: 'Week 25 checkpoint package',
      brief: `Commit three artifacts: (1) \`07-rewrite.md\` in the sim package with its diff notes and the habit line; (2) the triaged error log with every entry dispositioned and the ≤ 12-item DRILL list extracted to \`portfolio/interview-prep/drill-list.md\`; (3) \`docs/finale-punch-list.md\` in the capstone repo with every item day-assigned or reasoned WON'T-FIX. Take the cumulative week quiz. This package is small by design — today's value is decisions and one high-quality rewrite, not volume.`,
      rubric: [
        'Rewrite exists as fresh prose, meets its own three-property spec, and names the causal habit',
        'Recall circuit completed for all six topics with gaps marked honestly',
        'Error log fully dispositioned; DRILL list ≤ 12 items, each tagged to a Day 179 station',
        'Punch list frozen: every item has a day or a reasoned WON\'T-FIX; D176 load fits ~75 min',
        'Week quiz taken; any missed question\'s revisit day added to tonight\'s cards',
      ],
    },
    mistakes: [
      'Debriefing by re-reading instead of rewriting. Noticing a weakness changes nothing; regenerating the artifact is where encoding happens — the generation effect is the whole point of today.',
      'Grading the rewrite against vibes. Write the three-property spec FIRST, then rewrite to it; otherwise "better" just means "longer."',
      'A drill list of 40 items. Day 179 is one day; an honest 12 beats an aspirational 40 that guarantees shallow passes over everything.',
      'Letting the punch list grow during the freeze. Today items get ASSIGNED or CUT, never added-and-vaguely-hoped; the finale has fixed capacity and Demo Day does not move.',
      'Silent WON\'T-FIXes on security items. Cutting is fine; cutting without a noted mitigating control hands Demo Day reviewers (and real security reviews) their first question.',
      'Skipping the recall circuit because "I just did all this." Recognition decays in days; retrieval is what you\'ll have in the meeting. The circuit takes 20 minutes and is the cheapest insurance in the whole week.',
    ],
    quiz: [
      {
        q: 'A customer\'s IdP-initiated login works, but a departed employee could still use the assistant for a week. Which mechanism was missing?',
        o: [
          'SAML instead of OIDC',
          'SCIM provisioning (or group re-check at token refresh) driving deactivation',
          'A stronger password policy',
          'An API gateway',
        ],
        x: 1,
        w: 'SSO authenticates whoever the IdP still vouches for at login; deprovisioning is SCIM\'s job (or at minimum re-validating groups on every session). This is the classic security-review finding from Day 169.',
        revisit: 169,
      },
      {
        q: 'Mid-pilot, answer quality drops. Your deploy log is empty, but Wednesday saw a corpus ingest and the provider shipped a model update. Per Day 172\'s framework you check first:',
        o: [
          'The model update — providers change things silently',
          'Whichever the flagged traces implicate: pull bad traces, check which stage\'s output changed, and let the boundary of the failure decide',
          'The prompt template, since it is easiest to roll back',
          'User phrasing drift',
        ],
        x: 1,
        w: 'Both are legitimate "recent changes," so you let evidence arbitrate: traces showing bad answers citing new-ingest chunks indict the corpus; degradation across all corpora points at the model. Scope finds the boundary; the boundary is the clue.',
        revisit: 172,
      },
      {
        q: 'Why does Day 175 make you REWRITE the weakest simulation deliverable instead of annotating it?',
        o: [
          'Rewrites look better in the portfolio',
          'Generation beats recognition: producing the corrected artifact encodes the skill; reading critiques only encodes familiarity',
          'The original file format was wrong',
          'Interviewers require two drafts of everything',
        ],
        x: 1,
        w: 'The generation effect — the same reason review days use closed-notes recall. The diff plus the named causal habit turns one artifact\'s weakness into a transferable fix.',
        revisit: 175,
      },
    ],
    resources: [
      { label: 'FDE Interview Guide (Exponent) — rubric dimensions to grade against', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
      { label: 'Google Technical Writing — self-editing for the rewrite', url: 'https://developers.google.com/tech-writing', type: 'course', time: '20 min' },
      { label: 'Tech Interview Handbook — planning the final prep week', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '15 min' },
    ],
    schedule: [
      { activity: 'Spaced-rep: full due deck for Week 25', minutes: 15 },
      { activity: 'Guided: rewrite the weakest deliverable', minutes: 25 },
      { activity: 'Guided: closed-notes recall circuit', minutes: 20 },
      { activity: 'Practice: error-log triage + punch-list freeze', minutes: 25 },
      { activity: 'Commit checkpoint package', minutes: 15 },
      { activity: 'Cumulative week quiz + card updates', minutes: 15 },
    ],
    completion: [
      'Rewrite committed with diff notes and the causal habit named',
      'All six recall topics attempted closed-notes; gaps marked for re-drill',
      'DRILL list ≤ 12 items committed; punch list frozen with day assignments',
      'Week quiz ≥ 2/3 with revisit days scheduled for misses',
    ],
    connections: {
      back: 'This is Day 28\'s error log reaching its final full sweep, Day 168\'s rubric applied with a week more skill, and the same rewrite discipline Day 19 taught for bugs — every failure becomes a permanent upgrade.',
      forward: 'Days 176–178 execute the punch list you froze today, exactly as written. Day 179 drills the ≤ 12-item DRILL list, and Day 180\'s gap-analysis protocol is this day\'s method applied to the whole program.',
    },
    flashcards: [
      { f: 'After-action review — four questions?', b: 'What was supposed to happen? What happened? Why the gap? What changes before next time — with the change EXECUTED, not noted.' },
      { f: 'Generation effect?', b: 'Producing the corrected artifact encodes skill; re-reading critiques only builds familiarity. Rewrite, then diff.' },
      { f: 'Error-log dispositions?', b: 'CLOSED (evidence linked), DRILL (≤ 12 items, tagged to a station), ACCEPT (written reason). Unbounded lists kill prep.' },
      { f: 'Punch-list freeze rule?', b: 'Every item gets a finale day or a reasoned WON\'T-FIX; security cuts need a noted mitigating control.' },
      { f: 'Why closed-notes recall on review days?', b: 'Meetings and interviews run on retrieval, not recognition — and the diff against notes IS the study list.' },
    ],
    deepDive: [
      { label: 'Debrief culture', note: 'Read up on aviation/military debrief practice ("nameless and rankless") and write three sentences on how you\'d run a blameless project debrief with a real customer team — it pairs with Day 158\'s postmortems.' },
    ],
  },
  {
    id: 'd176', day: 176, week: 26, phase: 9, kind: 'project',
    title: 'Capstone Hardening',
    analogy: 'Punch-list week begins',
    objectives: [
      'Close the D176-assigned punch-list items: auth, rate limiting, and input validation at every entry point',
      'Replace every leaky or vague error path with honest, actionable failure messages',
      'Complete structured logging coverage and clean the configuration surface',
      'Leave the repo in a state where a stranger could run it from the README alone',
    ],
    prereqs: [
      { day: 161, label: 'Production cutover' },
      { day: 45, label: 'Web service architecture & hardening' },
      { day: 175, label: 'The frozen punch list' },
    ],
    eli5: `When a building is "finished," the builder and the owner walk every room with a punch list: the door that sticks, the outlet with no cover, the window that whistles in wind. None of these stop the building from standing — and every one of them is what the owner will actually touch every day. Punch-list week is where a structure becomes a building people trust.

Your capstone stands: it answered questions in production back on Day 161. This week is the walk-through with the owner's eyes. Today is the doors-and-locks day: can anyone walk in without a badge (auth)? Can one visitor hog every elevator (rate limits)? If someone shoves garbage through the mail slot, does it jam the building or bounce politely (validation)? And when something does break, does the building say "ERROR 500" — or does it say which door stuck, what you can do now, and who has been notified? The difference between a demo and a product is almost entirely in these unglamorous rooms — which is exactly why Day 177's inspector and Day 180's audience will look there first.`,
    why: `Hiring managers who open candidate portfolios see a hundred demos that collapse at the first malformed request; a repo whose error paths, auth, and logs are visibly production-grade reads as "this person has operated software," which is the actual hiring signal. And the skills rehearsed today — hardening an AI service's entry points, writing honest failure messages for LLM-specific errors — are precisely week one of any FDE deployment, where the customer's pen-tester, not a reviewer, does the walking.`,
    tech: `### Today's architecture of work

This is a project day driven by the frozen punch list, structured as three passes over the same codebase, outside-in. **Pass 1 — the perimeter:** every route (API and UI) behind auth (your Day 45/169 middleware — verify, don't assume: write the test that calls each route with no token, an expired token, a wrong-audience token); per-user rate limiting on the expensive paths (the LLM-backed ones — a token-bucket per user id, with a 429 + Retry-After response, Day 47's machinery); strict input validation with pydantic at every boundary — length caps on queries (context-budget protection, Day 122), content-type checks on ingest, metadata allowlists on filters.

**Pass 2 — honest failure.** Enumerate the capstone's real failure modes: provider timeout/rate-limit, retrieval empty, groundedness-check failed, ingest parse error, vector DB down. Each gets: a stable error code, a user-facing message that says what happened + what to do now, honest degradation where designed (Day 158's fallback chain — cached answer labeled as cached, or "I can't answer reliably right now" instead of a hallucinated guess), and a structured log line with trace id. The anti-pattern being executed out of the codebase today: \`except Exception: return "Something went wrong"\` — which discards exactly the information Day 172's playbooks need.

**Pass 3 — the surface.** Config cleanup: one settings module, env-var driven (12-factor, Day 45), \`.env.example\` regenerated to match reality, no secret defaults, every knob documented in one table. Logging audit: every request path emits structured start/finish/error events with consistent fields (trace id, user id, latency, token counts) — the fields your Day 146 dashboard and Day 172 forensics assume. README truth-pass: a stranger with Docker installed follows it top-to-bottom; every command must actually work.

The discipline: work the frozen list, not the ideas that occur to you mid-flight — new ideas go to the backlog for post-program. Scope integrity today is what makes tomorrow's quality gates meaningful.`,
    viz: null,
    guided: [
      {
        title: 'Pass 1 — perimeter: auth, rate limits, validation',
        minutes: 25,
        body: `1. Write the perimeter test FIRST: for every route, assert 401 with no/expired/wrong-audience tokens (parametrize over your route table — Day 18's pytest muscle). Run it; fix every route that fails open.
2. Add per-user rate limiting to the \`/ask\` and \`/ingest\` paths from the starter pattern. Verify: burst 20 requests as one user → 429 with Retry-After; a second user is unaffected.
3. Validation sweep: query length cap (chars AND a token estimate), ingest content-type allowlist, metadata filter keys allowlisted against a schema. Each rejection returns 422 with the field named.
4. Commit per sub-item with punch-list references in the messages.`,
        code: `import time
from collections import defaultdict
from fastapi import HTTPException, Request

# Minimal per-user token bucket - swap for Redis-backed in multi-replica deploys.
BUCKETS: dict = defaultdict(lambda: {"tokens": 10.0, "ts": time.monotonic()})
RATE = 10 / 60.0   # 10 requests / minute
BURST = 10.0

def check_rate_limit(user_id: str):
    b = BUCKETS[user_id]
    now = time.monotonic()
    b["tokens"] = min(BURST, b["tokens"] + (now - b["ts"]) * RATE)
    b["ts"] = now
    if b["tokens"] < 1.0:
        retry = int((1.0 - b["tokens"]) / RATE) + 1
        raise HTTPException(status_code=429,
                            detail={"code": "rate_limited",
                                    "message": "Too many requests. Try again shortly.",
                                    "retry_after_s": retry},
                            headers={"Retry-After": str(retry)})
    b["tokens"] -= 1.0

# Usage in a route, after auth resolves the user:
#   check_rate_limit(user.id)
# Test: burst 20 calls for user A -> expect 429 by call ~11; user B unaffected.`,
      },
      {
        title: 'Pass 2 — honest failure messages',
        minutes: 25,
        body: `1. Build the failure-mode table in \`docs/failure-modes.md\`: five rows minimum (provider timeout, provider rate-limit, retrieval empty, low-groundedness answer, vector DB unreachable). Columns: stable code · user sees · system does (fallback? retry? refuse?) · log fields.
2. Implement each: replace blanket except-blocks with typed handlers that emit the table's exact user message and log line. The refusal path matters most: when groundedness fails, the honest "I can't answer that reliably from the current docs — here's what I searched" beats a confident guess. Wire it to return the searched-sources list.
3. Break things to verify: point the vector DB at a dead port, set the provider key invalid, ask an unanswerable question. Confirm each produces its table row exactly — message, status, log line with trace id.
4. Commit with the table; Day 177 re-runs these three breaks as gates.`,
      },
    ],
    practice: [
      {
        title: 'Pass 3 — config, logging, README truth',
        minutes: 25,
        body: `No steps provided — you know this codebase. Goals: (1) one config module, \`.env.example\` regenerated and complete, zero secrets in defaults or git history (check!); (2) structured log events on every request path with the consistent field set your dashboard expects — grep your logs after a manual session to prove no path is silent; (3) README executed literally top-to-bottom in a fresh clone + fresh containers; fix every drifted command.

Constraints: frozen list only — new feature ideas go to \`docs/backlog.md\`; timebox hard at 25 minutes, unfinished items return to the punch list explicitly rather than silently.

Hints: \`git log --diff-filter=A -- .env\` answers "was a real .env ever committed"; the README lie is usually in the FIRST command (a rename you forgot).`,
      },
    ],
    project: {
      title: 'Punch-list execution: hardening day',
      brief: `Execute every D176-assigned punch-list item through the three passes: perimeter (auth on all routes verified by tests, rate limiting live, validation strict), honest failure (five-row failure table implemented and break-tested), and surface (config clean, logging complete, README true in a fresh clone). Update \`docs/finale-punch-list.md\` marking each item DONE with its commit hash, or explicitly bounced to D177/D178 with a reason. The repo should end today runnable by a stranger and resistant to a hostile one — tomorrow's inspector assumes both.`,
      rubric: [
        'Perimeter test suite passes: every route rejects missing/expired/wrong-audience tokens',
        'Burst test yields 429 + Retry-After for the offender and no impact on a second user',
        'All five failure modes produce their exact table row when induced — verified by breaking each',
        'Refusal path returns honest "cannot answer reliably" with searched sources, never a guess',
        'Fresh-clone README run succeeds top-to-bottom; .env.example matches reality',
        'Punch list updated with commit hashes; nothing silently dropped',
      ],
    },
    mistakes: [
      'Assuming auth covers every route because it covers most. The forgotten /metrics, /docs, or debug endpoint is the classic finding; the parametrized perimeter test exists because assumption is not verification.',
      'Rate limiting by IP instead of user. Enterprise users share egress IPs (Day 170) — one office would rate-limit itself into an outage; key the bucket on authenticated user id.',
      'Failure messages that leak internals. Stack traces, provider names, and infrastructure hostnames in user-facing errors are reconnaissance gifts (Day 159); the stable code + honest message + rich LOG line separates audiences correctly.',
      'Making the refusal path so unpleasant users prefer the hallucination. "I can\'t answer reliably" must come with what WAS searched and what to try — a dead-end refusal trains users to distrust the product\'s honesty.',
      'Polishing new features during punch-list week. Every mid-flight idea that jumps the frozen list steals verification time from tomorrow\'s gates; backlog it — the discipline is the deliverable.',
      'Testing the happy path after hardening the sad ones. After adding validation and limits, re-run the golden set and a normal user session — hardening that breaks legitimate use is a regression, not an improvement.',
    ],
    quiz: [
      {
        q: 'Why key rate limits on authenticated user id rather than client IP for an enterprise deployment?',
        o: [
          'IPs are easy to spoof',
          'Enterprise users egress through shared IPs/proxies — IP limits would throttle a whole office as one user',
          'User-id buckets are cheaper to store',
          'HTTP has no reliable way to see client IPs',
        ],
        x: 1,
        w: 'Day 170\'s environments: corporate NAT and proxies collapse hundreds of users onto few IPs. Per-user buckets (post-auth) match the actual abuse unit and spare innocent colleagues.',
        revisit: 176,
      },
      {
        q: 'The groundedness check fails on an answer. The hardened behavior is:',
        o: [
          'Return the answer anyway — users prefer something over nothing',
          'Return "Something went wrong"',
          'Refuse honestly: state it can\'t answer reliably from current docs, show what was searched, log the case for the eval flywheel',
          'Silently retry with higher temperature until something passes',
        ],
        x: 2,
        w: 'A grounded-QA product\'s core promise is "cited or silent." The honest refusal with searched sources keeps trust, gives the user a next step, and feeds Day 143\'s log-to-eval-case loop.',
        revisit: 158,
      },
      {
        q: 'A user-facing error should contain ___ while the log line contains ___:',
        o: [
          'The stack trace; the user\'s query',
          'A stable code + what happened + what to do now; trace id, stage, internals for forensics',
          'Nothing — errors should be generic for security',
          'The provider\'s raw error; a summary',
        ],
        x: 1,
        w: 'Two audiences, two artifacts (Day 171\'s lesson applied to errors): users get honest, actionable, internals-free messages; operators get the rich structured line Day 172\'s playbooks query.',
        revisit: 172,
      },
    ],
    resources: [
      { label: 'FastAPI docs — security, middleware & exception handling', url: 'https://fastapi.tiangolo.com/', type: 'docs', time: '25 min' },
      { label: 'OWASP Top 10 for LLM Apps — recheck against your perimeter', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', type: 'docs', time: '20 min' },
      { label: 'pytest docs — parametrize for the perimeter suite', url: 'https://docs.pytest.org/en/stable/', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Punch-list review + spaced-rep warm-up', minutes: 10 },
      { activity: 'Read: three-pass plan for the day', minutes: 10 },
      { activity: 'Pass 1: perimeter (auth, limits, validation)', minutes: 25 },
      { activity: 'Pass 2: honest failure modes', minutes: 25 },
      { activity: 'Pass 3: config, logging, README truth', minutes: 25 },
      { activity: 'Re-run golden set + happy path; commit; quiz', minutes: 20 },
    ],
    completion: [
      'Perimeter suite green; burst test verified with a second unaffected user',
      'Five failure modes break-tested against the table',
      'Fresh-clone README run completed without manual fixes',
      'Golden set still green after hardening; punch list updated with hashes; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 45 designed this perimeter, Day 47 taught the token bucket, Day 158 designed the fallback chain, and Day 161 cut the service over — today verified all of it with hostile eyes and the frozen list from Day 175.',
      forward: 'Tomorrow (Day 177) an inspector re-breaks everything you fixed and re-runs the attack suites; Day 178 ships and documents what survives. The failure-mode table becomes part of the runbook your Demo Day audience can read.',
    },
    flashcards: [
      { f: 'The three hardening passes?', b: 'Perimeter (auth/limits/validation) → honest failure (typed handlers, refusal path) → surface (config, logging, README truth).' },
      { f: 'Perimeter verification rule?', b: 'A parametrized test calling EVERY route with no/expired/wrong-audience tokens — assumption is not verification.' },
      { f: 'Honest failure message anatomy?', b: 'User: stable code + what happened + what to do. Log: trace id + stage + internals. Never mix audiences.' },
      { f: 'Grounded-QA core promise?', b: '"Cited or silent": refuse with searched sources when groundedness fails; never ship the confident guess.' },
      { f: 'Punch-list week discipline?', b: 'Work the frozen list; new ideas → backlog. Scope integrity is what makes quality gates meaningful.' },
    ],
    deepDive: [
      { label: 'Redis-backed rate limiting', note: 'The in-process bucket breaks at 2+ replicas. Sketch the Redis INCR/EXPIRE version and note the race it still has — and why that\'s acceptable here.' },
    ],
  },
  {
    id: 'd177', day: 177, week: 26, phase: 9, kind: 'project',
    title: 'Capstone Quality Gates',
    analogy: "The inspector's visit",
    objectives: [
      'Re-run the full eval harness and produce a current, honest eval report with confidence intervals',
      'Re-execute the Day 133 and Day 144 attack suites against the hardened system and close or ticket every finding',
      'Verify tracing, load behavior, and the security checklist as pass/fail gates, not impressions',
      'Produce the final cost analysis from measured production numbers',
      'Publish a gate scorecard where every claim links to evidence',
    ],
    prereqs: [
      { day: 140, label: 'Capstone eval harness' },
      { day: 144, label: 'Red-teaming lab' },
      { day: 176, label: 'Capstone hardening' },
    ],
    eli5: `After punch-list week, the building inspector arrives. She does not ask the builder "is the wiring good?" — she flips every breaker herself. She doesn't admire the fire escape; she puts weight on it. Her clipboard has a fixed list, each item is pass or fail, and "we fixed that last week" counts for nothing without a re-test in front of her eyes. Builders who are annoyed by inspectors build worse buildings; builders who internalize the inspector build things that don't burn down.

Today you are your own inspector, and the rule of the day is: no claim without a fresh test. Yesterday you hardened the doors — today you try to kick them in again, using the same attack suites that broke the system back on Days 133 and 144. The eval harness runs again, from scratch, and whatever score comes out IS the score that goes in the report — error bars and all. The load check runs again. The cost numbers come from the meter, not the estimate. What you end the day with is rarer than a good system: a system whose goodness is DOCUMENTED, test by test, in a scorecard a stranger could audit.`,
    why: `"How do you know your system works?" is the question that separates senior candidates from juniors in every AI engineering interview — and the only convincing answer is machinery: golden sets, attack suites, gates, reports with error bars. Customers run this exact inspection on vendors (Day 159's security checklist is their clipboard); doing it to yourself first is how FDEs walk into security reviews relaxed. And tomorrow you ship v1.0 — the difference between "shipped" and "shipped, with evidence" is today.`,
    tech: `### Gates, not vibes

A quality gate is a pre-committed pass/fail criterion executed against the current system. Pre-committed is the operative word (Day 173's pilot logic applied to yourself): thresholds chosen AFTER seeing results are decoration. Today's six gates, with thresholds you set before running anything: (1) **Evals** — the full ≥ 40-case golden set through the Day 140 harness; gate on your regression thresholds (e.g. groundedness ≥ 0.90, citation accuracy ≥ 0.95, retrieval recall@5 ≥ 0.85) with bootstrap CIs (Day 139) in the report — a point estimate without an interval is not a result. (2) **Guardrails** — the combined Day 133 + Day 144 attack suites re-run verbatim, plus three NEW attacks you write today (attackers iterate; suites that never grow go stale, Day 145). Gate: zero successful injections/exfiltrations; refusal behavior verified on each. (3) **Tracing** — pick five production requests from different paths; every one must show a complete span tree with redaction intact (Day 142). (4) **Load** — the Day 161 concurrency sanity check re-run against the hardened build: p95 latency and error rate under N concurrent users within budget; the new rate limiter must shed load gracefully (429s, not 500s) beyond it. (5) **Security checklist** — Day 159's list walked item by item: secrets, TLS, headers, dependency audit, log redaction, plus yesterday's perimeter suite green. (6) **Cost** — cost per query and monthly projection computed from measured token counts in your traces (not estimates), fed back into the Day 173 model; gate: within 20% of the one-pager, or the one-pager gets corrected today.

### The scorecard

Output is \`docs/quality-gates.md\`: one row per gate — threshold, measured result, PASS/FAIL, evidence link (the harness report, the attack log, the trace IDs, the load output). Failures get one of two treatments before end of day: fixed and re-run, or converted to a ticket with severity and a Demo Day disclosure line. Hiding a FAIL converts a quality problem into an integrity problem — the scorecard with one honest open ticket is stronger than the all-green one nobody believes.`,
    viz: null,
    guided: [
      {
        title: 'Gate 1–2: evals and the attack suites',
        minutes: 25,
        body: `1. Write the thresholds table FIRST in \`docs/quality-gates.md\` — all six gates, numbers committed before any run.
2. Run the full eval harness on the current build. Generate the report: per-metric scores WITH bootstrap CIs (reuse your Day 139/140 code), plus the three worst-scoring cases examined by hand — worst cases are tomorrow's talking points, know them cold.
3. Compare against your Day 140 baseline: any metric down beyond noise (CI overlap test) is a regression introduced by hardening week — find it (suspect: the new validation caps truncating context, or the refusal path triggering on answerable questions).
4. Re-run the Day 133 + Day 144 attack suites end-to-end. Log each attack: blocked / refused / SUCCEEDED. Any success is a P0 for today.
5. Write and run three NEW attacks the old suites lack — candidates: injection via a document uploaded through the hardened ingest path, an exfiltration attempt against the new failure messages (do they leak internals under weird inputs?), a rate-limit-evasion probe across two user accounts.`,
      },
      {
        title: 'Gate 3–4: tracing and load, re-verified',
        minutes: 25,
        body: `1. Tracing: exercise five distinct paths (normal Q&A, refusal, cached answer, ingest, induced provider failure). For each, pull the trace and check: complete span tree, latency per stage, token counts present, PII/redaction rules intact on stored payloads. Record the five trace IDs in the scorecard as evidence.
2. Load: re-run the Day 161 concurrency check against the hardened build (same tool, same N, same corpus — a changed benchmark is no benchmark). Record p50/p95, error rate, and cost of the run.
3. Push PAST the rate limit deliberately: verify the system sheds with 429 + Retry-After and stays healthy for other users — the graceful-degradation gate the hardening added.
4. While the load run is hot, compute Gate 6 inputs: mean input/output tokens per request from the traces — the measured numbers the cost gate needs.`,
      },
    ],
    practice: [
      {
        title: 'Gate 5–6: security walk and measured cost',
        minutes: 25,
        body: `No steps — the checklists are yours. Walk Day 159's security checklist item by item against the current system, marking each with evidence or a ticket (git history secret scan, TLS config, dependency audit via pip-audit or equivalent, log-redaction spot check on real logs, yesterday's perimeter suite re-run). Then finalize the cost gate: measured cost/query from the load run's token counts × current prices, projected monthly at the one-pager's volume assumptions; if it misses the Day 173 one-pager by > 20%, correct the one-pager and note why the estimate was off — the miss analysis is itself Demo Day material.

Constraints: every checklist item gets evidence or a ticket, no bare checkmarks; timebox 25 minutes — items that need real work become tickets, not heroics.

Hint: the classic finding at this stage is a dependency with a known CVE and a redaction rule that misses the NEW failure-message logs added yesterday.`,
      },
    ],
    project: {
      title: 'The gate scorecard',
      brief: `Complete \`docs/quality-gates.md\`: six gates, each with pre-committed threshold, measured result, PASS/FAIL, and an evidence link (eval report file, attack log, trace IDs, load output, checklist, cost calc). Attach the regenerated eval report (with CIs) and the attack log as committed artifacts. Every FAIL is either fixed-and-re-run today or ticketed with severity and a one-line Demo Day disclosure. Finish by updating the punch list: D177 items marked DONE with hashes. Tomorrow ships whatever this scorecard says is true — so make it true or make it honest.`,
      rubric: [
        'Thresholds committed in git BEFORE the first run (check the commit order)',
        'Eval report regenerated with CIs; regressions vs Day 140 baseline detected or ruled out via CI overlap',
        'Old attack suites re-run with zero successes, or successes fixed and re-run today',
        'Three new attacks written, run, and logged',
        'Five trace IDs recorded with complete, redacted span trees; load re-run within budget and sheds gracefully past the limit',
        'Cost gate uses measured tokens; one-pager corrected if off by > 20%; every FAIL fixed or ticketed with a disclosure line',
      ],
    },
    mistakes: [
      'Setting thresholds after seeing results. That is decoration, not gating — the commit history should prove the thresholds came first, exactly like Day 134\'s exam-before-the-student principle.',
      'Re-running only the attacks that failed last time. Regressions hide in the ones that used to pass; suites run whole or they are anecdotes. And a suite that never gains new attacks decays with the threat landscape.',
      'Reporting point estimates. A groundedness of 0.91 vs a gate of 0.90 with ±0.04 of bootstrap noise is not a pass — it is "indistinguishable from the gate"; say so and decide consciously (Day 139).',
      'Benchmarking load against a different corpus, N, or tool than Day 161. Changing the benchmark mid-program destroys the comparison; the whole value of a re-check is held-constant conditions.',
      'Estimated cost in the "measured" gate. The traces contain real token counts; using the old estimates defeats the gate\'s purpose — and the estimate-vs-measured miss is often the most interesting finding of the day.',
      'Hiding the one red gate. An all-green scorecard reads as unaudited; a scorecard with one honest ticket and a disclosure line reads as engineering. Integrity is the demo.',
    ],
    quiz: [
      {
        q: 'Why must gate thresholds be committed before running the tests?',
        o: [
          'To save time during the runs',
          'Thresholds chosen after seeing results will drift to whatever the results are — the gate stops measuring and starts rationalizing',
          'Because git requires it',
          'So the CI system can parse them',
        ],
        x: 1,
        w: 'Post-hoc thresholds are the eval version of p-hacking (Day 61). Pre-commitment is what makes a gate a test instead of a story — same principle as writing the exam before the student exists.',
        revisit: 134,
      },
      {
        q: 'Your eval score is 0.91 against a 0.90 gate, with a bootstrap CI of ±0.04. The honest reading is:',
        o: [
          'PASS — 0.91 exceeds 0.90',
          'FAIL — the CI includes values below the gate',
          'The result is statistically indistinguishable from the gate; report the interval and make a conscious call (e.g. more eval cases, or pass-with-note)',
          'Re-run until the score clears the interval',
        ],
        x: 2,
        w: 'Day 139\'s lesson: point estimates near a threshold are noise theater. State the interval, then decide deliberately — often by growing the golden set until the interval tightens.',
        revisit: 139,
      },
      {
        q: 'The re-run load test must use the same tool, N, and corpus as Day 161 because:',
        o: [
          'Newer tools are less reliable',
          'A comparison is only valid under held-constant conditions — change the benchmark and you measure the benchmark change, not the system change',
          'The corpus cannot legally change',
          'Rate limiters only work on known corpora',
        ],
        x: 1,
        w: 'The question today is "did hardening change performance?" — answerable only if everything else is fixed. Same discipline as Day 81\'s honest experiment comparisons.',
        revisit: 161,
      },
    ],
    resources: [
      { label: 'promptfoo docs — automating the attack + eval suites', url: 'https://www.promptfoo.dev/docs/intro/', type: 'docs', time: '20 min' },
      { label: 'Ragas docs — the RAG metrics in your harness', url: 'https://docs.ragas.io/en/stable/', type: 'docs', time: '15 min' },
      { label: 'OWASP Top 10 for LLM Apps — checklist for the new attacks', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', type: 'docs', time: '15 min' },
      { label: 'OpenTelemetry docs — span-tree verification', url: 'https://opentelemetry.io/docs/', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Punch-list review + commit thresholds table', minutes: 10 },
      { activity: 'Read: the six gates and the rules', minutes: 10 },
      { activity: 'Gates 1–2: evals + attack suites', minutes: 25 },
      { activity: 'Gates 3–4: tracing + load re-verify', minutes: 25 },
      { activity: 'Gates 5–6: security walk + measured cost', minutes: 25 },
      { activity: 'Scorecard finalize, fixes/tickets, quiz', minutes: 20 },
    ],
    completion: [
      'Thresholds table committed before first run (verifiable in git history)',
      'All six gates executed with evidence links; eval report has CIs',
      'Three new attacks logged; zero unresolved attack successes without tickets',
      'Cost corrected or confirmed against measured tokens; quiz ≥ 2/3',
    ],
    connections: {
      back: 'Day 140 built the harness, Days 133/144 built the attack suites, Day 139 supplied the error bars, Day 161 set the load baseline, Day 159 wrote the security clipboard — today ran them all against the hardened system as one inspection.',
      forward: 'Tomorrow (Day 178) the scorecard ships inside v1.0 as the evidence section of your docs. On Day 180, the numbers on this scorecard are the numbers in your presentation — and the open tickets are your prepared answers for hard questions.',
    },
    flashcards: [
      { f: 'What makes a quality gate a gate?', b: 'A pre-committed pass/fail threshold executed against the current system — thresholds first, runs second.' },
      { f: 'Six capstone gates?', b: 'Evals (with CIs) · guardrails/attack suites · tracing · load · security checklist · measured cost.' },
      { f: 'Score 0.91, gate 0.90, CI ±0.04?', b: 'Indistinguishable from the gate — report the interval and decide consciously; near-threshold points are noise theater.' },
      { f: 'Why add new attacks each re-run?', b: 'Attackers iterate; a static suite decays. Old suite whole + a few new attacks every inspection.' },
      { f: 'The one red gate rule?', b: 'Fix-and-re-run or ticket-with-disclosure. Hiding a FAIL turns a quality problem into an integrity problem.' },
    ],
    deepDive: [
      { label: 'Braintrust evals guide — CI-integrated eval reports', url: 'https://www.braintrust.dev/docs/guides/evals', note: 'Compare their report structure with yours; steal the good ideas for the shipped report.' },
    ],
  },
  {
    id: 'd178', day: 178, week: 26, phase: 9, kind: 'project',
    title: 'Capstone Ship & Document',
    analogy: 'Cutting the ribbon',
    objectives: [
      'Execute the final production deploy through the pipeline and verify it with smoke tests and gates',
      'Finalize the four shipped documents: README, architecture doc, runbook, and eval report',
      'Rehearse the demo end-to-end twice against the live production system',
      'Tag v1.0 and make the repo read as a portfolio piece to a cold reviewer',
    ],
    prereqs: [
      { day: 165, label: 'Proposals & architecture docs' },
      { day: 167, label: 'Demo craft' },
      { day: 177, label: 'Quality gates passed' },
    ],
    eli5: `A ribbon-cutting is not the day the building gets built — everything was finished and inspected before the mayor shows up with scissors. The ceremony is for the record: the plaque goes on the wall, the keys and the manuals are handed over, and from this day forward the building is judged as a finished thing, not a construction site. Buildings that skip the handover — no manuals, no labeled breaker box — become buildings nobody can maintain, however well they were built.

Today you cut the ribbon on 60 days of capstone work. The deploy itself should be boring — your Day 152 pipeline has done it dozens of times, and boring deploys are the achievement. The real work is the handover: four documents that let a stranger run, judge, and extend the system without you in the room. The README is the front door; the architecture doc is the floor plan with the WHY behind each wall; the runbook is the labeled breaker box; the eval report is the inspection certificate. Then the plaque: \`git tag v1.0\`. From tonight, this repo is not your homework — it is your evidence.`,
    why: `For a career changer, the capstone repo IS the resume's load-bearing wall: recruiters spend 90 seconds in it, senior engineers 10 minutes, and both decide from the docs, not the code. A repo with an honest eval report and a real runbook is vanishingly rare in candidate portfolios and signals exactly what AI teams struggle to hire: someone who ships AND operates. FDE interviews go further — "walk me through your architecture doc" is a standard round, and today you write the doc you will be walking people through for the next year.`,
    tech: `### The ship

The deploy is the pipeline you built on Days 152–154: push to main → tests → eval gate (green from yesterday) → build → deploy → smoke tests against the production URL. Two rules for ship day: nothing manual (a fix that bypasses the pipeline today invalidates the pipeline\'s whole story), and the rollback path re-verified BEFORE the final push (Day 154\'s rehearsal, once more, because the day you skip it is the day you need it). After deploy: run the smoke suite, spot-check the dashboard (Day 146), confirm alerts are armed (Day 157), and leave the system serving.

### The four documents

**README** — the 90-second version: what it is, one screenshot/demo GIF, the architecture diagram in miniature, quickstart that works (verified in yesterday\'s fresh clone), links to the other three docs, and the honest limitations section — which reads as strength, not weakness, to senior reviewers. **Architecture doc** — Day 165\'s C4-lite structure: context (users, IdP, corpus sources, LLM provider), containers (API, ingest worker, vector DB, cache, observability), one component-level zoom on the retrieval pipeline; plus the decisions log: 5–8 ADR-style entries ("chose hybrid retrieval + reranking because…; considered X; trade-off Y" — Days 116/117 give you the material). The decisions log is what interviewers actually read. **Runbook** — Day 172\'s five playbooks, the diagnostic bundle pointer, alert-response table, deploy/rollback procedure, and the incident comms templates. **Eval report** — yesterday\'s regenerated report, framed for readers: golden-set design, metrics with CIs, judge calibration note (Day 135), attack-suite results, known gaps and open tickets. Together they answer the four reviewer questions: what is it, how is it built, how do you run it, how do you know it works.

### The tag and the rehearsal

\`git tag -a v1.0\` with a release-notes message; the repo\'s issue tracker carries the open tickets from yesterday — visible, triaged, honest. Then rehearse the Day 167 demo script twice against PRODUCTION (not localhost): once clean, once with your planned failure recovery (kill the network mid-demo, recover with the cached-answer path, narrate calmly). Time both runs. The second rehearsal is the one that makes Demo Day boring — and boring, on stage, is victory.`,
    viz: null,
    guided: [
      {
        title: 'Ship it through the pipeline',
        minutes: 25,
        body: `1. Pre-flight: confirm yesterday's scorecard is committed and green (or honestly ticketed); re-verify the rollback path on staging — deploy previous tag, confirm health, return.
2. Final pass on main: version bump, changelog entry summarizing the finale week, push.
3. Watch the pipeline: tests → eval gate → build → deploy. If ANY stage fails, fix through the pipeline — no console cowboy moves on ship day.
4. Post-deploy verification: smoke suite against the production URL; one real question answered with citations; one refusal path exercised; dashboard shows the traffic; alerts armed.
5. \`git tag -a v1.0 -m "Docs-QA assistant v1.0 — 180-day capstone"\` and push the tag. Screenshot the green pipeline for the presentation.`,
      },
      {
        title: 'The documentation pass',
        minutes: 30,
        body: `Work the four documents in reviewer order. Timebox: README 8 min, architecture 10, runbook 6 (it exists — finalize), eval report 6 (regenerated yesterday — frame it).

1. README: rewrite the top third for a cold reader — what/why in three sentences, demo GIF or screenshot, mini architecture diagram, verified quickstart, doc links, limitations section (3 honest bullets).
2. Architecture doc: C4 context + containers + one component zoom, then the decisions log — minimum five ADR-style entries with the road-not-taken named (chunking strategy, hybrid + rerank, model choice, deployment model, eval/gate design).
3. Runbook: fold in Day 176's failure-mode table; confirm the five playbooks reference real commands against the PRODUCTION deployment; add the "first 15 minutes" page as the cover.
4. Eval report: add a one-page executive summary up front (Day 171's register): what was measured, headline numbers with intervals, known gaps, tickets. A hiring manager reads only this page — make it sufficient.
5. Cross-link all four from the README and re-verify every link and command.`,
      },
    ],
    practice: [
      {
        title: 'Dress rehearsal, twice',
        minutes: 20,
        body: `Run the Day 167 demo script against production, out loud, standing up, timed. Run 1: clean path — problem, magic moment (a real question answered with citations), how it works (architecture doc on screen), the numbers (scorecard), next steps. Run 2: same script, but induce your planned failure mid-demo (kill network or point at a dead route) and execute the recovery — cached answer or honest refusal — while narrating without apology.

Constraints: 10-minute cap per run, hard; no restarting a run for stumbles — recovering from stumbles IS the rehearsal; record (audio is enough) and note one concrete fix after each run.

Hints: the most common rehearsal finding is a demo question whose answer changed since the corpus was updated — pin your demo questions and verify their answers TODAY, then never touch the corpus before Demo Day.`,
      },
    ],
    project: {
      title: 'v1.0: the portfolio-grade release',
      brief: `Finish the day with: production serving the v1.0 tag, verified by smoke tests and one live cited answer; all four documents finalized and cross-linked; open tickets visible and triaged in the tracker; demo rehearsed twice with timings and one fix noted per run; and a repo whose front page survives the 90-second cold read. Final act: send the repo link to one person who has never seen it (friend, community peer) and ask exactly two questions: "what is this?" and "could you run it?" Their answers tonight are your last cheap feedback before Demo Day.`,
      rubric: [
        'v1.0 tag deployed through the pipeline — zero manual deploy steps; rollback re-verified first',
        'Smoke suite green against production; live cited answer and refusal path both verified post-deploy',
        'README survives a cold read: what/why, visual, verified quickstart, limitations, doc links',
        'Architecture doc contains ≥ 5 decision-log entries naming the road not taken',
        'Eval report opens with a one-page executive summary with intervals and known gaps',
        'Two timed rehearsals done, including the failure-recovery run; demo questions pinned and verified',
      ],
    },
    mistakes: [
      'Shipping around the pipeline "just today." The pipeline IS the deliverable\'s credibility; one manual hotfix on ship day and your CI/CD story becomes fiction in the very repo meant to prove it.',
      'Writing the architecture doc as a WHAT without a WHY. Component lists are read in 30 seconds and forgotten; the decisions log with named alternatives is what makes reviewers say "this person thinks like a senior."',
      'Hiding limitations to look finished. Senior reviewers hunt for the limitations section first — its absence reads as either dishonesty or blindness, both worse than any listed limitation.',
      'A README quickstart that drifted. It worked in yesterday\'s fresh clone — but you changed config today; re-verify AFTER the final deploy, not before.',
      'Rehearsing only the clean path. Day 167\'s law: the demo that has never failed in rehearsal will fail on stage; the recovery run is the one that buys you calm.',
      'Updating the corpus after pinning demo questions. The answer that changed overnight is the classic Demo Day face-plant; freeze the corpus and the questions together.',
    ],
    quiz: [
      {
        q: 'On ship day the pipeline\'s eval gate fails on a flaky judge case. The right move is:',
        o: [
          'Deploy manually — the system itself is fine',
          'Delete the flaky case and re-push',
          'Fix through the pipeline: re-run per your Day 141 flake policy, or fix/quarantine the case with a commit and let the gate pass honestly',
          'Lower the gate threshold to pass',
        ],
        x: 2,
        w: 'The pipeline\'s integrity is the product\'s credibility. Day 141 defined the flaky-eval policy for exactly this moment — apply it in-band; bypassing or gaming the gate on ship day poisons the whole story.',
        revisit: 141,
      },
      {
        q: 'Which part of the architecture doc do experienced interviewers weight most heavily?',
        o: [
          'The completeness of the component inventory',
          'The decisions log: alternatives considered and trade-offs accepted, with reasons',
          'The diagram styling and consistency',
          'The technology version numbers',
        ],
        x: 1,
        w: 'Anyone can list boxes; naming the road not taken ("considered pure vector search; chose hybrid because our golden set showed lexical failures on policy IDs") demonstrates judgment — the thing interviews actually probe.',
        revisit: 165,
      },
      {
        q: 'Why rehearse the demo WITH an induced failure against production?',
        o: [
          'To test whether alerts fire correctly',
          'Because the recovery move must be muscle memory — a failure first encountered on stage produces panic, while a rehearsed one produces a calm story about resilience',
          'To measure worst-case latency',
          'To generate log data for the eval flywheel',
        ],
        x: 1,
        w: 'Day 167\'s discipline: graceful live-failure handling impresses audiences MORE than a clean run — but only if the recovery is rehearsed. The fallback path you built is a feature; the rehearsal makes it demoable.',
        revisit: 167,
      },
    ],
    resources: [
      { label: 'Google Technical Writing — final docs pass', url: 'https://developers.google.com/tech-writing', type: 'course', time: '25 min' },
      { label: 'arc42 — architecture doc completeness check', url: 'https://arc42.org/overview', type: 'docs', time: '15 min' },
      { label: 'C4 Model — the three diagram levels you ship', url: 'https://c4model.com/', type: 'docs', time: '15 min' },
      { label: 'GitHub Docs — releases and tags', url: 'https://docs.github.com/en/get-started', type: 'docs', time: '10 min' },
    ],
    schedule: [
      { activity: 'Pre-flight: scorecard check + rollback re-verify', minutes: 10 },
      { activity: 'Guided: ship through the pipeline + tag v1.0', minutes: 25 },
      { activity: 'Guided: the four-document pass', minutes: 30 },
      { activity: 'Practice: two timed dress rehearsals', minutes: 20 },
      { activity: 'Cold-reader send + fixes from their answers', minutes: 15 },
      { activity: 'Punch-list close-out + quiz', minutes: 20 },
    ],
    completion: [
      'v1.0 live in production via the pipeline; smoke + live cited answer verified',
      'Four documents finalized, cross-linked, and command-verified',
      'Both rehearsals done and timed, failure-recovery included; fixes noted',
      'Cold reader contacted; punch list closed or ticketed; quiz ≥ 2/3',
    ],
    connections: {
      back: 'This is Day 119\'s v0 arriving at v1.0 through every gate the program built: Day 152\'s pipeline shipped it, Day 165\'s doc structures carried it, Day 167\'s rehearsal discipline staged it, and yesterday\'s scorecard certified it.',
      forward: 'Day 179 mines this repo for interview stories — every decision-log entry is an answer waiting for a question. Day 180 presents it, and the job-search checklist puts this URL at the top of your resume.',
    },
    flashcards: [
      { f: 'The four shipped documents and their questions?', b: 'README (what is it) · architecture doc (how is it built + WHY) · runbook (how do you run it) · eval report (how do you know it works).' },
      { f: 'What makes an architecture doc senior-grade?', b: 'The decisions log: ADR-style entries naming alternatives considered and trade-offs accepted — the road not taken.' },
      { f: 'Ship-day rule?', b: 'Nothing manual: pipeline or nothing, rollback re-verified BEFORE the final push. Boring deploys are the achievement.' },
      { f: 'Why a limitations section in the README?', b: 'Senior reviewers look for it first — honest limits signal operating experience; their absence signals blindness or spin.' },
      { f: 'Demo-question freeze?', b: 'Pin demo questions AND corpus together after verification; an overnight corpus change is the classic on-stage face-plant.' },
    ],
    deepDive: [
      { label: 'Write the release announcement', note: 'Draft the 150-word internal launch note (Day 171\'s exec register): what shipped, the headline numbers, known limits, where to ask questions. Post it to the repo\'s Discussions as the v1.0 announcement.' },
    ],
  },
  {
    id: 'd179', day: 179, week: 26, phase: 9, kind: 'lesson',
    title: 'Interview Gym',
    analogy: 'Training camp, final week',
    objectives: [
      'Recognize the DSA pattern for 15 classic prompts in under a minute each and sketch the solution shape',
      'Answer 20 ML/LLM rapid-fire questions in two sentences each without notes',
      'Complete one full AI-system-design mock under the Day 160 rubric',
      'Bank six STAR stories mined from your 180 days, each with a quantified result',
      'Close the interview error log: every remaining DRILL item exercised today',
    ],
    prereqs: [
      { day: 35, label: 'Interview drill I (DSA)' },
      { day: 84, label: 'Interview drill II (ML viva)' },
      { day: 160, label: 'AI system design' },
      { day: 175, label: 'The DRILL list' },
    ],
    eli5: `The last week before a title fight, boxers stop learning new punches. Training camp becomes rehearsal: pad work to keep combinations sharp, film study of the opponent's favorite openings, and sparring rounds under fight rules — with the corner shouting the one or two habits that still leak. Nobody gets stronger in the final week; they get READY, which is different. The fighter who tries to learn a new hook on Thursday shows up confused on Saturday.

Today is fight camp for interviews. Nothing new enters your head — everything already in it gets retrieval-tested at speed, in the four rings you'll actually fight in: the DSA round (pattern recognition, not memorized solutions — see "sorted array, find pair" and FEEL two pointers), the rapid-fire knowledge round (two crisp sentences beat two rambling minutes), the system-design round (the Day 160 method under a clock), and the human round (six true stories from your own 180 days, shaped so a stranger can follow them in 90 seconds). Your error log — kept since Day 28 — is the film study: it knows your leaky habits better than any coach.`,
    why: `The 2026 AI engineer loop is remarkably standardized: a DSA screen, an ML/LLM knowledge round, an AI system design round, and behavioral/FDE-case interviews — you will meet all four within any two-week interview sprint. Preparation is disproportionately about retrieval speed: candidates who KNOW the material but retrieve slowly read as juniors. You have 178 days of material and artifacts; today converts them from "things I did" into "answers I can produce in 90 seconds," which is the only form interviews accept.`,
    tech: `### Ring 1 — DSA pattern recognition

The screen tests pattern-matching under time pressure, not novel invention. The recognition reflex: read the prompt → name the pattern out loud → state the complexity target → THEN code. Fifteen prompts below span the Days 22–34 toolkit; the drill is naming pattern + approach + complexity in ≤ 60 seconds each, coding only two of them fully. Speak while you think — interviews grade the narration as much as the code (the Day 24 think-aloud protocol).

### Ring 2 — knowledge rapid-fire

Twenty questions, two sentences each — the compression IS the skill. A two-sentence answer proves ownership; a two-minute answer suggests you're deriving it live. Format per answer: the direct answer, then the one caveat or example that shows depth.

### Ring 3 — system design

One full mock under Day 160's method: requirements → constraints → capacity envelope → architecture → data flow → quality strategy (evals + guardrails — the section that separates AI system design from generic system design) → trade-offs. Time-boxed 30 minutes, self-graded against the rubric in the practice section. The most common failure is skipping requirements to draw boxes — the rubric punishes it hardest.

### Ring 4 — behavioral, mined from your own 180 days

STAR with the program's artifacts as evidence: Situation (2 sentences, real names swapped), Task (1 — YOUR responsibility), Action (3–5, first person singular — "I", never "we", even for solo work), Result (quantified + one lesson). Your six stories come from things that actually happened: the capstone's incidents, the simulations' objections, the red-team findings, the eval regressions. Stories with commit hashes behind them survive follow-up questions; invented ones don't.`,
    viz: null,
    guided: [
      {
        title: 'Ring 1 — the 15-prompt DSA recognition drill',
        minutes: 25,
        body: `Timer: 60 seconds per prompt. Say aloud: pattern, approach in one sentence, time/space complexity. Answers at the bottom — check after each five. Then pick TWO you hesitated on and code them fully (15 of the 25 minutes).

1. Given an array and a target, return indices of two numbers summing to target.
2. Longest substring without repeating characters.
3. Given a string of brackets, determine if it is valid.
4. Reverse a singly linked list.
5. Determine if a linked list contains a cycle.
6. Merge two sorted linked lists into one sorted list.
7. Return the level-order traversal of a binary tree.
8. Validate that a binary tree is a BST.
9. Return the k most frequent elements in an array.
10. Count islands of 1s in a 2D grid.
11. Given course prerequisites, determine if all courses can be finished.
12. Search a target in a rotated sorted array.
13. Find the first version that fails, given a boolean API over versions.
14. House robber: max sum of non-adjacent elements.
15. Fewest coins to make an amount from given denominations.

~~~text
ANSWERS: 1 hash map complement, O(n)/O(n) (D23). 2 variable sliding window +
set, O(n) (D24). 3 stack of openers, O(n) (D25). 4 pointer reversal, O(n)/O(1)
(D26). 5 fast/slow pointers, O(n)/O(1) (D26). 6 two pointers/dummy head, O(n+m)
(D24/26). 7 BFS with queue, O(n) (D29/31). 8 DFS with min/max bounds, O(n)
(D29). 9 hashmap counts + heap of size k, O(n log k) (D30). 10 DFS/BFS flood
fill, O(rows*cols) (D31). 11 topological sort / cycle detection, O(V+E) (D31).
12 modified binary search on the sorted half, O(log n) (D33). 13 binary search
for first true, O(log n) (D33). 14 1D DP: rob[i]=max(rob[i-1], rob[i-2]+v),
O(n)/O(1) (D34). 15 DP on amount, O(amount*coins) (D34).
~~~

Log any prompt where the pattern took > 60 s into the error log with its revisit day.`,
      },
      {
        title: 'Ring 2 — 20 ML/LLM rapid-fire',
        minutes: 20,
        body: `Cover the answers. One minute per question, spoken aloud in ≤ 2 sentences. Score ✓ (matched the gist) or ✗ (log it).

1. Precision vs recall — and when do you prioritize each?
2. Your model is overfitting. Name the signs and two remedies.
3. Why is cross-entropy the standard classification loss?
4. Explain bias vs variance in one breath.
5. L1 vs L2 regularization — practical difference?
6. Why do tree ensembles usually win on tabular data?
7. What is data leakage and its sneakiest form?
8. What is an embedding?
9. Attention in one sentence: what do Q, K, V do?
10. Why do transformers need positional encoding?
11. Why BPE tokenization instead of words or characters?
12. What do temperature and top-p actually control?
13. Pretraining vs SFT vs RLHF — one line each.
14. Why is hallucination structural rather than a bug?
15. When RAG vs fine-tuning?
16. Chunk size in RAG: what breaks when too small? Too large?
17. Why hybrid (dense + lexical) search?
18. Name two biases of LLM-as-judge and one mitigation.
19. TTFT vs tokens/sec — and what does the KV cache buy?
20. Prompt injection vs jailbreak — and one architectural defense.

~~~text
ANSWERS: 1 P=of flagged, how many right; R=of actual, how many found. Optimize R
when misses are costly (fraud), P when false alarms are (spam) (D75). 2 train
metric >> val metric; remedies: more data, regularization, simpler model, early
stopping (D76). 3 It is the log-loss of the true class under your predicted
distribution - minimizing it = maximizing likelihood; gradient stays informative
even when confident and wrong (D62/72). 4 Bias = too simple, misses pattern;
variance = too flexible, memorizes noise; total error trades them (D76). 5 L1
zeroes weights (feature selection); L2 shrinks smoothly (D76). 6 Tabular has
heterogeneous features & sharp interactions; trees split natively, no scaling
needed; bagging/boosting cut variance/bias (D74). 7 Test info reaching training:
target leakage, preprocessing fit on full data, temporal leakage - the sneakiest
(D69/76). 8 A learned dense vector where geometric closeness = semantic
similarity (D92). 9 Each token's Query scores every Key; the weights mix Values
- a soft, learned lookup (D94). 10 Attention is permutation-invariant; position
must be injected or word order vanishes (D95). 11 Subwords balance vocab size
vs sequence length; handles rare words; but causes arithmetic/spelling quirks
(D96). 12 Temperature rescales logits (flatter/sharper distribution); top-p
truncates to the smallest set with cumulative prob p (D102). 13 Pretrain: next
token on web scale; SFT: imitate curated demonstrations; RLHF/DPO: optimize
toward human preference (D100). 14 The objective is plausible continuation, not
truth - fluent fabrication is the training goal working as designed; grounding
must come from outside (D101/104). 15 RAG for knowledge (fresh, cited,
per-tenant); FT for form/style/format; often both (D113/127). 16 Too small:
context fragments, answers lack support; too large: retrieval blurs, irrelevant
text dilutes and costs tokens (D114). 17 Dense misses exact identifiers/rare
terms; BM25 misses paraphrase; fuse (RRF) to cover both failure modes (D116).
18 Position bias, verbosity bias, self-preference; mitigate: swap order, pin
length, calibrate vs human labels (D135). 19 TTFT = time to first token (UX);
tokens/sec = generation rate; KV cache stores past attention keys/values so
each new token avoids recomputing the prefix (D155). 20 Injection: hostile
instructions in DATA (docs, web); jailbreak: user attacks the model's own
policy. Defense: privilege separation - tools/permissions assume the model may
be compromised (D132).
~~~`,
      },
    ],
    practice: [
      {
        title: 'Ring 3 — the full system-design mock',
        minutes: 25,
        body: `30-minute clock, whiteboard or paper, spoken aloud. Prompt:

"Design an AI assistant for a 5,000-agent contact center: agents handle customer calls and chats; the assistant should suggest grounded answers from the company knowledge base in real time, draft follow-up emails, and flag compliance risks. The customer is a regulated telecom. They want agent handle-time down 20%."

Follow the Day 160 method in order: requirements (functional + non-functional — what does "real time" mean in ms here?), constraints & scale envelope (5,000 concurrent agents × calls/hour → QPS; token cost at that volume), architecture (ingestion, retrieval, suggestion service, streaming path to the agent desktop), quality strategy (golden set from historical transcripts, groundedness gates, judge calibration, compliance-flag precision/recall targets — false accusations of agents are the political risk), rollout (shadow mode → pilot team → gates), and the trade-off closing (latency vs quality vs cost — pick and defend).

Self-grade 1–4 per rubric line, evidence required: [1] Requirements & constraints made explicit and quantified before any boxes. [2] Architecture coherent end-to-end with the streaming path and failure modes named. [3] Quality strategy has a golden set, gates, AND the compliance-precision discussion. [4] Scale/cost envelope computed with real arithmetic. [5] Trade-offs closed with a recommendation, not a menu. Score ≤ 2 anywhere → that section is tonight's revision.`,
      },
    ],
    project: {
      title: 'The interview kit: six STAR stories + error log close-out',
      brief: `Write \`portfolio/interview-prep/star-stories.md\`: six stories, each ≤ 200 words in STAR form with a quantified result and the artifact that proves it (commit, doc, report). Required coverage: (1) ambiguity → shipped scope (Day 164/168 or 174 sim); (2) pushing back on a stakeholder with options (Day 171/174 — the change request); (3) a production incident you debugged methodically (Day 172's scenarios or a real capstone incident); (4) a failure and what it changed in your process (mine the error log — e.g. the Day 133 red-team findings); (5) learning something hard fast (backprop week, or the eval-statistics arc); (6) building trust with a skeptic (the CISO objection). Then close the error log: every DRILL item from Day 175 either exercised today (mark done + date) or explicitly moved to your post-program plan. Rehearse two stories aloud, timed ≤ 90 seconds each.`,
      rubric: [
        'Six stories in strict STAR form, all ≤ 200 words, all first-person singular in the Action',
        'Every Result contains a number (metric, time, count) and a one-line lesson',
        'Each story cites its artifact (commit hash, doc path, or report) — no unverifiable claims',
        'System-design mock self-graded with evidence sentences; weakest section revised tonight',
        'Error log: zero unexercised DRILL items remaining without an explicit disposition',
        'Two stories rehearsed aloud under 90 seconds each',
      ],
    },
    mistakes: [
      'Learning new material today. Fight-camp rule: the marginal value of one new topic is near zero; the marginal value of faster retrieval on 178 days of existing material is enormous.',
      'Coding before naming the pattern. Interviewers grade the recognition and narration; silent typing reads as memorization even when it isn\'t. Pattern → complexity target → then code, aloud.',
      'Two-minute answers to rapid-fire questions. Length signals uncertainty; the two-sentence form (answer + one depth-proving caveat) signals ownership. Practice the compression, not the content.',
      'Drawing boxes before requirements in system design. It is the single most-punished failure in the round — the Day 160 method exists because "requirements first" collapses under adrenaline unless drilled.',
      'STAR stories with "we" throughout. The interviewer is hiring YOU; "we shipped" hides your contribution. First-person singular in the Action section, honestly scoped.',
      'Polishing your six stories into fiction. Every story should survive "show me" — that\'s why each cites a commit or document. Verifiable modest beats impressive unverifiable, every time.',
    ],
    quiz: [
      {
        q: '"Find the longest substring with at most k distinct characters." The pattern reflex should be:',
        o: [
          'Dynamic programming over substrings',
          'Variable-size sliding window with a character-count map',
          'Sort, then two pointers',
          'DFS over all substrings with pruning',
        ],
        x: 1,
        w: '"Longest substring/subarray satisfying a shrinkable constraint" is the variable-window signature: expand right, shrink left while the constraint breaks, track the max — O(n) with a count map.',
        revisit: 24,
      },
      {
        q: 'In the rapid-fire round, the strongest answer shape is:',
        o: [
          'A thorough derivation showing full understanding',
          'The direct answer, then one caveat or example proving depth — two sentences',
          'A clarifying question before every answer',
          'A definition quoted precisely from a textbook',
        ],
        x: 1,
        w: 'Compression signals ownership; the caveat ("cross-entropy — and its gradient stays useful when the model is confidently wrong") is what separates recall from understanding. Save derivations for when they ask.',
        revisit: 179,
      },
      {
        q: 'What must an AI-system-design answer contain that a classic one usually does not?',
        o: [
          'A load balancer and cache layer',
          'A quality strategy: golden-set evals, groundedness/guardrail gates, and rollout stages gated on measured quality',
          'A NoSQL database choice',
          'Microservices boundaries',
        ],
        x: 1,
        w: 'The AI round\'s differentiator (Day 160): non-deterministic components demand an evaluation and rollout plan as part of the ARCHITECTURE. Capacity math and caching are shared with classic design; the eval story is not.',
        revisit: 160,
      },
    ],
    resources: [
      { label: 'NeetCode Roadmap — final pattern pass', url: 'https://neetcode.io/roadmap', type: 'course', time: '30 min' },
      { label: 'Tech Interview Handbook — behavioral & loop logistics', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '20 min' },
      { label: 'ML Interviews Book (Chip Huyen) — rapid-fire coverage check', url: 'https://huyenchip.com/ml-interviews-book/', type: 'book', time: '25 min' },
      { label: 'LLM Interview Questions repo — extra rapid-fire rounds', url: 'https://github.com/llmgenai/LLMInterviewQuestions', type: 'repo', time: '20 min' },
      { label: 'FDE Interview Guide (Exponent) — the case round format', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
    ],
    schedule: [
      { activity: 'Warm-up: DRILL list + due flashcards', minutes: 10 },
      { activity: 'Ring 1: 15-prompt DSA recognition drill', minutes: 25 },
      { activity: 'Ring 2: 20-question rapid-fire', minutes: 20 },
      { activity: 'Ring 3: system-design mock + self-grade', minutes: 30 },
      { activity: 'Ring 4: STAR stories + error-log close-out', minutes: 25 },
      { activity: 'Quiz + schedule tonight\'s revisions', minutes: 10 },
    ],
    completion: [
      '15/15 prompts attempted; hesitations logged; two coded fully',
      'Rapid-fire scored; every ✗ has a revisit day scheduled',
      'System-design mock completed in 30 min and self-graded with evidence',
      'Six STAR stories committed with artifacts; two rehearsed ≤ 90 s; error log closed',
    ],
    connections: {
      back: 'This day cashes out Day 28\'s error log, Day 35 and 84\'s drills, Day 160\'s design method, and the simulations\' stories — nothing today was new, which was exactly the point.',
      forward: 'Tomorrow is Demo Day: the mastery final samples these same wells program-wide, and the job-search checklist puts the STAR stories and the capstone link into motion. The gym never fully closes — the post-program plan keeps a weekly maintenance round.',
    },
    flashcards: [
      { f: 'DSA interview reflex order?', b: 'Name the pattern aloud → state complexity target → then code, narrating. Recognition is graded before the code is.' },
      { f: 'Rapid-fire answer shape?', b: 'Direct answer + one depth-proving caveat. Two sentences. Length signals uncertainty.' },
      { f: 'AI system design vs classic — the differentiator?', b: 'A quality strategy in the architecture: golden-set evals, guardrail gates, shadow→pilot rollout gated on measured quality.' },
      { f: 'STAR story rules?', b: 'S 2 sentences, T 1, A 3–5 in first-person singular, R quantified + lesson — and an artifact that survives "show me".' },
      { f: '"Longest substring satisfying constraint" →?', b: 'Variable sliding window with a count map: expand right, shrink while broken, track max. O(n).' },
    ],
    deepDive: [
      { label: 'Live mock with a human', note: 'Book one real mock (peer, community, or a platform) within 7 days. Solo drills calibrate knowledge; a live stranger calibrates nerves — different muscle, same rubric.' },
    ],
  },
  {
    id: 'd180', day: 180, week: 26, phase: 9, kind: 'review',
    title: 'Demo Day',
    analogy: 'Graduation',
    objectives: [
      'Deliver the capstone presentation using the provided template, within time, including the numbers',
      'Complete the 40-question program-wide mastery final and score it honestly by phase',
      'Run the gap-analysis protocol and produce a 4-week personal continuing plan',
      'Execute the job-search launch checklist: portfolio live, resume bullets drafted, first applications queued',
    ],
    prereqs: [
      { day: 178, label: 'Capstone v1.0 shipped' },
      { day: 179, label: 'Interview gym' },
      { day: 175, label: 'Gap-closure protocol' },
    ],
    eli5: `Graduation day has three parts, and only one wears the gown. The ceremony: you present what you built to whoever you can gather — friends, a community channel, a camera if nobody else — because work presented out loud becomes real in a way private work never does. The final exam: forty questions spanning everything from Day 2's variables to yesterday's gates, not to pass or fail you but to draw the honest map of what stuck. And the part nobody photographs: walking out of the hall into the job market, diploma in hand, with a plan for Monday morning.

Here is the reframe that matters: you are not "done learning" today. You are done with the SCAFFOLDING. For 180 days, this program decided what you'd study each morning; from tomorrow, the machinery you've internalized — spaced repetition, error logs, golden sets, punch lists, debriefs — decides. The gap analysis converts your final-exam misses into your first self-directed curriculum. The launch checklist converts your repo into applications. Diplomas mark endings; this one is a booster stage separating. The vehicle keeps ascending.`,
    why: `A 180-day journey that ends without a presentation, an honest self-assessment, and a launched job search quietly evaporates — the difference between "I completed a curriculum" and "I can show you what I built, tell you what I'm still weak at, and my applications went out Tuesday" is the difference interviewers and hiring managers actually hire on. The mastery final's gap map also protects you in interviews: knowing precisely where you're weak means never being ambushed by your own blind spots.`,
    tech: `### The presentation (template)

Ten minutes, eight beats — rehearsed twice yesterday: (1) **Title + one-liner** — "a production docs-QA assistant with grounded, cited answers." (2) **Problem** — who suffers, what it costs (2 min, Day 163's discovery voice). (3) **Live demo** — one real question with citations, one honest refusal, the rehearsed failure-recovery if fate offers it (3 min). (4) **How** — the C4 context diagram, 60 seconds, exec register. (5) **How I know it works** — the differentiating beat almost every demo lacks: golden set, gates, red-team results, with intervals (2 min). (6) **Ops** — traces, dashboard, runbook in one breath. (7) **The numbers** — p95 latency, cost/query, eval scores, the payback month from Day 173. (8) **Next + ask** — what v1.1 would be; what you're looking for (a job — say it plainly to a live audience). Deliver to humans if at all possible; a recorded delivery published with the repo is the fallback and doubles as a portfolio asset.

### The mastery final

Forty questions, closed-notes, self-scored — each maps to a revisit day, so every miss becomes a scheduled review, not a shrug. Score by phase to see the shape of your knowledge, not just the total. Thresholds for the gap protocol: a phase below 70% gets a weekly slot in the continuing plan; 70–85% gets its flashcard deck resurrected; above 85% coasts on maintenance.

### The gap protocol and the launch

Gap analysis is Day 175's after-action method applied program-wide: for each sub-70 phase, list the specific missed questions, their revisit days, and ONE concrete exercise per gap (re-do Day N's project variant, not "re-read Day N"). Output: a 4-week continuing plan — 5 hours/week: 2 h gap closure, 1 h flashcard maintenance (the SM-2 deck keeps running), 1 h DSA maintenance (2–3 problems), 1 h building on the capstone (v1.1 features double as fresh interview stories). The job-search launch runs in parallel with the plan, not after it — applications begin now, because interview feedback is itself the best gap-finder, and the loop from Day 143 applies to careers too: apply → interview → log errors → fix → repeat.`,
    viz: null,
    guided: [
      {
        title: 'The presentation, delivered',
        minutes: 25,
        body: `1. Set up: production URL open, dashboard on a second tab, architecture diagram ready, timer visible. Audience: the best you can arrange TODAY — a friend on a call, a study group, a community demo channel, or a recording you will publish. Do not postpone for a better audience; delivered-today beats perfect-someday.
2. Deliver the eight beats. Hold the 10-minute cap — running long on your own graduation is still running long.
3. Beat 5 discipline: say the actual numbers with their intervals ("groundedness 0.93, plus or minus 0.03, on a 45-case golden set the CI re-runs on every push"). This beat is what separates you from every demo your audience has seen.
4. Beat 8 discipline: make the ask explicitly — "I'm looking for AI engineer / forward-deployed roles; the repo is at this URL."
5. Afterwards: collect one piece of feedback per audience member (what landed, what confused), and log the questions you were asked — Demo Day questions are interview questions in disguise. If recorded: publish the video link in the README today, imperfections included.`,
      },
      {
        title: 'The 40-question mastery final',
        minutes: 30,
        body: `Closed notes. Write answers on paper, ≤ 2 sentences each. Score with the key (✓ full, half for partial), tally BY PHASE, then run the gap protocol in the practice block.

**Phase 1 (D1–21):** 1. A list is passed to a function that appends to it — what does the caller see afterwards, and why? (D4) 2. Name git's three areas and the command that moves work between each. (D8) 3. Why does a generator handle a 10 GB file where a list fails? (D11) 4. Structure of a good test per arrange-act-assert — and what makes a test "flaky"? (D18)

**Phase 2 (D22–49):** 5. Complexity of \`x in my_list\` vs \`x in my_set\` — and the classic bug this causes inside a loop. (D22) 6. What problem shape triggers "sliding window"? (D24) 7. Why does BFS (not DFS) find shortest unweighted paths? (D31) 8. Binary search "first true" — what invariant do you maintain? (D33) 9. LEFT JOIN vs INNER JOIN: which rows appear? (D37) 10. What does a B-tree index speed up, and what does it cost? (D38)

**Phase 3 (D50–63):** 11. What does cosine similarity measure, and why does it power embedding search? (D50) 12. What does the gradient point toward, and what does gradient descent do with it? (D53) 13. A test is 99% accurate; the disease is 1-in-10,000. Roughly what fraction of positives are real, and what is this trap called? (D59) 14. Cross-entropy in one sentence — and what does "perplexity 20" mean? (D62)

**Phase 4 (D64–84):** 15. Why does vectorized NumPy beat a Python loop by 100x? (D64) 16. Define data leakage and give the temporal example. (D69) 17. 99% accuracy on 1%-positive fraud data — why is this meaningless and what do you report instead? (D75) 18. How does k-fold cross-validation catch what a single split misses? (D76)

**Phase 5 (D85–105):** 19. What single calculus rule does backprop apply, and along what structure? (D86) 20. Why must "similar meaning → nearby vectors" hold for embeddings to be useful? (D92) 21. Walk Q/K/V through one attention step. (D94) 22. Why does BPE cause LLMs to fumble arithmetic and spelling? (D96) 23. Temperature 0 vs 1.2: what changes in the sampling distribution? (D102)

**Phase 6 (D106–133):** 24. Why are LLM chat APIs stateless, and what does that make YOUR job? (D106) 25. The tool-use loop: what happens between tool_use and the final answer? (D111) 26. Chunks too small vs too large — what breaks in each direction? (D114) 27. What does BM25 catch that dense retrieval misses, and how are they fused? (D116) 28. Name three agent budget/stop mechanisms and why agents need them. (D120/125) 29. Direct vs indirect prompt injection — and why is the indirect kind worse for RAG? (D132)

**Phase 7 (D134–147):** 30. Why do golden sets need counterfactual/negative cases, not just happy paths? (D134) 31. Three LLM-as-judge biases and one mitigation each. (D135) 32. Why must RAG evals separate retrieval from generation? (D136) 33. Two eval runs: 84% then 88% on 50 cases. What must you check before celebrating? (D139)

**Phase 8 (D148–161):** 34. Why does Dockerfile instruction ORDER matter for build speed? (D148) 35. What belongs between "tests pass" and "deploy" in an AI service's pipeline, and why? (D141/152) 36. TTFT vs tokens/sec — which does streaming fix, and what does the KV cache save? (D155) 37. SLO + error budget in two sentences. (D157)

**Phase 9 (D162–179):** 38. The Mom Test in one rule. (D163) 39. SaaS vs VPC vs air-gapped — the one-axis summary. (D170) 40. A customer reports "the AI got worse." Your first three questions, in order. (D172)

~~~text
KEY (gist): 1 Caller's list mutated - one shared object, two names (aliasing).
2 Working dir -add-> staging -commit-> history. 3 Lazy: one item in memory at
a time. 4 Set up state, act once, assert result; flaky = depends on order/time/
randomness. 5 O(n) vs O(1); accidental quadratic in a loop. 6 Contiguous
subarray/substring optimizing a shrinkable constraint. 7 Explores by distance
layers, so first arrival = fewest edges. 8 Everything left of lo is false,
right of hi is true - the boundary is the answer. 9 INNER: matches only; LEFT:
all left rows, NULLs where unmatched. 10 Point lookups/range scans on indexed
columns; slower writes + storage. 11 Angle between vectors, scale-free -
"pointing the same direction in meaning-space". 12 Steepest ascent; step the
OPPOSITE way, repeat. 13 ~1% real (99/10,099); base-rate neglect. 14 Average
surprise of true labels under your predicted distribution; perplexity 20 = as
uncertain as choosing among 20 equally likely options. 15 One interpreted trip
through compiled C loops vs per-element interpreter overhead. 16 Future/target
info in training features; temporal: training on data from after the
prediction moment. 17 Predicting all-negative scores 99%; report
precision/recall/PR-AUC per the harm model. 18 Every point gets a turn as
validation; variance across folds exposes split luck. 19 Chain rule, applied
backwards over the computational graph. 20 Retrieval ranks by distance - if
geometry does not encode meaning, nearest = noise. 21 Query·Key scores ->
softmax weights -> weighted sum of Values. 22 Digits/letters merge into
opaque multi-char tokens - the model never reliably sees characters.
23 T=0 argmax determinism; T>1 flattens toward uniform - more diverse, more
error-prone. 24 Server keeps no conversation; you resend full context - so
context management is app-side engineering (D122). 25 Your code executes the
tool, returns a result message, model continues with it - possibly looping.
26 Small: fragmented, unsupported answers; large: diluted retrieval, wasted
tokens. 27 Exact identifiers, rare terms, acronyms; reciprocal rank fusion.
28 Step/token/time caps, approval gates for irreversible actions, stop
criteria - loops and drift are the default failure. 29 Direct: user attacks;
indirect: instructions hidden in retrieved DATA - RAG fetches attacker
content into the prompt automatically. 30 Systems must refuse/handle what
they can't answer; happy-path-only evals certify overconfidence.
31 Position (swap order), verbosity (pin/normalize length), self-preference
(different judge model; calibrate all vs humans). 32 Wrong-context vs
wrong-generation need different fixes; a bad answer alone doesn't tell you
which stage failed. 33 Sample size! ~50 cases -> CI ~±10 pts; difference is
within noise - run more cases or paired comparison. 34 Layer caching:
unchanged early layers reuse cache; copy code LAST so dep layers survive
edits. 35 The eval gate (golden set + thresholds): correctness of AI behavior
isn't covered by unit tests. 36 Streaming fixes perceived wait (TTFT); KV
cache avoids recomputing attention over the prefix per token. 37 SLI measured,
SLO target (e.g. 99.5% under 3 s); error budget = allowed shortfall that
gates release risk. 38 Ask about past behavior, never hypotheticals -
"would you use this?" invites lies. 39 Data control rises, your access and
observability fall, support cost multiplies. 40 Impact (what/who, quantified),
scope (what boundary), recent changes (deploys, corpus, provider, config).
~~~`,
      },
    ],
    practice: [
      {
        title: 'Gap analysis → the 4-week continuing plan',
        minutes: 20,
        body: `Run the protocol on your final scores. (1) Tally per phase as a percentage. (2) Phases < 70%: for each missed question, write the revisit day and ONE concrete exercise — a redo of that day's project variant, never "re-read" (Day 175's generation rule). (3) Phases 70–85%: resurrect their flashcard decks into the daily rotation. (4) Build \`portfolio/continuing-plan.md\`: a 4-week grid at ~5 h/week — 2 h gap exercises, 1 h flashcard maintenance, 1 h DSA upkeep (2–3 problems from the Day 179 pattern list), 1 h capstone v1.1 (pick ONE feature: e.g. multi-corpus support, the SCIM endpoint from Day 169, or the semantic cache from Day 156 — new features are new interview stories).

Constraints: the plan must name specific days/exercises, not topics; cap it at 4 weeks — open-ended plans are abandoned plans; schedule week 1's sessions into your actual calendar before closing the file.`,
      },
    ],
    project: {
      title: 'Launch: the job-search checklist',
      brief: `Execute \`portfolio/launch-checklist.md\` today, checking items live: (1) **Portfolio**: capstone repo public with v1.0 tag, README cold-read-verified, demo video or screenshots linked; fde-sim-2 package and interview-prep folder public; GitHub profile README pointing at the top three artifacts. (2) **Resume**: one page; 4–6 bullets generated from program artifacts using the formula verb + what you built + measured result ("Built a production RAG service with a 45-case eval harness in CI; groundedness 0.93, p95 1.9 s, ~USD 0.04/query"); capstone URL near the top. (3) **Targets**: a list of 15 companies/roles across three tracks — AI engineer, forward-deployed/solutions engineer, ML engineer (adjacent) — with one warm contact identified where possible. (4) **Motion**: first three applications submitted TODAY (imperfect is fine — feedback is data, Day 143's flywheel applied to careers); weekly cadence committed in the continuing plan (5 apps + 1 mock or real interview + error-log update). Graduation is the launch, not the landing.`,
      rubric: [
        'Presentation delivered to a live audience or published as a recording, within 10 minutes, numbers-with-intervals beat included',
        'Mastery final completed closed-notes and scored by phase honestly',
        'Every sub-70% phase has named exercises with revisit days; plan capped at 4 weeks and calendared',
        'Portfolio triad (capstone, fde-sim-2, interview-prep) public and linked from profile',
        'Resume drafted with ≥ 4 artifact-backed, quantified bullets and the capstone URL',
        'Three applications actually submitted today; weekly cadence written into the plan',
      ],
    },
    mistakes: [
      'Postponing the presentation until it (or you) is "ready." Day 167 taught that readiness comes from reps, not waiting; a recorded imperfect delivery published today beats a perfect one that never happens.',
      'Treating the final as pass/fail. It is a map-making instrument: a 60% phase is not a verdict, it is next month\'s curriculum — the whole point of scoring by phase and mapping misses to revisit days.',
      'Gap plans that say "review Phase 3." Only generation closes gaps: "redo Day 55\'s gradient-descent lab from memory, then Day 62\'s cross-entropy computation" is a plan; "review math" is a wish.',
      'Waiting to apply until gaps close. Interview feedback finds gaps faster than any self-assessment — applications ARE the eval harness for your job search. Ship three today.',
      'Resume bullets describing effort instead of outcomes. "Studied RAG for 6 months" vs "Built a production RAG service with CI eval gates; groundedness 0.93" — the artifact-plus-number formula, every bullet.',
      'Letting the spaced-repetition deck die tomorrow. The deck is the program\'s longest-lived artifact; 15 minutes daily preserves 180 days of encoding through a multi-month job search.',
    ],
    quiz: [
      {
        q: 'Presentation beat 5 — "how I know it works" — exists because:',
        o: [
          'Audiences expect at least one chart',
          'Demos prove existence, not reliability; the eval-and-gates story is the evidence that separates an engineer from a demo-builder',
          'It fills time between the demo and the numbers',
          'Recruiters require eval metrics',
        ],
        x: 1,
        w: 'Anyone can show a happy path (Day 134: demos lie). Golden sets, gates, and red-team results with intervals are the answer to the only hard question: "how do you know?" — in interviews and in customer rooms alike.',
        revisit: 134,
      },
      {
        q: 'Your final shows Phase 3 (math) at 55%. The gap protocol prescribes:',
        o: [
          'Re-reading Days 50–63 next week',
          'Accepting it — math matters less for applied roles',
          'Named regeneration exercises per miss (e.g. redo the Day 55 lab from memory) scheduled into a capped, calendared plan',
          'Postponing job applications until the phase clears 85%',
        ],
        x: 2,
        w: 'Generation over recognition (Day 175), specific over vague, capped over open-ended — and the job search runs in parallel because interview feedback is itself the best gap-finder.',
        revisit: 175,
      },
      {
        q: 'The strongest resume bullet format for a career-changer out of this program is:',
        o: [
          '"Completed an intensive 180-day AI engineering curriculum"',
          '"Passionate about LLMs, RAG, and agents with hands-on experience"',
          '"Built and operates a production RAG service with a 45-case eval harness gating CI; groundedness 0.93, p95 1.9 s" — verb, artifact, measured result, verifiable at a URL',
          '"Proficient in Python, PyTorch, FastAPI, Docker, and vector databases"',
        ],
        x: 2,
        w: 'Hiring filters reward evidence: an artifact with numbers and a link survives skepticism; courses, passion, and keyword lists do not. Every bullet should point at something a reviewer can open.',
        revisit: 180,
      },
    ],
    resources: [
      { label: 'Tech Interview Handbook — resume + application strategy', url: 'https://github.com/yangshun/tech-interview-handbook', type: 'repo', time: '25 min' },
      { label: 'FDE Interview Guide (Exponent) — target-role calibration', url: 'https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde', type: 'article', time: '15 min' },
      { label: 'NeetCode Roadmap — the maintenance-mode problem source', url: 'https://neetcode.io/roadmap', type: 'course', time: '10 min' },
      { label: 'ML Interviews Book — company/role landscape chapter', url: 'https://huyenchip.com/ml-interviews-book/', type: 'book', time: '20 min' },
    ],
    schedule: [
      { activity: 'Setup + final due-card sweep (the deck lives on)', minutes: 10 },
      { activity: 'Deliver the capstone presentation + collect feedback', minutes: 25 },
      { activity: 'The 40-question mastery final, closed notes', minutes: 30 },
      { activity: 'Score by phase + gap analysis → continuing plan', minutes: 20 },
      { activity: 'Job-search launch: portfolio, resume, 3 applications', minutes: 25 },
      { activity: 'Quiz, final flashcards, and the last commit', minutes: 10 },
    ],
    completion: [
      'Presentation delivered or published; audience questions logged',
      'Final scored by phase; gap plan written, capped at 4 weeks, calendared',
      'Portfolio triad public; resume drafted with artifact-backed bullets',
      'Three applications submitted; continuing plan committed as the program\'s last artifact',
    ],
    connections: {
      back: 'Day 1 promised a protocol: two hours a day, spaced repetition, artifacts over vibes. 180 days later the evidence is a production service (Day 178), an engagement portfolio (Day 174), an interview kit (Day 179), and a deck of everything you refused to forget. Every review day since Day 7 was rehearsal for today\'s gap protocol.',
      forward: 'There is no Day 181 in this program — by design. The continuing plan is yours now: the deck keeps scheduling, the error log keeps closing, the capstone keeps growing a v1.1, and the first interview loop starts the next cycle of log → fix → gate. Ship, measure, iterate — it was never just about software.',
    },
    flashcards: [
      { f: 'The eight presentation beats?', b: 'Title → problem → live demo → how (C4) → how-I-know-it-works (evals!) → ops → numbers → next + ask.' },
      { f: 'Gap protocol thresholds?', b: '< 70%: named regeneration exercises, calendared. 70–85%: resurrect the deck. > 85%: maintenance.' },
      { f: 'Resume bullet formula?', b: 'Verb + artifact + measured result + verifiable link. "Built X with Y gate; metric Z" — never effort or passion claims.' },
      { f: 'Why apply before gaps close?', b: 'Interview feedback is the fastest gap-finder — the eval flywheel (log → case → fix → gate) applied to your career.' },
      { f: 'The program\'s longest-lived artifact?', b: 'The spaced-repetition deck — 15 min/day preserves 180 days of encoding through the whole job search.' },
    ],
    deepDive: [
      { label: 'The 30/60/90 for your first role', note: 'Sketch what your first 90 days in an FDE/AI-engineer seat would look like using this program\'s artifacts as the toolkit — it is a killer final-round interview answer and a genuinely useful plan.' },
    ],
  },
];
