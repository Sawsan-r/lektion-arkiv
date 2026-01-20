import { useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Video,
    Settings,
    LogOut,
    GraduationCap,
    School,
    Home,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DashboardLayout = () => {
    const { user, signOut, roles } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const getNavItems = () => {
        const commonItems = [
            { title: "Hem", url: "/", icon: Home },
        ];

        if (roles.includes("system_admin")) {
            return [
                ...commonItems,
                { title: "Översikt", url: "/admin", icon: LayoutDashboard },
                { title: "Användare", url: "/admin/users", icon: Users },
                { title: "Inställningar", url: "/admin/settings", icon: Settings },
            ];
        }

        if (roles.includes("teacher")) {
            return [
                ...commonItems,
                { title: "Översikt", url: "/teacher", icon: LayoutDashboard },
            ];
        }

        if (roles.includes("student")) {
            return [
                ...commonItems,
                { title: "Översikt", url: "/student", icon: LayoutDashboard },
                { title: "Alla lektioner", url: "/student/lessons", icon: BookOpen },
            ];
        }

        return commonItems;
    };

    const navItems = getNavItems();

    const getRoleLabel = (roles: string[]) => {
        if (roles.includes('system_admin')) return 'ADMINISTRATÖR';
        if (roles.includes('teacher')) return 'LÄRARE';
        if (roles.includes('student')) return 'ELEV';
        return roles.join(', ').toUpperCase();
    };

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-white/5 bg-sidebar-background/80 backdrop-blur-xl">
                <SidebarHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 px-3 py-6">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center glow-primary shrink-0">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-black text-xl tracking-tighter text-white">Notera</span>
                            <span className="truncate text-[10px] font-bold tracking-[0.2em] text-primary uppercase">{getRoleLabel(roles)}</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent className="px-2 pt-4">
                    <SidebarGroup>
                        <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Huvudmeny</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname === item.url}
                                            tooltip={item.title}
                                            className="h-12 rounded-xl px-4 transition-all duration-300 hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group"
                                        >
                                            <Link to={item.url} className="flex items-center gap-3">
                                                <item.icon className="w-5 h-5 group-data-[active=true]:text-primary" />
                                                <span className="font-bold tracking-tight">{item.title}</span>
                                                {location.pathname === item.url && (
                                                    <ChevronRight className="ml-auto w-4 h-4 text-primary animate-in slide-in-from-left-2 duration-300" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="border-t border-white/5 p-4">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="h-14 rounded-xl px-2 data-[state=open]:bg-white/5 transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 rounded-xl border border-white/10">
                                            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ""} />
                                            <AvatarFallback className="rounded-xl bg-primary/20 text-primary font-black">
                                                {user?.email?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden ml-2">
                                            <span className="truncate font-bold text-sm text-white">{user?.email}</span>
                                            <span className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{getRoleLabel(roles)}</span>
                                        </div>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl glass-panel border-white/10 p-2"
                                    side="right"
                                    align="end"
                                    sideOffset={12}
                                >
                                    <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="h-12 rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                        <LogOut className="mr-3 h-5 w-5" />
                                        <span className="font-bold">Logga ut</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset className="bg-transparent">
                <header className="flex h-20 shrink-0 items-center gap-4 border-b border-white/5 px-8 backdrop-blur-xl bg-background/40 sticky top-0 z-10">
                    <SidebarTrigger className="-ml-2 h-10 w-10 rounded-xl hover:bg-white/5" />
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase">
                            {navItems.find(item => item.url === location.pathname)?.title || "Översikt"}
                        </h1>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI Status: Online</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-8 md:p-12 max-w-[1600px] mx-auto w-full">
                    <Outlet />
                </main>
            </SidebarInset>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="glass-panel border-white/10 max-w-md">
                    <AlertDialogHeader>
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
                            <LogOut className="w-8 h-8 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">
                            Logga ut?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-base">
                            Är du säker på att du vill logga ut från Notera?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 pt-4">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl glass-button border-white/10 font-bold">
                            Avbryt
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOut}
                            className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 font-bold"
                        >
                            Ja, logga ut
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    );
};

export default DashboardLayout;
