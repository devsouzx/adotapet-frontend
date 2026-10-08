import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface CommonProps { label: string; hint?: string; error?: string; required?: boolean; children?: ReactNode }
type FieldProps = CommonProps & InputHTMLAttributes<HTMLInputElement>

export function InputField({ label, hint, error, id, required, ...props }: FieldProps) {
  const fieldId = id || props.name
  return <label className="field" htmlFor={fieldId}>
    <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
    <input id={fieldId} className={`text-input ${error ? 'input-error' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined} required={required} {...props} />
    {error ? <span className="field-error" id={`${fieldId}-error`}>{error}</span> : hint ? <span className="field-hint" id={`${fieldId}-hint`}>{hint}</span> : null}
  </label>
}

type SelectProps = CommonProps & SelectHTMLAttributes<HTMLSelectElement> & { options: Array<{ value: string; label: string }> }
export function SelectField({ label, hint, error, id, required, options, children, ...props }: SelectProps) {
  const fieldId = id || props.name
  return <label className="field" htmlFor={fieldId}>
    <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
    <select id={fieldId} className={`text-input select-input ${error ? 'input-error' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined} required={required} {...props}>
      {children || options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
    </select>
    {error ? <span className="field-error" id={`${fieldId}-error`}>{error}</span> : hint ? <span className="field-hint" id={`${fieldId}-hint`}>{hint}</span> : null}
  </label>
}

type TextareaProps = CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>
export function TextareaField({ label, hint, error, id, required, ...props }: TextareaProps) {
  const fieldId = id || props.name
  return <label className="field" htmlFor={fieldId}>
    <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
    <textarea id={fieldId} className={`text-input textarea-input ${error ? 'input-error' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined} required={required} {...props} />
    {error ? <span className="field-error" id={`${fieldId}-error`}>{error}</span> : hint ? <span className="field-hint" id={`${fieldId}-hint`}>{hint}</span> : null}
  </label>
}
