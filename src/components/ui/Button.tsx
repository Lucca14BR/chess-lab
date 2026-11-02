import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'icon' | 'icon-sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 border border-transparent font-medium',
  secondary: 'bg-panel-2 text-ink border border-line hover:border-line-strong hover:bg-hover',
  outline: 'bg-transparent text-ink border border-line-strong hover:bg-hover',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-hover border border-transparent',
  danger: 'bg-negative-soft text-negative border border-negative/30 hover:bg-negative/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
  'icon-sm': 'h-7 w-7 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

/** Link com aparência de botão (evita aninhar <button> dentro de <a>). */
export function ButtonLink({ to, href, variant = 'secondary', size = 'md', className, children, ...rest }: { to?: string; href?: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; title?: string; 'aria-label'?: string }) {
  const cls = cn(
    'inline-flex shrink-0 items-center rounded-md transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
    variants[variant],
    sizes[size],
    className,
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? '#'} className={cls} {...rest}>
      {children}
    </Link>
  );
}
