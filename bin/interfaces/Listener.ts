export default interface Listener<T> {
  notify(payload: T): void
}
