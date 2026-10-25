'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    // Remove 'admin' from paths for display if preferred, or keep it
    // Let's keep it but make 'admin' link to dashboard

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                <Home size={16} />
            </Link>
            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const isLast = index === paths.length - 1;
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight size={16} className="mx-2 text-gray-600" />
                        {isLast ? (
                            <span className="text-white font-medium">{label}</span>
                        ) : (
                            <Link href={href} className="hover:text-white transition-colors">
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
