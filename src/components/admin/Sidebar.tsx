'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
    Building2,
    LayoutDashboard,
    Users,
    Newspaper,
    UserCog,
    Mic,
    LogOut,
    ChevronLeft,
    Menu,
    User,
} from 'lucide-react';

const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/santri', icon: Users, label: 'Santri' },
    { href: '/admin/berita', icon: Newspaper, label: 'Berita' },
    { href: '/admin/pengurus', icon: UserCog, label: 'Pengurus' },
    { href: '/admin/recordings', icon: Mic, label: 'Recordings' },
];

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <aside
            className={cn(
                'flex flex-col h-screen transition-all duration-300 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-emerald-800">
                <Link href="/" className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                    <div className="p-2 bg-emerald-700 rounded-xl">
                        <Building2 className="w-5 h-5" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h2 className="font-bold text-lg">PPM Admin</h2>
                            <p className="text-xs text-emerald-300">Dashboard</p>
                        </div>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-emerald-800 rounded-lg transition hidden lg:block"
                >
                    {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                                isActive
                                    ? 'bg-emerald-700/50 text-white'
                                    : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white',
                                collapsed && 'justify-center'
                            )}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span className="flex-1">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-3 border-t border-emerald-800 space-y-2">
                {/* User Info */}
                {!collapsed && profile && (
                    <div className="px-3 py-2 bg-emerald-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{profile.nama || profile.email}</p>
                                <p className="text-xs text-emerald-300 capitalize">{profile.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-red-300 hover:bg-red-500/20 hover:text-red-200 w-full',
                        collapsed && 'justify-center'
                    )}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
