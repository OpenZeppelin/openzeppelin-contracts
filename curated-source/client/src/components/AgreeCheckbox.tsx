import type { ReactNode } from 'react';

/** Required consent checkbox linking to the policies being accepted. */
export function AgreeCheckbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mute [&_a]:text-gold [&_a]:underline-offset-4 hover:[&_a]:underline">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-[#D4AF37]" />
      <span>{children}</span>
    </label>
  );
}
