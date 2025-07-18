
'use client';

import {
  LayoutDashboard,
  Megaphone,
  MessageSquareWarning,
  Monitor,
  ShieldCheck,
  User,
  Settings,
  Users,
  Train,
  Building,
  Languages,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const links = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/trains',
    label: 'Train Timetables',
    icon: Train,
    adminOnly: true,
  },
  {
    href: '/dashboard/operator-timetable',
    label: 'Station Timetable',
    icon: Train,
    operatorOnly: true,
  },
  {
    href: '/dashboard/stations',
    label: 'Station Management',
    icon: Building,
    adminOnly: true,
  },
  {
    href: '/dashboard/announcements',
    label: 'Announcements',
    icon: Megaphone,
  },
  {
    href: '/dashboard/screens',
    label: 'Screen Management',
    icon: Monitor,
    adminOnly: true,
  },
  {
    href: '/dashboard/users',
    label: 'User Management',
    icon: Users,
    adminOnly: true,
  },
  {
    href: '/dashboard/multi-language-audio',
    label: 'Audio Management',
    icon: Languages,
    adminOnly: true,
  },
  {
    href: '/dashboard/template-announcements',
    label: 'Template Announcements',
    icon: Megaphone,
    adminOnly: true,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading skeleton
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      {links.map((link) => {
        if (link.adminOnly && user.role !== 'admin') {
          return null;
        }
        if (link.operatorOnly && user.role !== 'operator') {
          return null;
        }
        const isActive = pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard');

        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className={cn(
                'w-full justify-start',
                isActive &&
                'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              <Link href={link.href}>
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
