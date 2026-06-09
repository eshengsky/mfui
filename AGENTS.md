# Repository Guidelines

## TypeScript Style

- Do not use JavaScript or TypeScript classes in project source code.
- Prefer factory functions, plain objects, closures, and exported types for stateful APIs.
- Keep runtime objects explicit and serializable where practical.
- Use `type` exports for public shapes and `create*` functions for construction.
- Avoid `#private` members; keep internal state inside closures instead.
- Do not use generator functions or `yield` syntax in project source code.
- Prefer explicit callbacks, promises, readable streams, or small state machines over generator-based control flow.

## Development Workflow

- Do not start or leave local dev servers running unless the user explicitly asks for it.
- Prefer `typecheck`, `build`, and `test` commands for verification when a dev server is not required.
- For simple documentation, configuration, or obvious CSS breakpoint changes, prefer build verification and let the user inspect the UI manually instead of spending time on browser automation.
- Use browser or visual verification for UI changes only when the layout is complex, the behavior cannot be judged from source, or the user explicitly asks for it.
- If a dev server must be started for debugging, stop it before finishing unless the user asks to keep it running.
