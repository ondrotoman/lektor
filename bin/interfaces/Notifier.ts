import type Listener from './Listener'

export default interface Notifier {
  setListener(listener: Listener<Notifier>): void
  unsetListener(listener: Listener<Notifier>): void
}
