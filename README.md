# OCPP Charge point simulator

## Simple charge point simulator, support OCPP JSON-1.6

Use Node.js 22.12+ or 24+ (Node 24 LTS is recommended).

```sh
npm ci
npm start
```

The development server runs at http://localhost:3000. `npm test` runs the
tests once, `npm run test:watch` runs them interactively, and `npm run lint`
checks the source. `npm run build` runs linting and creates the production
site in `build/`; `npm run preview` serves that build locally.

The project uses Vite and Vitest in place of Create React App and Jest.
JSX source files use the `.jsx` extension. Vite uses its default modern-browser
build target; the former Create React App Browserslist configuration no longer
applies. Environment variables exposed to the app use the `VITE_` prefix and
`import.meta.env`.

For a site hosted under a path, build with
`npm run build -- --base=/OCPP-Charge-Point-Simulator/`. This sets both the
asset paths and the router basename. Configure the host to serve `index.html`
for application routes such as `/settings`. Preview a build made this way with
`npm run preview -- --base=/OCPP-Charge-Point-Simulator/`.
`npm run deploy` builds and
publishes the `build/` directory with gh-pages; for a GitHub project site, set
`base` in `vite.config.mjs` to the repository path before deploying.

Runtime and test dependencies have been updated. Nano ID 5, Vitest 4 and
jsdom 27 retain compatibility with Node 25, which newer major releases exclude.
ESLint 9 is retained for compatibility with eslint-plugin-react's peer range.
Unused react-use-websocket and obsolete type packages have been removed; this
JavaScript app uses the browser's WebSocket directly.

### Implemented functions

#### Operations Initiated by Charge Point
* Boot Notification
* Authorize
* Heartbeat
* Meter Values
* Start Transaction
* Stop Transaction
* Status Notification

#### Operations Initiated by Central System
* Remote Start Transaction
* Remote Stop Transaction
* Unlock connector
* GetConfiguration
* ChangeConfiguration
* TriggerMessage
  * BootNotification
  * Heartbeat
  * MeterValues
  * StatusNotification
  * DiagnosticsStatusNotification
  * FirmwareStatusNotification
* GetDiagnostics
