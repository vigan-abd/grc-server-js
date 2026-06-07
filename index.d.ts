// Type definitions for @vigan-abd/grc-server

/**
 * Reply handler passed to a worker's request handler by the grenache transport.
 */
export interface GrcRequestHandler {
  reply (err: Error | null, response?: any): void
}

/**
 * Payload of an incoming grc request.
 */
export interface GrcRequestPayload {
  action: string
  args: any[]
}

/**
 * Options shared by every grc worker that listens on a single port.
 */
export interface GrcWrkBaseOpts {
  /** Grc service name */
  name: string
  /** Grc service port */
  port: number
  /** Grape URL */
  grape: string
  /** Grc announce interval, defaults to 15000 */
  announce?: number
  /** Worker config, defaults to {} */
  conf?: Record<string, any>
  /** Worker environment, defaults to 'development' */
  env?: string
}

/**
 * Options for single transport workers that expose a call timeout.
 */
export interface GrcSingleTransportWrkOpts extends GrcWrkBaseOpts {
  /** Grc call timeout, defaults to 30000 */
  timeout?: number
}

/**
 * Options shared by every grc worker that listens on multiple ports/transports.
 */
export interface GrcWrkMultiTransportOpts {
  /** Grc service name */
  name: string
  /** Grc service ports */
  ports: number[]
  /** Grape URL */
  grape: string
  /** Grc announce interval, defaults to 15000 */
  announce?: number
  /** Worker config, defaults to {} */
  conf?: Record<string, any>
  /** Worker environment, defaults to 'development' */
  env?: string
  /** Worker transport service name prefixes, should match number of ports */
  prefixes: string[]
}

/**
 * Options for the combined http + ws multi transport worker.
 */
export interface GrcHttpWsWrkOpts extends Omit<GrcWrkMultiTransportOpts, 'prefixes'> {
  /** Grc call timeout, defaults to 30000 */
  timeout?: number
  /** Worker transport service name prefixes, defaults to ['http', 'ws'] */
  prefixes?: string[]
}

/**
 * Base grc worker. Public methods defined on subclasses (that do not start with
 * `_` and are not reserved) are automatically exposed as callable grc actions.
 */
export class GrcWrkBase {
  protected _link: any
  protected _name: string
  protected _port: number
  protected _announce: number
  protected _conf: Record<string, any>
  protected _env: string
  protected _actions: Set<string>
  /** Transport peer server, must be initialized by the extending class */
  protected _peerServer: any
  protected _service: any

  constructor (opts: GrcWrkBaseOpts)

  /** Collects the public methods exposed as callable grc actions. */
  protected _registerActions (): void

  /** Whether the worker serves the requested service name. */
  protected _isServiceSupported (serviceName: string): boolean

  /** Registers actions, starts the link and begins announcing the service. */
  start (): Promise<void>

  /** Stops announcing, the service, the peer server and the link. */
  stop (): void

  /** Dispatches an incoming grc request to the matching action. */
  handler (
    rid: string,
    serviceName: string,
    payload: GrcRequestPayload,
    handler: GrcRequestHandler
  ): Promise<void>
}

/**
 * Grc worker over the http transport.
 */
export class GrcHttpWrk extends GrcWrkBase {
  constructor (opts: GrcSingleTransportWrkOpts)
}

/**
 * Grc worker over the websocket transport.
 */
export class GrcWsWrk extends GrcWrkBase {
  constructor (opts: GrcSingleTransportWrkOpts)
}

/**
 * Base grc worker that serves the same actions over multiple transports/ports.
 */
export class GrcWrkMultiTransport extends GrcWrkBase {
  protected _ports: number[]
  protected _prefixes: string[]
  protected _peerServers: any[]
  protected _services: any[]
  protected _names: string[]

  constructor (opts: GrcWrkMultiTransportOpts)
}

/**
 * Grc worker serving actions over both http and ws transports.
 */
export class GrcHttpWsWrk extends GrcWrkMultiTransport {
  constructor (opts: GrcHttpWsWrkOpts)
}

declare const _default: {
  GrcWrkBase: typeof GrcWrkBase
  GrcHttpWrk: typeof GrcHttpWrk
  GrcWsWrk: typeof GrcWsWrk
  GrcWrkMultiTransport: typeof GrcWrkMultiTransport
  GrcHttpWsWrk: typeof GrcHttpWsWrk
}

export default _default
