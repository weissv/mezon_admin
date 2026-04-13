import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  meta,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={clsx("mezon-page-header", className)} {...props}>
      <div className="mezon-page-header__content">
        {icon ? <div className="mezon-page-header__icon">{icon}</div> : null}
        <div className="min-w-0">
          {eyebrow ? <p className="mezon-page-header__eyebrow">{eyebrow}</p> : null}
          <div className="mezon-page-header__title-row">
            <h1 className="mezon-page-header__title">{title}</h1>
            {meta ? <div className="mezon-page-header__meta">{meta}</div> : null}
          </div>
          {description ? <div className="mezon-page-header__description">{description}</div> : null}
        </div>
      </div>
      {actions ? <div className="mezon-page-header__actions">{actions}</div> : null}
    </header>
  );
}

interface PageSectionProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function PageSection({ className, inset = false, ...props }: PageSectionProps) {
  return (
    <section
      className={clsx("mezon-page-section", inset && "mezon-page-section--inset", className)}
      {...props}
    />
  );
}

export function PageToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mezon-page-toolbar", className)} {...props} />;
}

export function PageStack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mezon-page-stack", className)} {...props} />;
}
