export default function QuantityStepper({ value, min = 1, max = 99, onChange, small = false }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v) || min)));
  return (
    <div className={`stepper ${small ? 'stepper--sm' : ''}`}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(parseInt(e.target.value, 10))}
        aria-label="Quantity"
      />
      <button
        type="button"
        className="stepper__btn"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
