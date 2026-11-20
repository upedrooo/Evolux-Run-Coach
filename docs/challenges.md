# Challenges Encountered and How They Were Solved

Real problems from the project—from symptom to root cause and fix.

## 1. Unstable Free-Tier LLM
- **Symptom:** plan generation failed intermittently; a single request hit the overall timeout without ever trying the second model.
- **Cause:** an overloaded model could take ~40 s just to return a 503 error, consuming the entire shared deadline.
- **Solution:** per-model timeouts (except for the last model), falling back to the next model on busy, discontinued, or slow responses, with the fastest model tried first. Testing with a real API key also revealed that a former default model was no longer available to new accounts, so the model list became environment-configurable. → [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts)

## 2. AI Breaking "Obvious" Rules
- **Symptom:** a lighter model tagged "active recovery" as a running session with no distance and repeated the mistake even after being corrected.
- **Solution:** two layers—a stricter prompt **plus** deterministic normalization (a running session with zero/missing distance becomes cross-training) before validation. Lesson: never rely solely on the model obeying instructions. → [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts)

## 3. Concurrency-Vulnerable Usage Limit
- **Potential symptom:** two concurrent requests could bypass the plan cap if the app performed a separate read, check, and write.
- **Solution:** a single atomic database operation with permissions that prevent users from calling it directly. Tested against embedded PostgreSQL. → [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql)

## 4. Workout File Privacy
- **Problem:** GPX files contain full GPS tracks (revealing where the user lives and trains).
- **Solution:** parse files in the browser and send only a summary. This also avoids serverless request-body size limits.

## 5. "Keep Me Signed In" with Passwordless Login
- **Challenge:** controlling session persistence when authentication is handled by an external provider.
- **Solution:** verify the OTP and establish the session inside server routes, applying a single filter that strips cookie expiration when the user unchecks the option. → [`remember-me-cookies.ts`](../code-samples/typescript/remember-me-cookies.ts)

## 6. Framework Breaking Changes
- **Challenge:** Next.js 16 introduced breaking changes (`proxy.ts` replacing `middleware.ts`, async cookies and params APIs, generated route types).
- **Solution:** read the installed version's bundled documentation before writing code and lock down the behavior with automated tests.

## 7. Hydration Warning Triggered by a Browser Extension
- **Symptom:** Next's dev indicator constantly displayed "1 issue".
- **Cause:** a browser security extension injected custom attributes onto every DOM element before React hydrated.
- **Solution:** a **development-only** script strips those attributes before hydration; production remains untouched. Diagnosed by reading React's console hydration diff.

## 8. Deployment Failure from an Overbroad Ignore Pattern
- **Symptom:** hosted builds failed with "module not found" even though everything worked locally.
- **Cause:** an unanchored `supabase` entry in the ignore file also excluded `lib/supabase/`, which is application code.
- **Solution:** anchor patterns to the root (`/supabase`) and document the gotcha.

## 9. Real-World Export Quirks
- **Challenge:** Strava CSV exports have duplicate column names (`Distance` in both km and meters), free-form date formats, and archives arrive as ZIP files containing `.gz` files.
- **Solution:** read the **last** duplicate column, unpack both `.gz` and ZIP, fall back to individual activity files when the CSV isn't recognized, and deduplicate when the same run appears across multiple files.

## 10. Single-Screen Landing Page and Border Contrast
- **Challenge:** fitting a rich composition into one viewport without scrolling across multiple screen sizes, while fixing nearly invisible borders.
- **Solution:** fixed-coordinate layout scaled via *container query units*, automated scroll checks across multi-size iframes, and two-tier border tokens with measured contrast ratios. → [`design-tokens.css`](../code-samples/css/design-tokens.css)
