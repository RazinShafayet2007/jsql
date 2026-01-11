declare module '@theme/Heading' {
    import type { ComponentProps, ReactNode } from 'react';

    export type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    export interface Props extends ComponentProps<HeadingType> {
        as: HeadingType;
        className?: string;
    }

    export default function Heading(props: Props): ReactNode;
}

declare module '@theme/Layout' {
    import type { ReactNode } from 'react';

    export interface Props {
        children?: ReactNode;
        title?: string;
        description?: string;
        noFooter?: boolean;
        wrapperClassName?: string;
        pageClassName?: string;
    }

    export default function Layout(props: Props): ReactNode;
}
