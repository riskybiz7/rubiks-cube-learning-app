import { METHODS, type Method } from '../content/methods';

/** A row of buttons for choosing the solving method (Beginner or CFOP). */
export function MethodButtons({
  method,
  onChange,
}: {
  method: Method;
  onChange: (method: Method) => void;
}) {
  return (
    <div className="controls" role="group" aria-label="Method">
      {METHODS.map((option) => (
        <button
          key={option.method}
          className={method === option.method ? 'active' : ''}
          aria-pressed={method === option.method}
          onClick={() => onChange(option.method)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
