import Image from 'next/image';

import { DashboardNav } from '@/components/dashboard-nav';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col items-center gap-1 p-2">
              <span className="font-headline text-2xl font-bold text-primary">
                IRAS-DDH
              </span>
              <span className="text-xs text-muted-foreground text-center">
                Indian Railway Announcement System for Deaf and Hard of Hearing
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Can add breadcrumbs or other header content here */}
            </div>
            <UserNav />
          </header>
          <main className="flex-1 flex-col overflow-auto p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
